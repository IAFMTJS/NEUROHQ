"use client";

import { createClient } from "@/lib/supabase/client";
import { mergeBootstrapTodayIntoDailySnapshot } from "@/lib/bootstrap-today-mappers";
import type { InitializeResult } from "@/lib/daily-initialize";
import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";
import { getSnapshotValidityDayKey } from "@/lib/daily-date";
import {
  DAILY_INIT_RECORD_ID,
  getDailyInitRecord,
  putDailyInitRecord,
  type DailyInitPersistedRow,
} from "@/lib/neurohq-device-idb";
import { isCompatibleSnapshot, LATEST_SNAPSHOT_VERSION } from "@/types/daily-snapshot";

export async function readPersistedDailyInit(
  userId: string,
  validityDayKey: string
): Promise<InitializeResult | null> {
  const row = await getDailyInitRecord();
  if (!row) return null;
  if (row.userId !== userId || row.validityDayKey !== validityDayKey) return null;
  if (row.snapshotVersion !== LATEST_SNAPSHOT_VERSION) return null;
  if (!isCompatibleSnapshot(row.snapshot)) return null;
  return {
    kind: "fresh",
    snapshot: row.snapshot,
    bootstrapToday: row.bootstrapToday,
  };
}

export async function persistDailyInitResult(userId: string, result: InitializeResult): Promise<void> {
  const validityDayKey = getSnapshotValidityDayKey();
  const row: DailyInitPersistedRow = {
    id: DAILY_INIT_RECORD_ID,
    userId,
    validityDayKey,
    snapshotVersion: LATEST_SNAPSHOT_VERSION,
    savedAt: Date.now(),
    snapshot: result.snapshot,
    bootstrapToday: result.bootstrapToday,
  };
  await putDailyInitRecord(row);
}

/** After server merge or local mutations reflected in bootstrap JSON — overwrites IDB for next cold start. */
export async function patchPersistedDailyFromBootstrap(bootstrap: BootstrapTodayResponse): Promise<void> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  const validityDayKey = getSnapshotValidityDayKey();
  const row = await getDailyInitRecord();
  if (!row || row.userId !== userId || row.validityDayKey !== validityDayKey) return;
  if (!isCompatibleSnapshot(row.snapshot)) return;

  const merged = mergeBootstrapTodayIntoDailySnapshot(row.snapshot, bootstrap);
  const savedAt = Date.now();
  await putDailyInitRecord({
    ...row,
    snapshot: {
      ...merged,
      ui: {
        ...merged.ui,
        savedAt,
      },
    },
    bootstrapToday: bootstrap,
    savedAt,
  });
}

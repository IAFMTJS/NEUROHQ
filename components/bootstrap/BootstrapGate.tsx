"use client";

import { useCallback, useContext, createContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { BootstrapLoader } from "@/components/bootstrap/BootstrapLoader";
import { StoreHydrator } from "@/components/bootstrap/StoreHydrator";
import type { InitializeResult } from "@/lib/daily-initialize";
import {
  NEUROHQ_BOOTSTRAP_READY_FOR_WARMUP,
  NEUROHQ_DAILY_SNAPSHOT_UPDATED,
  type NeurohqDailySnapshotUpdatedDetail,
  seedBootstrapTodayInCache,
} from "@/lib/bootstrap-query";

type Props = {
  children: ReactNode;
};

const DailySnapshotContext = createContext<DailySnapshot | null>(null);

/** Same-day bootstrap payload: restored from IndexedDB on cold start when valid, else from network init. */
export function useDailySnapshot(): DailySnapshot | null {
  return useContext(DailySnapshotContext);
}

/**
 * Cold start: same calendar day + user may hydrate from IndexedDB (`readPersistedDailyInit`) for instant UI;
 * full `initializeDailySystem` runs on cache miss. `applyBootstrapTodayToApp` patches IDB for next launch.
 */
export function BootstrapGate({ children }: Props) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);

  const handleReady = useCallback(
    (result: InitializeResult) => {
      const dateStr = result.snapshot.date;
      seedBootstrapTodayInCache(queryClient, dateStr, result.bootstrapToday);
      const savedAt = result.snapshot.ui.savedAt ?? Date.now();
      const detail: NeurohqDailySnapshotUpdatedDetail = { savedAt };
      window.dispatchEvent(new CustomEvent(NEUROHQ_DAILY_SNAPSHOT_UPDATED, { detail }));
      (window as Window & { __neurohqBootstrapReady?: number }).__neurohqBootstrapReady = Date.now();
      window.dispatchEvent(new CustomEvent(NEUROHQ_BOOTSTRAP_READY_FOR_WARMUP));
      setSnapshot(result.snapshot);
      setReady(true);
    },
    [queryClient]
  );

  if (!ready) {
    return <BootstrapLoader onReady={handleReady} />;
  }

  return (
    <DailySnapshotContext.Provider value={snapshot}>
      <StoreHydrator snapshot={snapshot}>{children}</StoreHydrator>
    </DailySnapshotContext.Provider>
  );
}

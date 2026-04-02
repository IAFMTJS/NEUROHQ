"use client";

import { useCallback, useContext, createContext, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { BootstrapLoader } from "@/components/bootstrap/BootstrapLoader";
import { StoreHydrator } from "@/components/bootstrap/StoreHydrator";
import type { InitializeResult } from "@/lib/daily-initialize";
import {
  NEUROHQ_DAILY_SNAPSHOT_UPDATED,
  type NeurohqDailySnapshotUpdatedDetail,
  seedBootstrapTodayInCache,
} from "@/lib/bootstrap-query";

type Props = {
  children: ReactNode;
};

const DailySnapshotContext = createContext<DailySnapshot | null>(null);

/** In-memory bootstrap payload for the current session (no disk cache). */
export function useDailySnapshot(): DailySnapshot | null {
  return useContext(DailySnapshotContext);
}

/**
 * Runs one sequential bootstrap (`initializeDailySystem`) on first paint, then provides
 * the result to the tree. No localStorage / IndexedDB / snapshot repair loops.
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

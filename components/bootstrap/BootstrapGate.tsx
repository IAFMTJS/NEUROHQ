"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { DailySnapshot } from "@/types/daily-snapshot";
import {
  loadDailySnapshot,
  isCurrentSnapshot,
} from "@/lib/daily-snapshot-storage";
import { BootstrapLoader } from "@/components/bootstrap/BootstrapLoader";
import { StoreHydrator } from "@/components/bootstrap/StoreHydrator";
import type { InitializeResult } from "@/lib/daily-initialize";

type Props = {
  children: ReactNode;
};

const DailySnapshotContext = createContext<DailySnapshot | null>(null);

export function useDailySnapshot(): DailySnapshot | null {
  return useContext(DailySnapshotContext);
}

/**
 * Gate that ensures a DailySnapshot exists before rendering the dashboard shell.
 * Same-day snapshot from storage is used for the entire day (no refetch). New day
 * triggers full preload via BootstrapLoader. Exposes snapshot via context so
 * nested providers and StoreHydrator can consume it.
 */
export function BootstrapGate({ children }: Props) {
  const [ready, setReady] = useState(false);
  const [snapshot, setSnapshot] = useState<DailySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const existing = await loadDailySnapshot();
      if (cancelled) return;
      if (existing && isCurrentSnapshot(existing)) {
        setSnapshot(existing);
        setReady(true);
        return;
      }
      // No valid same-day snapshot: loader will run and call onReady when done.
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleReady = (result: InitializeResult) => {
    setSnapshot(result.snapshot);
    setReady(true);
  };

  if (!ready) {
    return <BootstrapLoader onReady={handleReady} />;
  }

  return (
    <DailySnapshotContext.Provider value={snapshot}>
      <StoreHydrator snapshot={snapshot}>{children}</StoreHydrator>
    </DailySnapshotContext.Provider>
  );
}



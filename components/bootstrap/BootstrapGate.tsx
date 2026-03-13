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
import type { InitializeResult } from "@/lib/daily-initialize";

type Props = {
  children: ReactNode;
};

const DailySnapshotContext = createContext<DailySnapshot | null>(null);

export function useDailySnapshot(): DailySnapshot | null {
  return useContext(DailySnapshotContext);
}

/**
 * Simple gate that ensures a DailySnapshot exists before rendering the dashboard shell.
 * It also exposes the snapshot via context so nested providers can consume it.
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
      }
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
      {children}
    </DailySnapshotContext.Provider>
  );
}



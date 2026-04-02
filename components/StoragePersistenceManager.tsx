"use client";

import { useEffect } from "react";
import { NEUROHQ_DAILY_SNAPSHOT_UPDATED } from "@/lib/bootstrap-query";

function requestDurableStorage() {
  if (typeof window === "undefined" || !("storage" in navigator)) return;
  const storage: Navigator["storage"] & { persist?: () => Promise<boolean>; persisted?: () => Promise<boolean> } =
    navigator.storage as Navigator["storage"] & { persist?: () => Promise<boolean>; persisted?: () => Promise<boolean> };
  if (!storage?.persist) return;
  storage
    .persisted?.()
    .then((isPersisted: boolean) => {
      if (isPersisted) return;
      return storage.persist?.();
    })
    .catch(() => {
      // Ignore persistence errors; browser may not support it.
    });
}

/**
 * Asks the browser for persistent quota (IndexedDB + Cache Storage less likely to be purged).
 * Re-runs when the daily snapshot is saved so PWA data stays classified as user-important.
 */
export function StoragePersistenceManager() {
  useEffect(() => {
    requestDurableStorage();
    const onSnapshotSaved = () => requestDurableStorage();
    window.addEventListener(NEUROHQ_DAILY_SNAPSHOT_UPDATED, onSnapshotSaved);
    return () => window.removeEventListener(NEUROHQ_DAILY_SNAPSHOT_UPDATED, onSnapshotSaved);
  }, []);

  return null;
}


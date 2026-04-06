"use client";

import { useEffect } from "react";
import { NEUROHQ_DAILY_SNAPSHOT_UPDATED } from "@/lib/bootstrap-query";
import { requestDurableStorage } from "@/lib/storage-persist";

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


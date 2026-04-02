"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";
import { schedulePatchDailySnapshotFromHQStore } from "@/lib/daily-snapshot-hq-patch";

/**
 * Keeps `neurohq-daily-snapshot-v1` aligned with local HQ mutations (missions, brain status,
 * DCIC game state, budget). Debounced; full server merge still runs on hide / periodic refresh.
 */
export function DailySnapshotHQMirror() {
  useEffect(() => {
    return useHQStore.subscribe(() => {
      schedulePatchDailySnapshotFromHQStore(450);
    });
  }, []);

  return null;
}

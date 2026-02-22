"use client";

import { useCallback } from "react";
import { addToQueue } from "@/lib/offline-queue";
import { completeTask } from "@/app/actions/tasks";

/** Call completeTask when online; when offline queue for sync. */
export function useOfflineCompleteTask() {
  const run = useCallback(async (id: string): Promise<void> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await addToQueue("completeTask", { id });
      return;
    }
    await completeTask(id);
  }, []);
  return run;
}

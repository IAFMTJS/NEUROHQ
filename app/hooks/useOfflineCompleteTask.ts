"use client";

import { useCallback } from "react";
import { addToQueue } from "@/lib/offline-queue";
import { completeTask, type CompleteTaskResult } from "@/app/actions/tasks";

/** Call completeTask when online; when offline queue for sync. Returns level-up info when online so UI can show "Level up!" toast. */
export function useOfflineCompleteTask() {
  const run = useCallback(async (id: string): Promise<CompleteTaskResult | void> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await addToQueue("completeTask", { id });
      return;
    }
    return completeTask(id);
  }, []);
  return run;
}

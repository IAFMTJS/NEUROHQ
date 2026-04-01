"use client";

import { useCallback } from "react";
import { addToQueue } from "@/lib/offline-queue";
import { completeTask } from "@/app/actions/tasks";
import type { CompleteTaskResult } from "@/app/actions/mission-completion-flow";

/** Call completeTask when online; when offline queue for sync. Returns level-up info when online so UI can show "Level up!" toast. */
export function useOfflineCompleteTask() {
  const run = useCallback(async (id: string, options?: { startedAt?: string | null }): Promise<CompleteTaskResult | void> => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await addToQueue("completeTask", { id, startedAt: options?.startedAt ?? null });
      return;
    }
    return completeTask(id, options);
  }, []);
  return run;
}

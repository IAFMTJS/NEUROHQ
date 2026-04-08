"use client";

import { useCallback } from "react";
import { addToQueue } from "@/lib/offline-queue";
import { completeTask } from "@/app/actions/tasks";
import type { CompleteTaskResult } from "@/app/actions/mission-completion-flow";
import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { patchTaskCompleteInEntityCache, queueCompleteTaskMutation } from "@/lib/data/tasks-repository";

export type OfflineCompleteOptions = {
  startedAt?: string | null;
  /** Calendar bucket `YYYY-MM-DD` for SQLite `entity_cache` (tasks list for that day). */
  date?: string;
};

/**
 * When mobile sync is enabled (Capacitor): patch local cache + outbox + background flush — instant on device.
 * Otherwise: online → `completeTask`; offline → legacy queue.
 */
export function useOfflineCompleteTask() {
  const run = useCallback(
    async (id: string, options?: OfflineCompleteOptions): Promise<CompleteTaskResult | void> => {
      const completedAtIso = new Date().toISOString();

      if (isSupabaseFirstMobileEnabled()) {
        const dateKey = options?.date;
        if (dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          await patchTaskCompleteInEntityCache(dateKey, id, completedAtIso);
        }
        await queueCompleteTaskMutation({
          taskId: id,
          completedAt: options?.startedAt ?? null,
        });
        return;
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await addToQueue("completeTask", { id, startedAt: options?.startedAt ?? null });
        return;
      }
      return completeTask(id, { startedAt: options?.startedAt ?? undefined });
    },
    []
  );
  return run;
}

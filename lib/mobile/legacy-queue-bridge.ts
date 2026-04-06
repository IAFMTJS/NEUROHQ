import type { OutboxActionType } from "@/lib/mobile/supabase-first-contract";

/** Maps IndexedDB offline-queue actions (TaskList / useOfflineCompleteTask) to SQLite outbox actions on native. */
export function mapLegacyQueueToOutbox(
  action: string,
  payload: unknown
): { action: OutboxActionType; payload: unknown } | null {
  switch (action) {
    case "completeTask": {
      const p = payload as { id?: string; startedAt?: string | null };
      if (!p?.id) return null;
      return {
        action: "task.complete",
        payload: { taskId: p.id, completedAt: p.startedAt ?? null },
      };
    }
    case "uncompleteTask": {
      const p = payload as { id?: string };
      if (!p?.id) return null;
      return { action: "task.uncomplete", payload: { taskId: p.id } };
    }
    case "deleteTask": {
      const p = payload as { id?: string };
      if (!p?.id) return null;
      return { action: "task.delete", payload: { taskId: p.id } };
    }
    case "snoozeTask": {
      const p = payload as { id?: string };
      if (!p?.id) return null;
      return { action: "task.snooze", payload: { taskId: p.id } };
    }
    case "skipNextOccurrence": {
      const p = payload as { id?: string };
      if (!p?.id) return null;
      return { action: "task.skip_next", payload: { taskId: p.id } };
    }
    case "rescheduleTask": {
      const p = payload as { id?: string; due_date?: string };
      if (!p?.id || !p.due_date) return null;
      return { action: "task.reschedule", payload: { taskId: p.id, due_date: p.due_date } };
    }
    case "duplicateTask": {
      const p = payload as { id?: string; due_date?: string };
      if (!p?.id || !p.due_date) return null;
      return { action: "task.duplicate", payload: { taskId: p.id, due_date: p.due_date } };
    }
    case "updateTask": {
      const p = payload as { id?: string; params?: Record<string, unknown> };
      if (!p?.id || !p.params || typeof p.params !== "object") return null;
      return { action: "task.update", payload: { taskId: p.id, params: p.params } };
    }
    default:
      return null;
  }
}

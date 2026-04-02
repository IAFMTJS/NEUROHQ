import type { Task } from "@/types/database.types";

/**
 * Merges a fresh server task list with tasks already in the client store.
 * After completeTask, GET /api/tasks can briefly return read-your-writes stale rows
 * (completed still false). Prefer local `completed: true` unless the server row has a
 * strictly newer `updated_at` (e.g. un-completed on another device).
 */
export function mergeTasksPreferringLocalCompletedWhenServerStale(
  existing: Task[],
  fromServer: Task[]
): Task[] {
  const localById = new Map(existing.map((t) => [t.id, t]));
  return fromServer.map((serverTask) => {
    const local = localById.get(serverTask.id);
    if (!local?.completed || serverTask.completed) {
      return serverTask;
    }
    const sTime = Date.parse(serverTask.updated_at);
    const lTime = Date.parse(local.updated_at);
    const serverKnowsNewer =
      !Number.isNaN(sTime) && !Number.isNaN(lTime) && sTime > lTime;
    if (serverKnowsNewer) {
      return serverTask;
    }
    return {
      ...serverTask,
      completed: true,
      completed_at: local.completed_at ?? serverTask.completed_at,
    };
  });
}

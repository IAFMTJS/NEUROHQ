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
  // A transient empty fetch (network/auth glitch) must not wipe the client store — that
  // breaks the UI after the first paint and makes completing tasks look "corrupt".
  if (fromServer.length === 0 && existing.length > 0) {
    return existing;
  }
  const localById = new Map(existing.map((t) => [t.id, t]));

  const mergeRow = (serverTask: Task): Task => {
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
  };

  const mergedCore = fromServer.map(mergeRow);

  // Non-empty but incomplete list (e.g. read lag, aborted JSON) would drop rows if we only
  // mapped `fromServer`. When every server row still exists locally and the list shrank,
  // keep local-only rows so tab refocus / bootstrap churn does not hollow the UI.
  const serverLooksLikeStalePartial =
    existing.length > 0 &&
    fromServer.length > 0 &&
    fromServer.length < existing.length &&
    fromServer.every((t) => localById.has(t.id));

  if (serverLooksLikeStalePartial) {
    const mergedIds = new Set(mergedCore.map((t) => t.id));
    const extras = existing.filter((t) => !mergedIds.has(t.id));
    return [...mergedCore, ...extras];
  }

  return mergedCore;
}

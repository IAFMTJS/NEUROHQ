"use client";

import type { Task } from "@/types/database.types";
import { enqueueOutboxAction } from "@/lib/mobile/outbox";
import { getEntityCacheRow, getSyncCheckpoint, upsertEntityCacheRow, upsertSyncCheckpoint } from "@/lib/mobile/db";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";
import { isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import { recordReadFresh, recordReadStale } from "@/lib/mobile/metrics";

const TASKS_STALE_MS = 45_000;

type TasksRepositoryResult = {
  tasks: Task[];
  stale: boolean;
  source: "server" | "cache";
};

function cacheKey(date: string): string {
  return `tasks:${date}`;
}

async function fetchTasksFromServer(date: string, signal?: AbortSignal): Promise<Task[]> {
  try {
    const checkpoint = await getSyncCheckpoint(`tasks:${date}`);
    const qs = new URLSearchParams({ domain: "tasks", date });
    if (checkpoint?.cursor) qs.set("cursor", checkpoint.cursor);
    const res = await fetch(`/api/mobile/sync/pull?${qs.toString()}`, {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error(`mobile-sync-pull ${res.status}`);
    const json = (await res.json()) as { payload?: Task[]; cursor?: string };
    if (!Array.isArray(json.payload)) throw new Error("mobile-sync-pull invalid tasks payload");
    if (json.cursor) {
      await upsertSyncCheckpoint({
        domain: `tasks:${date}`,
        cursor: json.cursor,
        updatedAt: Date.now(),
      });
    }
    return json.payload ?? [];
  } catch {
    // Fallback to existing stable endpoint so Supabase data still loads when mobile sync is unavailable.
    const res = await fetch(`/api/tasks?date=${encodeURIComponent(date)}`, {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) throw new Error(`Tasks ${res.status}`);
    return (await res.json()) as Task[];
  }
}

export async function getTasksForDateLocalFirst(
  date: string,
  options?: { signal?: AbortSignal; preferCache?: boolean }
): Promise<TasksRepositoryResult> {
  if (!isSupabaseFirstMobileEnabled()) {
    const tasks = await fetchTasksFromServer(date, options?.signal);
    return { tasks, stale: false, source: "server" };
  }

  const cached = await getEntityCacheRow(cacheKey(date));
  const now = Date.now();
  const canUseCache = cached != null && Array.isArray(cached.payload);
  const cacheFresh = canUseCache && cached.staleAt > now;

  if (canUseCache && (cacheFresh || options?.preferCache)) {
    if (cacheFresh) recordReadFresh();
    else recordReadStale();
    return {
      tasks: cached.payload as Task[],
      stale: !cacheFresh,
      source: "cache",
    };
  }

  const tasks = await fetchTasksFromServer(date, options?.signal);
  await upsertEntityCacheRow({
    key: cacheKey(date),
    payload: tasks,
    etag: null,
    serverVersion: null,
    fetchedAt: now,
    staleAt: now + TASKS_STALE_MS,
  });
  recordReadFresh();
  return { tasks, stale: false, source: "server" };
}

export async function queueCreateTaskMutation(payload: {
  title: string;
  due_date: string;
  energy_required?: number | null;
  priority?: number | null;
}): Promise<void> {
  if (!isSupabaseFirstMobileEnabled()) return;
  await enqueueOutboxAction({
    action: "task.create",
    payload,
  });
  void flushOutboxQueue();
}

export async function queueCompleteTaskMutation(payload: { taskId: string; completedAt?: string | null }): Promise<void> {
  if (!isSupabaseFirstMobileEnabled()) return;
  await enqueueOutboxAction({
    action: "task.complete",
    payload,
  });
  void flushOutboxQueue();
}


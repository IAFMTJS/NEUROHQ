"use client";

import { useEffect, useRef } from "react";
import { useHQStore } from "@/lib/hq-store";
import type { Task } from "@/types/database.types";
import { useMissionsSnapshot } from "@/components/missions";
import { getTodayKey } from "@/lib/daily-date";
import { mergeTasksPreferringLocalCompletedWhenServerStale } from "@/lib/merge-tasks-server-response";
import { getTasksForDateLocalFirst } from "@/lib/data/tasks-repository";

const EMPTY_TASKS: Task[] = [];

async function fetchTasksForDate(date: string, signal: AbortSignal): Promise<Task[]> {
  const result = await getTasksForDateLocalFirst(date, { signal, preferCache: false });
  return result.tasks;
}

/**
 * Bootstrap tasks for a given date into the device store.
 * - **Today**: always synced from the server (mount + tab focus) so other devices stay aligned.
 * - **Other days**: hydrate from snapshot when empty; otherwise one fetch; never block on stale `tasksStatus === "ready"` from another date.
 */
export function useTasksBootstrap(date: string) {
  const missionsSnapshot = useMissionsSnapshot();
  const setStatus = useHQStore((s) => s.setTasksStatus);
  const setError = useHQStore((s) => s.setTasksError);
  const setTasksForDate = useHQStore((s) => s.setTasksForDate);
  const visibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityFetchGenRef = useRef(0);

  useEffect(() => {
    const isToday = date === getTodayKey();
    const { tasksByDate, tasksStatus } = useHQStore.getState();
    const existing = tasksByDate[date] ?? EMPTY_TASKS;
    const snapshotTasks = missionsSnapshot?.tasksByDate?.[date] as Task[] | undefined;

    // Hydrate from daily snapshot only for non-today (today must come from API for cross-device correctness).
    if (
      !isToday &&
      snapshotTasks &&
      snapshotTasks.length > 0 &&
      existing.length === 0 &&
      tasksStatus === "idle"
    ) {
      setTasksForDate(date, snapshotTasks);
      setStatus("ready");
      setError(null);
      return;
    }

    // Non-today: keep local cache if we already have rows for this date.
    if (!isToday && existing.length > 0) return;

    const controller = new AbortController();
    let cancelled = false;

    const load = async (silent: boolean) => {
      if (!silent) {
        setStatus("loading");
        setError(null);
      }
      try {
        const tasks = await fetchTasksForDate(date, controller.signal);
        if (cancelled) return;
        const prior = useHQStore.getState().tasksByDate[date] ?? EMPTY_TASKS;
        const next =
          prior.length > 0
            ? mergeTasksPreferringLocalCompletedWhenServerStale(prior, tasks)
            : tasks;
        setTasksForDate(date, next);
        setStatus("ready");
        setError(null);
      } catch (err) {
        if (cancelled || (err instanceof Error && err.name === "AbortError")) return;
        if (!silent) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Failed to load tasks");
        }
      }
    };

    const silent = isToday && existing.length > 0;
    void load(silent);

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [date, missionsSnapshot, setError, setStatus, setTasksForDate]);

  // Refetch today when returning to the tab (another device may have completed tasks).
  useEffect(() => {
    const isToday = date === getTodayKey();
    if (!isToday || typeof document === "undefined") return;

    let abort: AbortController | null = null;

    const run = () => {
      if (document.visibilityState !== "visible") return;
      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current);
      visibilityDebounceRef.current = setTimeout(() => {
        visibilityDebounceRef.current = null;
        abort?.abort();
        abort = new AbortController();
        const signal = abort.signal;
        const gen = ++visibilityFetchGenRef.current;
        void (async () => {
          try {
            const tasks = await fetchTasksForDate(date, signal);
            if (gen !== visibilityFetchGenRef.current) return;
            const prior = useHQStore.getState().tasksByDate[date] ?? EMPTY_TASKS;
            const next =
              prior.length > 0
                ? mergeTasksPreferringLocalCompletedWhenServerStale(prior, tasks)
                : tasks;
            setTasksForDate(date, next);
            setStatus("ready");
            setError(null);
          } catch {
            // non-fatal; user still sees last store state
          }
        })();
      }, 400);
    };

    document.addEventListener("visibilitychange", run);
    return () => {
      document.removeEventListener("visibilitychange", run);
      if (visibilityDebounceRef.current) clearTimeout(visibilityDebounceRef.current);
      abort?.abort();
    };
  }, [date, setError, setStatus, setTasksForDate]);
}

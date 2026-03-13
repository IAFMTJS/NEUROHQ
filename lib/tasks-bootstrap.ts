"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";
import type { Task } from "@/types/database.types";
import { useMissionsSnapshot } from "@/components/missions";

const EMPTY_TASKS: Task[] = [];

/**
 * Bootstrap tasks for a given date into the device store.
 * First render can use persisted tasks; this hook only fills gaps by hitting the API.
 */
export function useTasksBootstrap(date: string) {
  const missionsSnapshot = useMissionsSnapshot();
  const status = useHQStore((s) => s.tasksStatus);
  const setStatus = useHQStore((s) => s.setTasksStatus);
  const setError = useHQStore((s) => s.setTasksError);
  const setTasksForDate = useHQStore((s) => s.setTasksForDate);
  const existingForDate = useHQStore((s) => s.tasksByDate[date] ?? EMPTY_TASKS);

  useEffect(() => {
    const snapshotTasks = missionsSnapshot?.tasksByDate?.[date] as Task[] | undefined;
    if (snapshotTasks && snapshotTasks.length > 0 && existingForDate.length === 0) {
      setTasksForDate(date, snapshotTasks);
      setStatus("ready");
      setError(null);
      return;
    }
    // If we already have tasks for this date persisted, don't block on network.
    if (existingForDate.length > 0 || status === "loading" || status === "ready") return;

    let cancelled = false;

    const load = async () => {
      setStatus("loading");
      setError(null);

      try {
        const res = await fetch(`/api/tasks?date=${encodeURIComponent(date)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Tasks ${res.status}`);
        const tasks = await res.json();
        if (!cancelled) {
          setTasksForDate(date, tasks);
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(
            err instanceof Error ? err.message : "Failed to load tasks"
          );
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    date,
    existingForDate.length,
    missionsSnapshot,
    setError,
    setStatus,
    setTasksForDate,
    status,
  ]);
}


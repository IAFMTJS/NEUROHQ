"use client";

import { useMemo } from "react";
import { useHQStore } from "@/lib/hq-store";
import type { Task } from "@/types/database.types";
import { TaskList } from "@/components/TaskList";

const EMPTY: Task[] = [];

type Props = {
  dateStr: string;
};

/**
 * Snapshot-first fallback while the server-rendered missions tab is still streaming.
 * Uses the HQ store, which is hydrated from DailySnapshot by MissionsProvider.
 */
export function TasksMissionsSnapshotFallback({ dateStr }: Props) {
  const tasks = useHQStore((s) => (s.tasksByDate[dateStr] ?? EMPTY) as Task[]);

  const { incomplete, completed } = useMemo(() => {
    const done: Task[] = [];
    const open: Task[] = [];
    for (const t of tasks) {
      if ((t as { completed?: boolean }).completed) done.push(t);
      else open.push(t);
    }
    return { incomplete: open, completed: done };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-4 text-sm text-[var(--text-muted)]">
        Loading missions…
      </div>
    );
  }

  return (
    <TaskList
      date={dateStr}
      tasks={incomplete}
      completedToday={completed}
      mode="normal"
      carryOverCount={0}
      blockedReasonByTaskId={{}}
    />
  );
}


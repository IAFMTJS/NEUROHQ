"use client";

import { useMemo } from "react";
import { useHQStore } from "@/lib/hq-store";
import type { Task } from "@/types/database.types";
import { useTasksBootstrap } from "@/lib/tasks-bootstrap";
import { TaskList } from "@/components/TaskList";
import { TodayMissionsGridFromStore } from "@/components/missions";

const EMPTY: Task[] = [];

type Props = {
  dateStr: string;
};

export function MissionsV2Client({ dateStr }: Props) {
  useTasksBootstrap(dateStr);

  const tasks = useHQStore((s) => (s.tasksByDate[dateStr] ?? EMPTY) as Task[]);

  const { incomplete, completed } = useMemo(() => {
    const open: Task[] = [];
    const done: Task[] = [];
    for (const t of tasks) {
      if ((t as { completed?: boolean }).completed) done.push(t);
      else open.push(t);
    }
    return { incomplete: open, completed: done };
  }, [tasks]);

  const hasAny = tasks.length > 0;

  return (
    <div className="space-y-6">
      <div data-tutorial="tasks-today">
        <div className="tasks-war-hide">
          <TodayMissionsGridFromStore dateStr={dateStr} />
        </div>
      </div>

      <div data-tutorial="tasks-list" id="tasks-list">
        {!hasAny ? (
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-4 text-sm text-[var(--text-muted)]">
            Loading missions…
          </div>
        ) : (
          <TaskList
            date={dateStr}
            tasks={incomplete}
            completedToday={completed}
            mode="normal"
            carryOverCount={0}
            blockedReasonByTaskId={{}}
          />
        )}
      </div>
    </div>
  );
}


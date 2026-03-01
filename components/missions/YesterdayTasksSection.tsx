"use client";

import { useState } from "react";
import { YesterdayTasksModal } from "@/components/YesterdayTasksModal";

type TaskRow = { id: string; title: string | null; completed: boolean };

type Props = {
  yesterdayTasks: TaskRow[];
  todayStr: string;
};

export function YesterdayTasksSection({ yesterdayTasks, todayStr }: Props) {
  const [open, setOpen] = useState(false);
  const incompleteCount = yesterdayTasks.filter((t) => !t.completed).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        aria-label="Bekijk taken van gisteren"
      >
        Gisteren
        {incompleteCount > 0 && (
          <span className="rounded-full bg-[var(--accent-warning)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent-warning)]">
            {incompleteCount}
          </span>
        )}
      </button>
      <YesterdayTasksModal
        open={open}
        onClose={() => setOpen(false)}
        yesterdayTasks={yesterdayTasks}
        todayStr={todayStr}
      />
    </>
  );
}

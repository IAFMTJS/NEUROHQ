"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTask } from "@/app/actions/tasks";
import { ScheduleModal } from "@/components/missions";

type BacklogTask = {
  id: string;
  title: string | null;
  due_date: string | null;
  category?: string | null;
};

type Props = { backlog: BacklogTask[]; todayDate: string };

export function BacklogList({ backlog, todayDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scheduleTask, setScheduleTask] = useState<BacklogTask | null>(null);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? backlog.filter((t) => (t.title ?? "").toLowerCase().includes(search.trim().toLowerCase()))
    : backlog;
  const displayList = filtered.slice(0, 20);

  function handleMoveToToday(id: string) {
    startTransition(async () => {
      await rescheduleTask(id, todayDate);
      router.refresh();
    });
  }

  function handleSchedule(date: string) {
    if (!scheduleTask) return;
    startTransition(async () => {
      await rescheduleTask(scheduleTask.id, date);
      setScheduleTask(null);
      router.refresh();
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Backlog & future</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Tasks with no date or later than today. Move to today or schedule.</p>
        {backlog.length > 3 && (
          <input
            type="search"
            placeholder="Search backlog…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            aria-label="Search backlog"
          />
        )}
      </div>
      <ul className="divide-y divide-[var(--card-border)]">
        {backlog.length > 0 && displayList.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">{t.title}</span>
              {t.due_date && <span className="ml-2 text-xs text-[var(--text-muted)]">— {t.due_date}</span>}
              {t.category && (
                <span className="ml-2 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                  {t.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMoveToToday(t.id)}
                disabled={pending}
                className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50"
              >
                Move to today
              </button>
              <button
                type="button"
                onClick={() => setScheduleTask(t)}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                Schedule
              </button>
            </div>
          </li>
        ))}
      </ul>
      {backlog.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">No backlog.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">All tasks are scheduled. Add new tasks on Missions and leave due date empty for backlog.</p>
        </div>
      )}
      {filtered.length > 20 && (
        <p className="px-4 py-2 text-xs text-[var(--text-muted)]">+ {filtered.length - 20} more</p>
      )}
      {scheduleTask && (
        <ScheduleModal
          open={!!scheduleTask}
          onClose={() => setScheduleTask(null)}
          initialDate={scheduleTask.due_date ?? todayDate}
          taskTitle={scheduleTask.title ?? undefined}
          onSchedule={handleSchedule}
          loading={pending}
        />
      )}
    </section>
  );
}

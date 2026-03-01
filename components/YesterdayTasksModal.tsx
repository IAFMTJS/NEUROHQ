"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";

type TaskRow = { id: string; title: string | null; completed: boolean };

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ISO weekday 1=Mon .. 7=Sun. */
function getISOWeekday(iso: string): number {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDay();
  return day === 0 ? 7 : day;
}

const WEEKDAY_SHORT: Record<number, string> = {
  1: "Ma",
  2: "Di",
  3: "Wo",
  4: "Do",
  5: "Vr",
  6: "Za",
  7: "Zo",
};

/** From today through end of week (Sunday). Max 7 entries. */
function getRestOfWeekDates(todayStr: string): { dateStr: string; label: string }[] {
  const out: { dateStr: string; label: string }[] = [];
  const today = new Date(todayStr + "T12:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = addDays(todayStr, i);
    const wd = getISOWeekday(d);
    const label = i === 0 ? "Vandaag" : WEEKDAY_SHORT[wd] ?? d.slice(8, 10);
    out.push({ dateStr: d, label });
  }
  return out;
}

type Props = {
  open: boolean;
  onClose: () => void;
  yesterdayTasks: TaskRow[];
  todayStr: string;
};

export function YesterdayTasksModal({
  open,
  onClose,
  yesterdayTasks,
  todayStr,
}: Props) {
  const router = useRouter();
  const [relocatingId, setRelocatingId] = useState<string | null>(null);
  const weekOptions = getRestOfWeekDates(todayStr);
  const incomplete = yesterdayTasks.filter((t) => !t.completed);
  const completed = yesterdayTasks.filter((t) => t.completed);

  async function handleRelocate(taskId: string, dueDate: string) {
    setRelocatingId(taskId);
    try {
      const res = await fetch("/api/tasks/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, dueDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Reschedule failed");
      }
      router.refresh();
    } finally {
      setRelocatingId(null);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Taken van gisteren" showBranding={false}>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Verplaats onafgemaakte taken naar vandaag of een dag later in de week.
      </p>
      {yesterdayTasks.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Geen taken voor gisteren.</p>
      ) : (
        <ul className="space-y-4" aria-label="Taken van gisteren">
          {incomplete.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)]/50 p-3"
            >
              <span className="font-medium text-[var(--text-primary)]">{task.title ?? "Taak"}</span>
              <div className="flex flex-wrap items-center gap-2">
                {weekOptions.map(({ dateStr, label }) => (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={relocatingId === task.id}
                    onClick={() => handleRelocate(task.id, dateStr)}
                    className="rounded-lg border border-[var(--accent-focus)]/50 bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50"
                  >
                    {relocatingId === task.id ? "…" : label}
                  </button>
                ))}
              </div>
            </li>
          ))}
          {completed.length > 0 && (
            <>
              <li className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Afgerond
              </li>
              {completed.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
                >
                  <span className="inline-block h-4 w-4 rounded border border-green-500/50 bg-green-500/10 text-center text-[10px] leading-4" aria-hidden>✓</span>
                  <span>{task.title ?? "Taak"}</span>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
        >
          Sluiten
        </button>
      </div>
    </Modal>
  );
}

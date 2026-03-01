"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTask } from "@/app/actions/tasks";
import { Modal } from "@/components/Modal";

type FutureTask = {
  id: string;
  title: string | null;
  due_date: string | null;
  category?: string | null;
  [key: string]: unknown;
};

type Props = {
  open: boolean;
  onClose: () => void;
  futureTasks: FutureTask[];
  todayDate: string;
  onScheduleClick: (task: FutureTask) => void;
  onEditClick: (task: FutureTask) => void;
  onDeleteClick: (id: string) => void;
};

function formatDateLabel(dateStr: string, todayDate: string) {
  if (dateStr === todayDate) return "Vandaag";
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date(todayDate + "T12:00:00");
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Morgen";
  if (diffDays === 2) return "Overmorgen";
  if (diffDays > 2 && diffDays <= 7) return `${dateStr} (over ${diffDays} dagen)`;
  return dateStr;
}

export function ToekomstModal({ open, onClose, futureTasks, todayDate, onScheduleClick, onEditClick, onDeleteClick }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const byDate = useMemo(() => {
    const map = new Map<string, FutureTask[]>();
    for (const t of futureTasks) {
      const d = t.due_date ?? "";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(t);
    }
    const dates = Array.from(map.keys()).sort();
    return dates.map((date) => ({ date, tasks: map.get(date)! }));
  }, [futureTasks]);

  function handleMoveToToday(id: string) {
    startTransition(async () => {
      await rescheduleTask(id, todayDate);
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Toekomst" size="lg" showBranding={false}>
      <p className="text-sm text-[var(--text-muted)]">
        Geplande taken per datum. Verplaats naar vandaag of wijzig de datum.
      </p>
      {futureTasks.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Geen toekomstige taken.</p>
        </div>
      ) : (
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-6">
          {byDate.map(({ date, tasks }) => (
            <section key={date}>
              <h3 className="sticky top-0 z-10 bg-[var(--bg-primary)] py-1 text-sm font-semibold text-[var(--text-primary)]">
                {formatDateLabel(date, todayDate)}
              </h3>
              <ul className="divide-y divide-[var(--card-border)]">
                {tasks.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t.title}</span>
                      {t.category && (
                        <span className="ml-2 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{t.category}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <button type="button" onClick={() => { onClose(); onEditClick(t); }} className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]">Bewerken</button>
                      <button type="button" onClick={() => handleMoveToToday(t.id)} disabled={pending} className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50">Naar vandaag</button>
                      <button type="button" onClick={() => { onClose(); onScheduleClick(t); }} className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]">Inplannen</button>
                      <button type="button" onClick={() => { onClose(); onDeleteClick(t.id); }} className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10">Verwijderen</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}

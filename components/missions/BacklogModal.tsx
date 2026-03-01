"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTask } from "@/app/actions/tasks";
import { Modal } from "@/components/Modal";

type BacklogTask = {
  id: string;
  title: string | null;
  due_date: string | null;
  category?: string | null;
  [key: string]: unknown;
};

type Props = {
  open: boolean;
  onClose: () => void;
  backlog: BacklogTask[];
  todayDate: string;
  onScheduleClick: (task: BacklogTask) => void;
  onEditClick: (task: BacklogTask) => void;
  onDeleteClick: (id: string) => void;
};

export function BacklogModal({ open, onClose, backlog, todayDate, onScheduleClick, onEditClick, onDeleteClick }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleMoveToToday(id: string) {
    startTransition(async () => {
      await rescheduleTask(id, todayDate);
      router.refresh();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Backlog" size="lg" showBranding={false}>
      <p className="text-sm text-[var(--text-muted)]">
        Onafgevinkte taken van voorgaande dagen of zonder datum. Verplaats naar vandaag of plan in.
      </p>
      {backlog.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Geen backlog.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Alle taken zijn gepland of voltooid.</p>
        </div>
      ) : (
        <ul className="mt-4 max-h-[60vh] divide-y divide-[var(--card-border)] overflow-y-auto">
          {backlog.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-1 py-2.5">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium text-[var(--text-primary)]">{t.title}</span>
                {t.due_date && <span className="ml-2 text-xs text-[var(--text-muted)]">— {t.due_date}</span>}
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
      )}
    </Modal>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { completeTask, deleteTask, snoozeTask } from "@/app/actions/tasks";
import type { SubtaskRow } from "@/app/actions/tasks";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type ExtendedTask = {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  category?: string | null;
  recurrence_rule?: string | null;
  recurrence_weekdays?: string | null;
  energy_required?: number | null;
  mental_load?: number | null;
  social_load?: number | null;
  notes?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  task: ExtendedTask;
  subtasks?: SubtaskRow[];
  onComplete?: () => void;
  onSnooze?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

function recurrenceLabel(task: ExtendedTask): string {
  if (!task.recurrence_rule) return "";
  if (task.recurrence_rule === "daily") return "Daily";
  if (task.recurrence_rule === "monthly") return "Monthly";
  if (task.recurrence_rule === "weekly" && task.recurrence_weekdays?.trim()) {
    const days = task.recurrence_weekdays.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= 7);
    if (days.length) return "Weekly (" + days.map((d) => WEEKDAY_LABELS[d] ?? d).join(", ") + ")";
  }
  return "Weekly";
}

export function TaskDetailsModal({
  open,
  onClose,
  task,
  subtasks = [],
  onComplete,
  onSnooze,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      await completeTask(task.id);
      onComplete?.();
      router.refresh();
      onClose();
    });
  }

  function handleSnooze() {
    startTransition(async () => {
      await snoozeTask(task.id);
      onSnooze?.();
      router.refresh();
      onClose();
    });
  }

  function handleDeleteClick() {
    if (onDelete) {
      onDelete();
      onClose();
    } else if (confirm("Delete this mission?")) {
      startTransition(async () => {
        await deleteTask(task.id);
        router.refresh();
        onClose();
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task.title}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!task.completed && (
            <>
              <button type="button" onClick={handleComplete} disabled={pending} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50">
                Complete
              </button>
              <button type="button" onClick={handleSnooze} disabled={pending} className="rounded-xl border border-[var(--card-border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)] disabled:opacity-50">
                Snooze
              </button>
            </>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} className="rounded-xl border border-[var(--card-border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)]">
              Edit
            </button>
          )}
          {onDuplicate && (
            <button type="button" onClick={onDuplicate} className="rounded-xl border border-[var(--card-border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent-neutral)]">
              Duplicate
            </button>
          )}
          <button type="button" onClick={handleDeleteClick} disabled={pending} className="rounded-xl border border-red-500/50 bg-transparent px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50">
            Delete
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {task.category && <span className="rounded-lg bg-[var(--accent-neutral)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">{task.category}</span>}
          {recurrenceLabel(task) && <span className="rounded-lg bg-[var(--accent-neutral)] px-2.5 py-1 text-xs text-[var(--text-muted)]">{recurrenceLabel(task)}</span>}
          {task.due_date && <span className="text-xs text-[var(--text-muted)]">Due {task.due_date}</span>}
          {task.energy_required != null && <span className="rounded-lg bg-[var(--accent-energy)]/20 px-2.5 py-1 text-xs font-medium text-[var(--accent-energy)]" title="Energy cost">⚡ {task.energy_required}</span>}
          {task.mental_load != null && <span className="rounded-lg bg-[var(--accent-focus)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]" title="Mental load">🧠 {task.mental_load}</span>}
          {task.social_load != null && <span className="rounded-lg bg-[var(--accent-focus)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]" title="Social load">👥 {task.social_load}</span>}
        </div>
        {task.notes?.trim() && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Notes</h3>
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--text-primary)]">{task.notes}</p>
          </section>
        )}
        {subtasks.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Subtasks</h3>
            <ul className="mt-1.5 space-y-1.5">
              {subtasks.map((s) => (
                <li key={s.id} className={`flex items-center gap-2.5 text-sm ${s.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}`}>
                  <span className={s.completed ? "text-[var(--accent-energy)]" : "text-[var(--text-muted)]"}>{s.completed ? "✓" : "○"}</span>
                  {s.title}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Modal>
  );
}

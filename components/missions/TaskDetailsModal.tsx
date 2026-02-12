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
    <Modal open={open} onClose={onClose} title={task.title} showBranding={false}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {task.category && <span className="rounded bg-neuro-surface px-2 py-0.5 text-xs font-medium text-neuro-muted">{task.category}</span>}
          {recurrenceLabel(task) && <span className="rounded bg-neuro-surface px-2 py-0.5 text-xs text-neuro-muted">{recurrenceLabel(task)}</span>}
          {task.due_date && <span className="text-xs text-neuro-muted">Due {task.due_date}</span>}
        </div>
        {task.notes?.trim() && (
          <div>
            <p className="text-xs font-medium text-neuro-muted">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neuro-silver">{task.notes}</p>
          </div>
        )}
        {subtasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-neuro-muted">Subtasks</p>
            <ul className="mt-1 space-y-1">
              {subtasks.map((s) => (
                <li key={s.id} className={`flex items-center gap-2 text-sm ${s.completed ? "text-neuro-muted line-through" : "text-neuro-silver"}`}>
                  <span className={s.completed ? "text-green-500" : ""}>{s.completed ? "✓" : "○"}</span>
                  {s.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-2 border-t border-neuro-border pt-4">
          {!task.completed && (
            <>
              <button type="button" onClick={handleComplete} disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                Complete
              </button>
              <button type="button" onClick={handleSnooze} disabled={pending} className="rounded-lg border border-neuro-border px-4 py-2 text-sm font-medium text-neuro-silver hover:bg-neuro-surface">
                Snooze
              </button>
            </>
          )}
          {onEdit && (
            <button type="button" onClick={onEdit} className="rounded-lg border border-neuro-border px-4 py-2 text-sm font-medium text-neuro-silver hover:bg-neuro-surface">
              Edit
            </button>
          )}
          {onDuplicate && (
            <button type="button" onClick={onDuplicate} className="rounded-lg border border-neuro-border px-4 py-2 text-sm font-medium text-neuro-silver hover:bg-neuro-surface">
              Duplicate
            </button>
          )}
          <button type="button" onClick={handleDeleteClick} disabled={pending} className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10">
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}

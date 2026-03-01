"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Modal } from "@/components/Modal";
import { deleteTask, logTaskEvent, snoozeTask } from "@/app/actions/tasks";
import { abandonTaskWithCost } from "@/app/actions/decision-cost";
import { useOfflineCompleteTask } from "@/app/hooks/useOfflineCompleteTask";
import type { SubtaskRow } from "@/app/actions/tasks";
import { baseXpToLevelLabel } from "@/lib/mission-templates";

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
  domain?: string | null;
  impact?: number | null;
  validation_type?: string | null;
  base_xp?: number | null;
};

/** Strategic impact preview (Performance Engine): XP, discipline, ROI, pressure, alignment. */
export type StrategicPreview = {
  domain?: string | null;
  alignmentImpactPct?: number;
  expectedXP?: number;
  disciplineImpact?: number;
  roi?: number;
  pressureEffect?: string;
  strategicValue?: number;
  psychologyLabel?: string | null;
  /** 0–1 energy match between user energy and task energy_required. */
  energyMatch?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  task: ExtendedTask;
  subtasks?: SubtaskRow[];
  strategicPreview?: StrategicPreview | null;
  onComplete?: (result?: import("@/app/actions/tasks").CompleteTaskResult) => void;
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

function expectedXPFromTask(task: ExtendedTask): number {
  if (task.base_xp != null && task.base_xp > 0) return task.base_xp;
  const impact = task.impact ?? 2;
  return Math.max(10, Math.min(100, impact * 35)) || 50;
}

function estimatedMinutesFromTask(task: ExtendedTask): number {
  const energy = Math.min(10, Math.max(1, task.energy_required ?? 3));
  return energy * 8;
}

function classifyEnergyMatch(score: number | undefined): "high" | "ok" | "low" | null {
  if (score == null) return null;
  if (score >= 0.7) return "high";
  if (score < 0.3) return "low";
  return "ok";
}

export function TaskDetailsModal({
  open,
  onClose,
  task,
  subtasks = [],
  strategicPreview,
  onComplete,
  onSnooze,
  onEdit,
  onDelete,
  onDuplicate,
}: Props) {
  const hasStrategic = strategicPreview && (strategicPreview.domain ?? strategicPreview.expectedXP ?? strategicPreview.roi != null);
  const fallbackXP = expectedXPFromTask(task);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const viewLoggedRef = useRef<string | null>(null);
  const energyMatchCategory = classifyEnergyMatch(strategicPreview?.energyMatch);
  const isLowSynergy = energyMatchCategory === "low";

  useEffect(() => {
    if (open && task.id && viewLoggedRef.current !== task.id) {
      viewLoggedRef.current = task.id;
      logTaskEvent({ taskId: task.id, eventType: "view" });
    }
    if (!open) viewLoggedRef.current = null;
  }, [open, task.id]);

  const completeTaskOffline = useOfflineCompleteTask();
  function handleComplete() {
    startTransition(async () => {
      const result = await completeTaskOffline(task.id);
      onComplete?.(result ?? undefined);
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
    if (task.completed) {
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
      return;
    }
    const ok = confirm("Annuleren kost XP -10% en +5 druk. Daarna verwijderen?");
    if (!ok) return;
    startTransition(async () => {
      await abandonTaskWithCost(task.id);
      if (onDelete) {
        onDelete();
        onClose();
      } else {
        await deleteTask(task.id);
        router.refresh();
        onClose();
      }
    });
  }

  function handleClose() {
    if (task.completed) {
      onClose();
      return;
    }
    const ok = confirm("Sluiten zonder voltooien kost XP -10% en +5 druk. Doorgaan?");
    if (!ok) return;
    startTransition(async () => {
      await abandonTaskWithCost(task.id);
      onClose();
      router.refresh();
    });
  }

  function handleEditClick() {
    if (task.completed) {
      onEdit?.();
      return;
    }
    const ok = confirm("Annuleren kost XP -10% en +5 druk. Doorgaan naar bewerken?");
    if (!ok) return;
    startTransition(async () => {
      await abandonTaskWithCost(task.id);
      onEdit?.();
      onClose();
      router.refresh();
    });
  }

  function handleDuplicateClick() {
    if (task.completed) {
      onDuplicate?.();
      return;
    }
    const ok = confirm("Annuleren kost XP -10% en +5 druk. Doorgaan naar dupliceren?");
    if (!ok) return;
    startTransition(async () => {
      await abandonTaskWithCost(task.id);
      onDuplicate?.();
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={task.title}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {!task.completed && (
            <>
              <button type="button" onClick={handleComplete} disabled={pending} className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50">
                Complete
              </button>
              <button type="button" onClick={handleSnooze} disabled={pending} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50">
                Snooze
              </button>
            </>
          )}
          {onEdit && (
            <button type="button" onClick={handleEditClick} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium">
              Edit
            </button>
          )}
          {onDuplicate && (
            <button type="button" onClick={handleDuplicateClick} className="btn-secondary rounded-xl px-4 py-2.5 text-sm font-medium">
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
          {(strategicPreview?.domain ?? task.domain) && (
            <span className="rounded-lg bg-[var(--accent-focus)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]" title="Strategy domain">
              🎯 {strategicPreview?.domain ?? task.domain}
            </span>
          )}
          {recurrenceLabel(task) && <span className="rounded-lg bg-[var(--accent-neutral)] px-2.5 py-1 text-xs text-[var(--text-muted)]">{recurrenceLabel(task)}</span>}
          {task.due_date && <span className="text-xs text-[var(--text-muted)]">Due {task.due_date}</span>}
          {task.energy_required != null && <span className="rounded-lg bg-[var(--accent-energy)]/20 px-2.5 py-1 text-xs font-medium text-[var(--accent-energy)]" title="Energy cost">⚡ {task.energy_required}</span>}
          {task.mental_load != null && <span className="rounded-lg bg-[var(--accent-focus)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]" title="Mental load">🧠 {task.mental_load}</span>}
          {task.social_load != null && <span className="rounded-lg bg-[var(--accent-focus)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]" title="Social load">👥 {task.social_load}</span>}
        </div>
        <section className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Verwachtingen</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-primary)]">
            <li>Geschatte tijd: <strong>~{estimatedMinutesFromTask(task)} min</strong></li>
            <li>Verwachte XP: <strong>{strategicPreview?.expectedXP ?? fallbackXP}</strong> {task.base_xp != null && task.base_xp > 0 && <span className="text-[var(--text-muted)]">({baseXpToLevelLabel(task.base_xp)})</span>}</li>
            {task.validation_type && (
              <li>Validatie: <strong>{task.validation_type === "binary" ? "Klaar / niet klaar" : task.validation_type === "structured" ? "Checklist" : "Review/approval"}</strong></li>
            )}
          </ul>
        </section>
        {hasStrategic && (
          <section className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Strategische impact</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-primary)]">
              {strategicPreview?.alignmentImpactPct != null && <li>Alignment: <strong>{strategicPreview.alignmentImpactPct > 0 ? "+" : ""}{strategicPreview.alignmentImpactPct}%</strong></li>}
              {strategicPreview?.disciplineImpact != null && <li>Discipline effect: <strong>{Math.round(strategicPreview.disciplineImpact * 100)}%</strong></li>}
              {strategicPreview?.roi != null && <li>ROI (XP/tijd): <strong>{Math.round(strategicPreview.roi)}%</strong></li>}
              {strategicPreview?.pressureEffect && <li>Pressure: {strategicPreview.pressureEffect}</li>}
              {strategicPreview?.strategicValue != null && <li>Strategische waarde: <strong>{Math.round(strategicPreview.strategicValue * 100)}%</strong></li>}
              {strategicPreview?.psychologyLabel && <li className="text-[var(--text-muted)]">Label: {strategicPreview.psychologyLabel}</li>}
            </ul>
          </section>
        )}
        {energyMatchCategory && (
          <section className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Energy match</h3>
            <p className="mt-2 text-sm text-[var(--text-primary)]">
              Energy match:&nbsp;
              <strong>
                {energyMatchCategory === "high" ? "hoog" : energyMatchCategory === "ok" ? "ok" : "laag"}
              </strong>
            </p>
            {isLowSynergy && (
              <>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Low synergy state · XP −25%, lagere kans op afronden. Beter om deze missie op een ander moment te plannen.
                </p>
                {task.due_date && (
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10"
                    onClick={() => {
                      if (pending) return;
                      startTransition(async () => {
                        const base = task.due_date ?? new Date().toISOString().slice(0, 10);
                        const d = new Date(base + "T12:00:00Z");
                        d.setUTCDate(d.getUTCDate() + 1);
                        const tomorrowStr = d.toISOString().slice(0, 10);
                        await snoozeTask(task.id);
                        onSnooze?.();
                        router.refresh();
                        onClose();
                      });
                    }}
                  >
                    Plan voor morgen
                  </button>
                )}
              </>
            )}
          </section>
        )}
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

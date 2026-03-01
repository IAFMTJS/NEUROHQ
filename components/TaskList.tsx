"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createTask, deleteTask, duplicateTask, restoreTask, snoozeTask, uncompleteTask, skipNextOccurrence } from "@/app/actions/tasks";
import { trackEvent } from "@/app/actions/analytics-events";
import { useOfflineCompleteTask } from "@/app/hooks/useOfflineCompleteTask";
import type { Task } from "@/types/database.types";
import type { SubtaskRow } from "@/app/actions/tasks";
import { nextRecurrenceDates, formatShortDate } from "@/lib/utils/recurrence";
import type { BrainMode } from "@/lib/brain-mode";
import {
  ConfirmModal,
  ScheduleModal,
  EditMissionModal,
  TaskDetailsModal,
  type StrategicPreview,
  FocusModal,
  AddMissionModal3,
} from "@/components/missions";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { ErrorWithNextStep } from "@/components/ui/ErrorWithNextStep";
import { useAppState } from "@/components/providers/AppStateProvider";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type ExtendedTask = Task & {
  category?: string | null;
  recurrence_rule?: string | null;
  recurrence_weekdays?: string | null;
  impact?: number | null;
  urgency?: number | null;
  mental_load?: number | null;
  social_load?: number | null;
  notes?: string | null;
  validation_type?: string | null;
};

type Props = {
  date: string;
  tasks: Task[];
  completedToday: Task[];
  mode: "normal" | "low_energy" | "stabilize" | "driven";
  carryOverCount: number;
  subtasksByParent?: Record<string, SubtaskRow[]>;
  /** Suggested number of tasks for today (from energy budget). After completing this many, show "Do another?" modal. */
  suggestedTaskCount?: number;
  /** Optional strategic preview per task (UMS, alignment, XP, ROI) for Performance Engine. */
  strategicByTaskId?: Record<string, StrategicPreview>;
  /** For Add Mission 3.0 Step 2: Primary (+30%), Secondary (+10%), Outside (-20%). */
  strategyMapping?: { primaryDomain: string; secondaryDomains: string[] } | null;
  /** Task IDs from decision blocks (top recommendation + alignment fix) for "Aanbevolen" filter. */
  recommendedTaskIds?: string[];
  /** Identity Engine snapshot for level-up modal (reputation bars). */
  identityLevel?: number;
  identityReputation?: { discipline: number; consistency: number; impact: number } | null;
  /** Brain mode for today, including focus slots and load-based risk. */
  brainMode?: BrainMode;
};

function recurrenceLabel(task: ExtendedTask): string {
  if (!task.recurrence_rule) return "";
  if (task.recurrence_rule === "daily") return "daily";
  if (task.recurrence_rule === "monthly") return "monthly";
  if (task.recurrence_rule === "weekly" && task.recurrence_weekdays?.trim()) {
    const days = task.recurrence_weekdays.split(",").map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => n >= 1 && n <= 7);
    if (days.length) return "weekly (" + days.map((d: number) => WEEKDAY_LABELS[d] ?? d).join(", ") + ")";
  }
  return "weekly";
}

function groupByCategory(tasks: ExtendedTask[]): { work: ExtendedTask[]; personal: ExtendedTask[]; other: ExtendedTask[] } {
  const work: ExtendedTask[] = [];
  const personal: ExtendedTask[] = [];
  const other: ExtendedTask[] = [];
  for (const t of tasks) {
    if (t.category === "work") work.push(t);
    else if (t.category === "personal") personal.push(t);
    else other.push(t);
  }
  return { work, personal, other };
}

export function TaskList({
  date,
  tasks: initialTasks,
  completedToday,
  mode,
  carryOverCount,
  subtasksByParent = {},
  suggestedTaskCount = 3,
  strategicByTaskId,
  strategyMapping,
  recommendedTaskIds,
  identityLevel,
  identityReputation,
  brainMode,
}: Props) {
  const router = useRouter();
  const sevenDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  }, []);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appState = useAppState();
  const completeTaskOffline = useOfflineCompleteTask();
  const [pending, startTransition] = useTransition();
  const [addDueDate, setAddDueDate] = useState(date);
  const [addError, setAddError] = useState<string | null>(null);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [showRoutine, setShowRoutine] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "aanbevolen" | "nieuw" | "work" | "personal" | "recurring">("all");
  const [detailsTask, setDetailsTask] = useState<ExtendedTask | null>(null);
  const [editTask, setEditTask] = useState<ExtendedTask | null>(null);
  const [focusTask, setFocusTask] = useState<ExtendedTask | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const addParam = searchParams.get("add");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (addParam && (/^\d{4}-\d{2}-\d{2}$/.test(addParam) || addParam === "today")) setQuickAddOpen(true);
  }, [addParam]);
  const [showDoAnotherModal, setShowDoAnotherModal] = useState(false);
  const [showAllTasksModal, setShowAllTasksModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number;
    reputation?: { discipline: number; consistency: number; impact: number } | null;
  } | null>(null);

  const extendedTasks = initialTasks as ExtendedTask[];
  const filteredTasks =
    filter === "all"
      ? extendedTasks
      : filter === "active"
        ? extendedTasks.filter((t) => !t.completed)
        : filter === "aanbevolen"
          ? extendedTasks.filter((t) => recommendedTaskIds?.includes(t.id))
          : filter === "nieuw"
            ? extendedTasks.filter((t) => {
                const c = (t as { created_at?: string }).created_at;
                if (!c) return false;
                return new Date(c) >= sevenDaysAgo;
              })
            : filter === "work"
              ? extendedTasks.filter((t) => t.category === "work")
              : filter === "personal"
                ? extendedTasks.filter((t) => t.category === "personal")
                : extendedTasks.filter((t) => !!t.recurrence_rule);
  const { work, personal, other } = groupByCategory(filteredTasks);
  const sections = [
    { label: "Werk", tasks: work },
    { label: "Persoonlijk", tasks: personal },
    { label: "Overig", tasks: other },
  ];
  const sectionsToShow = sections.some((s) => s.tasks.length > 0) ? sections : [{ label: "Vandaag", tasks: extendedTasks }];
  const flatIncompleteOrder: string[] = [];
  for (const s of sectionsToShow) {
    for (const t of s.tasks) {
      if (!t.completed) flatIncompleteOrder.push(t.id);
    }
  }
  const firstIncompleteId = flatIncompleteOrder[0] ?? null;
  const activeCount = extendedTasks.length;
  const maxSlots = brainMode?.maxSlots ?? Infinity;
  const slotsFilled = Number.isFinite(maxSlots) ? activeCount >= maxSlots : false;
  const addBlocked = brainMode?.addBlocked ?? false;
  const canAdd = !addBlocked && !slotsFilled;
  const limitMessage =
    addBlocked
      ? "Mentale belasting te hoog. Vandaag geen nieuwe missies toevoegen; afronden of uit je agenda halen."
      : slotsFilled
        ? "Je hebt je focus slots gevuld. Kies één missie om eerst af te maken of te verplaatsen; dan mag er weer één bij."
        : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setDetailsTask(null);
        setFocusTask(null);
        setQuickAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function showCompleteToast(
    taskId: string,
    result?: { performanceRank?: "S" | "A" | "B" | "C" | null; performanceScore?: number | null; xpAwarded?: number } | null
  ) {
    const rankLabel = result?.performanceRank ? ` · Rank ${result.performanceRank}` : "";
    const desc =
      result?.performanceScore != null
        ? `Score ${result.performanceScore}${result.xpAwarded != null ? ` · +${result.xpAwarded} XP` : ""}`
        : undefined;
    toast.success(`Mission voltooid${rankLabel}`, {
      description: desc,
      action: {
        label: "Ongedaan maken",
        onClick: () => {
          startTransition(async () => {
            await uncompleteTask(taskId);
            router.refresh();
          });
        },
      },
    });
  }

  function handleComplete(id: string) {
    const completedCountBefore = completedToday.length;
    startTransition(async () => {
      try {
        const result = await completeTaskOffline(id);
        trackEvent("mission_completed", { taskId: id });
        showCompleteToast(id, result ?? undefined);
        if (result?.levelUp && result.newLevel) {
          toast.success(`Level up · Level ${result.newLevel}`, {
            description:
              "Je performance-profiel is geüpdatet. Bekijk de details in de level-modal of op de XP-pagina.",
          });
          setLevelUpInfo({
            level: result.newLevel,
            reputation: (result as { reputation?: { discipline: number; consistency: number; impact: number } | null })
              .reputation ?? identityReputation ?? undefined,
          });
        }
        if (result?.lowSynergy) {
          toast.warning(
            "Low synergy state · XP −25%, lagere kans op afronden. Dit is een beslissing van de engine — beter om deze missie op een ander moment te plannen.",
            { duration: 7000 }
          );
        }
        appState?.triggerReward();
        if ((completedCountBefore + 1) >= suggestedTaskCount) {
          setDetailsTask(null);
          setFocusTask(null);
          setEditTask(null);
          setShowDoAnotherModal(true);
        }
        router.refresh();
      } catch {
        appState?.triggerError();
      }
    });
  }

  function handleDelete(id: string) {
    setDetailsTask(null);
    setFocusTask(null);
    setConfirmDeleteId(id);
  }

  function showDeleteToast(taskId: string) {
    toast.success("Mission verwijderd", {
      action: {
        label: "Ongedaan maken",
        onClick: () => {
          startTransition(async () => {
            await restoreTask(taskId);
            router.refresh();
          });
        },
      },
    });
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    await deleteTask(id);
    setConfirmDeleteId(null);
    showDeleteToast(id);
    router.refresh();
  }

  function handleDuplicate(task: ExtendedTask) {
    startTransition(async () => {
      await duplicateTask(task.id, date);
      router.refresh();
    });
  }

  function handleSnooze(id: string) {
    startTransition(async () => {
      await snoozeTask(id);
      router.refresh();
    });
  }

  function handleSkipNext(id: string) {
    startTransition(async () => {
      await skipNextOccurrence(id);
      router.refresh();
    });
  }

  function handleUncomplete(id: string) {
    startTransition(async () => {
      await uncompleteTask(id);
      router.refresh();
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement)?.value?.trim();
    const category = (form.elements.namedItem("category") as HTMLSelectElement)?.value as "" | "work" | "personal";
    const recurrence = (form.elements.namedItem("recurrence") as HTMLSelectElement)?.value as "" | "daily" | "weekly" | "monthly";
    const dueDateInput = (form.elements.namedItem("due_date") as HTMLInputElement)?.value;
    const dueDate = dueDateInput?.trim() || date;
    const impactRaw = (form.elements.namedItem("impact") as HTMLSelectElement)?.value;
    const urgencyRaw = (form.elements.namedItem("urgency") as HTMLSelectElement)?.value;
    const energyRaw = (form.elements.namedItem("energy") as HTMLSelectElement)?.value;
    const focusRaw = (form.elements.namedItem("focus_required") as HTMLSelectElement)?.value;
    const mentalLoadRaw = (form.elements.namedItem("mental_load") as HTMLSelectElement)?.value;
    const socialLoadRaw = (form.elements.namedItem("social_load") as HTMLSelectElement)?.value;
    const priorityRaw = (form.elements.namedItem("priority") as HTMLSelectElement)?.value;
    const impact = impactRaw ? parseInt(impactRaw, 10) : null;
    const urgency = urgencyRaw ? parseInt(urgencyRaw, 10) : null;
    const energy = energyRaw ? parseInt(energyRaw, 10) : null;
    const focusRequired = focusRaw ? parseInt(focusRaw, 10) : null;
    const mentalLoad = mentalLoadRaw ? parseInt(mentalLoadRaw, 10) : null;
    const socialLoad = socialLoadRaw ? parseInt(socialLoadRaw, 10) : null;
    const priority = priorityRaw ? parseInt(priorityRaw, 10) : null;
    const recurrence_weekdays = recurrence === "weekly" && weekdays.length > 0 ? weekdays.sort((a, b) => a - b).join(",") : null;
    if (!title) return;
    if (!canAdd && limitMessage) {
      setAddError(limitMessage);
      return;
    }
    startTransition(async () => {
      try {
        await createTask({
          title,
          due_date: dueDate,
          category: category === "work" ? "work" : category === "personal" ? "personal" : null,
          recurrence_rule: recurrence === "daily" ? "daily" : recurrence === "weekly" ? "weekly" : recurrence === "monthly" ? "monthly" : null,
          recurrence_weekdays: recurrence_weekdays ?? null,
          impact: impact && impact >= 1 && impact <= 3 ? impact : null,
          urgency: urgency && urgency >= 1 && urgency <= 3 ? urgency : null,
          energy_required: energy && energy >= 1 && energy <= 10 ? energy : null,
          focus_required: focusRequired && focusRequired >= 1 && focusRequired <= 10 ? focusRequired : null,
          mental_load: mentalLoad && mentalLoad >= 1 && mentalLoad <= 10 ? mentalLoad : null,
          social_load: socialLoad && socialLoad >= 1 && socialLoad <= 10 ? socialLoad : null,
          priority: priority && priority >= 1 && priority <= 5 ? priority : null,
        });
        form.reset();
        setAddDueDate(date);
        setWeekdays([]);
        setShowRoutine(false);
        router.refresh();
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "Failed to add task");
      }
    });
  }

  const showLevelModal = !!levelUpInfo;

  function LevelReputationBars() {
    if (!levelUpInfo?.reputation) return null;
    const rep = levelUpInfo.reputation;
    const entries: { label: string; key: keyof typeof rep }[] = [
      { label: "Discipline", key: "discipline" },
      { label: "Consistentie", key: "consistency" },
      { label: "Impact", key: "impact" },
    ];
    return (
      <div className="mt-4 space-y-2">
        {entries.map((e) => (
          <div key={e.key} className="flex items-center gap-2">
            <span className="w-24 text-xs text-[var(--text-muted)]">{e.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[var(--accent-focus)]"
                style={{ width: `${Math.min(100, rep[e.key])}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-[var(--text-secondary)]">
              {Math.round(rep[e.key])}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const levelModalFooter = showLevelModal ? (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={() => setLevelUpInfo(null)}
        className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] sm:flex-none sm:px-4"
      >
        Doorgaan
      </button>
      <button
        type="button"
        onClick={() => {
          setLevelUpInfo(null);
          router.push("/xp");
        }}
        className="inline-flex flex-1 items-center justify-center rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-sm font-medium text-black hover:opacity-90 sm:flex-none sm:px-4"
      >
        Naar XP Command Center
      </button>
    </div>
  ) : null;

  function handleAddSubtask(parentId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubtaskError(null);
    const form = e.currentTarget;
    const title = (form.elements.namedItem("subtask-title") as HTMLInputElement)?.value?.trim();
    if (!title) return;
    startTransition(async () => {
      try {
        await createTask({ title, due_date: date, parent_task_id: parentId });
        form.reset();
        router.refresh();
      } catch (err) {
        setSubtaskError(err instanceof Error ? err.message : "Failed to add subtask");
      }
    });
  }

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }
  const showAvoidance = carryOverCount >= 3 && carryOverCount < 5;

  function recurrencePreview(task: ExtendedTask): string {
    if (!task.recurrence_rule || !task.due_date) return "";
    const next = nextRecurrenceDates(task.due_date, task.recurrence_rule, task.recurrence_weekdays, 3);
    if (next.length === 0) return "";
    return "Next: " + next.map(formatShortDate).join(", ");
  }

  function renderTask(task: ExtendedTask, isFirstIncomplete: boolean) {
    const subtasks = subtasksByParent[task.id] ?? [];
    const preview = recurrencePreview(task);
    return (
      <li key={task.id} className="space-y-1">
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; setFocusTask(null); setDetailsTask(task); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFocusTask(null); setDetailsTask(task); } }}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
            task.completed
              ? "border-[var(--card-border)] bg-[var(--bg-surface)]/50 opacity-70"
              : task.carry_over_count > 0
                ? "border-amber-500/50 bg-amber-500/10"
                : isFirstIncomplete
                  ? "border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/5"
                  : "border-[var(--card-border)] bg-[var(--bg-surface)]/50"
          }`}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!task.completed) handleComplete(task.id); }}
            disabled={pending || task.completed}
            className={`h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${
              task.completed ? "border-green-500 bg-green-500/20 text-green-400" : "border-neutral-500 bg-transparent hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 text-transparent"
            } disabled:opacity-50`}
            aria-label={task.completed ? "Completed" : "Complete task"}
          >
            {task.completed && <span className="text-sm">✓</span>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isFirstIncomplete && !task.completed && (
                <span className="rounded bg-[var(--accent-focus)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">Today&apos;s mission</span>
              )}
              {task.carry_over_count > 0 && !task.completed && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Carried over</span>
              )}
              {task.category && (
                <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{task.category}</span>
              )}
              {task.energy_required != null && (
                <span className="rounded bg-[var(--accent-energy)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-energy)]" title="Energy cost">⚡{task.energy_required}</span>
              )}
              {task.mental_load != null && (
                <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-300" title="Mental load">🧠{task.mental_load}</span>
              )}
              {task.social_load != null && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/80" title="Social load">👥{task.social_load}</span>
              )}
              <span className={`text-sm text-[var(--text-primary)] ${task.completed ? "line-through text-[var(--text-muted)]" : ""}`}>{task.title}</span>
            </div>
            {recurrenceLabel(task) && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{recurrenceLabel(task)}</p>}
            {preview && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{preview}</p>}
          </div>
          {isFirstIncomplete && !task.completed && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setDetailsTask(null); setFocusTask(task); }} className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10">
              Focus
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDetailsTask(null); setFocusTask(null); setEditTask(task); }}
            className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--accent-focus)]"
            title="Naam, energy en andere velden bewerken"
          >
            Bewerken
          </button>
          {!task.completed && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSnooze(task.id); }}
                disabled={pending}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--accent-focus)]"
              >
                Snooze
              </button>
              {task.recurrence_rule && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSkipNext(task.id); }}
                  disabled={pending}
                  className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--accent-focus)]"
                  title="Skip next occurrence (move to the following date)"
                >
                  Skip next
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
            disabled={pending}
            className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
          >
            Delete
          </button>
        </div>
        {subtasks.length > 0 && (
          <ul className="ml-9 space-y-1 border-l-2 border-white/10 pl-3">
            {subtasks.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() =>
                    !s.completed &&
                    startTransition(() => {
                      void completeTaskOffline(s.id);
                    })
                  }
                  disabled={pending || s.completed}
                  className="h-4 w-4 shrink-0 rounded border border-neutral-500"
                  aria-label={s.completed ? "Completed" : "Complete subtask"}
                >
                  {s.completed && <span className="text-xs">✓</span>}
                </button>
                <span className={s.completed ? "line-through text-neutral-500" : "text-neutral-400"}>{s.title}</span>
              </li>
            ))}
          </ul>
        )}
        {subtaskError && <p className="ml-9 mt-1 text-xs text-red-400" role="alert">{subtaskError}</p>}
        {canAdd && (
          <form onSubmit={(e) => handleAddSubtask(task.id, e)} className="ml-9 flex gap-2">
            <input name="subtask-title" type="text" placeholder="Add subtask…" className="flex-1 rounded-lg border border-white/10 bg-[var(--bg-primary)] px-2 py-1 text-xs text-white placeholder-neutral-500" />
            <button type="submit" disabled={pending} className="rounded-lg px-2 py-1 text-xs text-[var(--accent-focus)]">Add</button>
          </form>
        )}
      </li>
    );
  }

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Today&apos;s missions <span className="font-medium text-[var(--accent-focus)]">· Commander</span>
            </h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">100 templates · XP per missie · One focus at a time</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setDetailsTask(null); setFocusTask(null); setQuickAddOpen(true); }}
              className="rounded-full bg-[var(--accent-focus)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:opacity-95 hover:shadow-[0_0_16px_rgba(37,99,235,0.5)]"
            >
              + Nieuwe missie (100 templates)
            </button>
            {mode === "stabilize" && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">Stabilize mode</span>}
            {initialTasks.length + completedToday.length > 0 && (
              <button
                type="button"
                onClick={() => { setDetailsTask(null); setFocusTask(null); setShowAllTasksModal(true); }}
                className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                All tasks ({initialTasks.length + completedToday.length})
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        {showAvoidance && (
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{carryOverCount} tasks carried over. Pick one to focus on.</p>
        )}

        {filteredTasks.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", "active", "aanbevolen", "nieuw", "work", "personal", "recurring"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  filter === f ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                }`}
              >
                {f === "all" ? "Alles" : f === "active" ? "Actief" : f === "aanbevolen" ? "Aanbevolen" : f === "nieuw" ? "Nieuw" : f === "work" ? "Werk" : f === "personal" ? "Persoonlijk" : "Terugkerend"}
              </button>
            ))}
          </div>
        )}

        {initialTasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-5 text-center text-sm text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text-secondary)]">Geen taken vandaag.</p>
            <p className="mt-2">
              Probeer een korte oefening van 5 min — voeg hieronder een missie toe, of zeg tegen de assistant: &quot;voeg taak X toe&quot;.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <a href="/assistant" className="inline-block rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--accent-focus)]/30">
                Naar assistant
              </a>
              <span className="text-[var(--text-muted)]">of voeg hieronder toe</span>
            </div>
          </div>
        ) : (
          sectionsToShow.map((section) => (
            <div key={section.label} className={section.label !== "Vandaag" ? "mb-4" : ""}>
              {section.label !== "Vandaag" && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{section.label}</h3>}
              {section.tasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-[var(--card-border)]/50 bg-[var(--bg-surface)]/30 px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                  Geen {section.label === "Vandaag" ? "missies vandaag" : `${section.label.toLowerCase()} missies`}. Voeg er één toe of verplaats uit backlog.
                </p>
              ) : (
                <ul className="space-y-2">
                  {section.tasks.map((t) => {
                    const isFirstIncomplete = !t.completed && firstIncompleteId === t.id;
                    return renderTask(t, isFirstIncomplete);
                  })}
                </ul>
              )}
            </div>
          ))
        )}

        {addError && (
          <div className="mt-2">
            <ErrorWithNextStep
              message={addError}
              nextStep="Controleer de velden en probeer opnieuw, of voeg via de assistant toe."
              recoveryHref="/assistant"
              recoveryLabel="Naar assistant"
            />
          </div>
        )}

        {canAdd && (
          <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/30 p-4">
            <button type="button" onClick={() => setShowRoutine((v) => !v)} className="mb-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {showRoutine ? "− Simple form" : "+ Routine & options (category, weekly days, impact)"}
            </button>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <input name="title" type="text" placeholder="Add a mission…" className="flex-1 min-w-[140px] rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30" required />
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Due</span>
                  <input name="due_date" type="date" value={addDueDate} onChange={(e) => setAddDueDate(e.target.value)} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm text-[var(--text-primary)]" aria-label="Due date" />
                </label>
                <select name="category" className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2.5 text-sm text-[var(--text-primary)]" aria-label="Category">
                  <option value="">Category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>
                <select name="recurrence" className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2.5 text-sm text-[var(--text-primary)]" aria-label="Recurrence">
                  <option value="">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Energy</span>
                  <select name="energy" className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2.5 text-sm text-[var(--text-primary)]" aria-label="Energy (1-10)">
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">Add</button>
              </div>
              {showRoutine && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-primary)]/50 p-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)]">Repeat on (weekly)</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <button key={d} type="button" onClick={() => toggleWeekday(d)} className={`rounded px-2 py-1 text-xs ${weekdays.includes(d) ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                          {WEEKDAY_LABELS[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Impact (1–3)</span>
                    <select name="impact" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                      <option value="">—</option>
                      <option value="1">1 Low</option>
                      <option value="2">2 Medium</option>
                      <option value="3">3 High</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Importance</span>
                    <select name="urgency" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]" title="Urgent = must do; Low = ok to skip">
                      <option value="">—</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">Urgent</option>
                    </select>
                  </label>
                  <div className="col-span-2 flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">Brain: Energy, Focus, Mentale belasting</div>
                  <label className="flex flex-1 min-w-[80px] flex-col gap-1">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Energy (1–10)</span>
                      <select name="energy" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-1 min-w-[80px] flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Focus (1–10)</span>
                      <select name="focus_required" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-1 min-w-[80px] flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Mentale belasting (1–10)</span>
                      <select name="mental_load" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-1 min-w-[80px] flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Social (1–10)</span>
                      <select name="social_load" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-1 min-w-[80px] flex-col gap-1">
                      <span className="text-xs font-medium text-[var(--text-muted)]">Priority (1–5)</span>
                      <select name="priority" className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                </div>
              )}
            </form>
          </div>
        )}
        {!canAdd && limitMessage && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {limitMessage}
          </p>
        )}

        {canAdd && (
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => { setDetailsTask(null); setFocusTask(null); setQuickAddOpen(true); }} className="rounded-full border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20">
              + Nog een missie (templates)
            </button>
          </div>
        )}

        {detailsTask && (
          <TaskDetailsModal
            open={!!detailsTask}
            onClose={() => setDetailsTask(null)}
            task={detailsTask}
            subtasks={subtasksByParent[detailsTask.id]}
            strategicPreview={strategicByTaskId?.[detailsTask.id]}
            onComplete={(res) => showCompleteToast(detailsTask.id, res)}
            onEdit={() => { setDetailsTask(null); setEditTask(detailsTask); }}
            onDuplicate={() => { handleDuplicate(detailsTask); setDetailsTask(null); }}
            onDelete={() => { setDetailsTask(null); setConfirmDeleteId(detailsTask.id); }}
          />
        )}
        {editTask && (
          <EditMissionModal open={!!editTask} onClose={() => setEditTask(null)} task={editTask} onSaved={() => setEditTask(null)} />
        )}
        {focusTask && (
          <FocusModal
            open={!!focusTask}
            onClose={() => setFocusTask(null)}
            taskId={focusTask.id}
            taskTitle={focusTask.title}
            date={date}
            taskDomain={strategicByTaskId?.[focusTask.id]?.domain ?? (focusTask as { domain?: string | null }).domain ?? null}
            strategyMapping={strategyMapping ?? null}
            onComplete={() => setFocusTask(null)}
            onSnooze={() => setFocusTask(null)}
            energyMatchScore={strategicByTaskId?.[focusTask.id]?.energyMatch}
          />
        )}
        <ConfirmModal
          open={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          title="Delete mission?"
          message="This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
        />
        <AddMissionModal3
          open={quickAddOpen}
          onClose={() => { setQuickAddOpen(false); if (addParam) router.replace(pathname); }}
          date={addParam === "today" || !addParam ? date : addParam && /^\d{4}-\d{2}-\d{2}$/.test(addParam) ? addParam : date}
          strategyMapping={strategyMapping}
          onAdded={() => { setQuickAddOpen(false); if (addParam) router.replace(pathname); }}
          headroomTierToday={brainMode?.tier}
          activeCountToday={activeCount}
          maxSlotsToday={maxSlots === Infinity ? undefined : maxSlots}
          addBlockedToday={addBlocked}
        />

        <Modal open={showDoAnotherModal} onClose={() => setShowDoAnotherModal(false)} title="Nice work!" size="sm">
          <p className="text-sm text-[var(--text-muted)]">You&apos;ve hit your suggested minimum for today. Want to do one more?</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowDoAnotherModal(false)} className="flex-1 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">Maybe later</button>
            <button type="button" onClick={() => { setShowDoAnotherModal(false); }} className="flex-1 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-sm font-medium text-white hover:opacity-90">Keep going</button>
          </div>
        </Modal>

        <Modal open={showAllTasksModal} onClose={() => setShowAllTasksModal(false)} title="All today&apos;s tasks" size="lg">
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {([...extendedTasks, ...(completedToday as ExtendedTask[])] as ExtendedTask[]).filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i).map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-surface)]/30 px-3 py-2 text-sm">
                <span className={t.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}>{t.title}</span>
                {t.completed && <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">Done</span>}
                {t.energy_required != null && <span className="rounded bg-[var(--accent-energy)]/20 px-1.5 py-0.5 text-[10px] text-[var(--accent-energy)]">⚡{t.energy_required}</span>}
              </li>
            ))}
          </ul>
        </Modal>

        <Modal
          open={showLevelModal}
          onClose={() => setLevelUpInfo(null)}
          title={levelUpInfo ? `Level up · Level ${levelUpInfo.level}` : "Level up"}
          subtitle={
            identityLevel != null && levelUpInfo
              ? `Je bent van level ${identityLevel} naar level ${levelUpInfo.level} gegaan.`
              : "Je performance-profiel is geüpdatet."
          }
          footer={levelModalFooter}
          size="md"
          showBranding
        >
          <p className="text-sm text-[var(--text-secondary)]">
            Je discipline-, consistentie- en impact-scores zijn vernieuwd. Hieronder zie je je huidige reputatiebalken.
          </p>
          <LevelReputationBars />
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Voltooi consistente missies binnen je strategie om deze balken verder te laten groeien.
          </p>
        </Modal>

        {completedToday.length > 0 && (
          <div className="mt-6 border-t border-[var(--card-border)] pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Done today</h3>
            <ul className="space-y-1">
              {(completedToday as ExtendedTask[]).map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-surface)]/30 px-3 py-2 text-sm text-[var(--text-muted)] line-through">
                  <button
                    type="button"
                    onClick={() => handleUncomplete(t.id)}
                    disabled={pending}
                    className="h-6 w-6 shrink-0 rounded-lg border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 hover:border-green-400 disabled:opacity-50"
                    aria-label="Mark incomplete"
                    title="Mark incomplete (e.g. if done by accident)"
                  >
                    <span className="text-sm">✓</span>
                  </button>
                  {t.title}
                  {t.category && <span className="rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px]">{t.category}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

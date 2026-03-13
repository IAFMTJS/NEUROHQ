"use client";

import { useState, useTransition, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createTask, deleteTask, duplicateTask, restoreTask, snoozeTask, uncompleteTask, skipNextOccurrence } from "@/app/actions/tasks";
import { trackEvent } from "@/app/actions/analytics-events";
import { useOfflineCompleteTask } from "@/app/hooks/useOfflineCompleteTask";
import { addToQueue } from "@/lib/offline-queue";
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
} from "@/components/missions";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { ErrorWithNextStep } from "@/components/ui/ErrorWithNextStep";
import { useAppState } from "@/components/providers/AppStateProvider";
import { addBonusAutoMissionsForToday } from "@/app/actions/master-missions";
import { useHQStore } from "@/lib/hq-store";
import { useTasksBootstrap } from "@/lib/tasks-bootstrap";

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
  psychology_label?: string | null;
};

const EMPTY_TASKS: ExtendedTask[] = [];

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
  const selectStoredTasks = useCallback((s: any) => s.tasksByDate[date] ?? EMPTY_TASKS, [date]);
  const selectSetTasksForDate = useCallback((s: any) => s.setTasksForDate, []);
  const selectUpsertTask = useCallback((s: any) => s.upsertTask, []);
  const selectRemoveTask = useCallback((s: any) => s.removeTask, []);
  const storedTasks = useHQStore(selectStoredTasks);
  const setTasksForDate = useHQStore(selectSetTasksForDate);
  const upsertTask = useHQStore(selectUpsertTask);
  const removeTask = useHQStore(selectRemoveTask);
  useTasksBootstrap(date);
  const [pending, startTransition] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "aanbevolen" | "nieuw" | "work" | "personal" | "recurring">("all");
  const [detailsTask, setDetailsTask] = useState<ExtendedTask | null>(null);
  const [editTask, setEditTask] = useState<ExtendedTask | null>(null);
  const [focusTask, setFocusTask] = useState<ExtendedTask | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  /** ID of task just removed; animate it out then clear (no re-render flash). */
  const [removingId, setRemovingId] = useState<string | null>(null);
  const addParam = searchParams.get("add");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addFullOpen, setAddFullOpen] = useState(false);

  useEffect(() => {
    if (addParam && (/^\d{4}-\d{2}-\d{2}$/.test(addParam) || addParam === "today")) setAddFullOpen(true);
  }, [addParam]);
  const [showDoAnotherModal, setShowDoAnotherModal] = useState(false);
  const [showAllTasksModal, setShowAllTasksModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{
    level: number;
    reputation?: { discipline: number; consistency: number; impact: number } | null;
    rankPromotion?: boolean;
    newRank?: string;
    previousRank?: string;
  } | null>(null);
  const [optimisticCompleteIds, setOptimisticCompleteIds] = useState<string[]>([]);
  /** IDs currently syncing complete to server — only those buttons show disabled (per-action feedback). */
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  /** Per-action pending: only the affected row is disabled. */
  const [snoozingIds, setSnoozingIds] = useState<Set<string>>(new Set());
  const [skipNextIds, setSkipNextIds] = useState<Set<string>>(new Set());
  /** Parent task id when adding a subtask — only that form shows disabled. */
  const [addingSubtaskParentId, setAddingSubtaskParentId] = useState<string | null>(null);
  /** Tasks added this session (modal/simple form) so they show without reload; only for due_date === date */
  const [localTasksAdded, setLocalTasksAdded] = useState<ExtendedTask[]>([]);
  /** Local copy of subtasks so device store mutations + server calls don't require a full refresh. */
  const [localSubtasksByParent, setLocalSubtasksByParent] = useState<Record<string, SubtaskRow[]>>(subtasksByParent);

  useEffect(() => {
    setLocalSubtasksByParent(subtasksByParent);
  }, [subtasksByParent]);

  useEffect(() => {
    if (storedTasks.length === 0 && initialTasks.length > 0) {
      setTasksForDate(date, initialTasks);
    }
  }, [date, initialTasks, setTasksForDate, storedTasks.length]);

  // DailySnapshot + MissionsProvider already handle first-paint missions data; no extra per-suffix cache needed here.

  const extendedTasks = useMemo(() => {
    const fromServer = (storedTasks.length > 0 ? storedTasks : initialTasks) as ExtendedTask[];
    const ids = new Set(fromServer.map((t) => t.id));
    const added = localTasksAdded.filter((t) => t.due_date === date && !ids.has(t.id));
    return [...fromServer, ...added];
  }, [storedTasks, initialTasks, localTasksAdded, date]);
  const incompleteTasksForDisplay = useMemo(
    () => extendedTasks.filter((t) => !t.completed && !optimisticCompleteIds.includes(t.id)),
    [extendedTasks, optimisticCompleteIds]
  );
  const completedForDisplay = useMemo(
    () =>
      [
        ...(completedToday as ExtendedTask[]),
        ...extendedTasks
          .filter((t) => t.completed || optimisticCompleteIds.includes(t.id))
          .map((t) => ({ ...t, completed: true, completed_at: new Date().toISOString() } as ExtendedTask)),
      ] as ExtendedTask[],
    [completedToday, extendedTasks, optimisticCompleteIds]
  );

  const filteredTasks =
    filter === "all"
      ? incompleteTasksForDisplay
      : filter === "active"
        ? incompleteTasksForDisplay
        : filter === "aanbevolen"
          ? incompleteTasksForDisplay.filter((t) => recommendedTaskIds?.includes(t.id))
          : filter === "nieuw"
            ? incompleteTasksForDisplay.filter((t) => {
                const c = (t as { created_at?: string }).created_at;
                if (!c) return false;
                return new Date(c) >= sevenDaysAgo;
              })
            : filter === "work"
              ? incompleteTasksForDisplay.filter((t) => t.category === "work")
              : filter === "personal"
                ? incompleteTasksForDisplay.filter((t) => t.category === "personal")
                : incompleteTasksForDisplay.filter((t) => !!t.recurrence_rule);
  const activeCount = incompleteTasksForDisplay.length;
  const overCapacity = Number.isFinite(suggestedTaskCount) && activeCount >= suggestedTaskCount;
  const isAutoMission = (t: ExtendedTask) => (t as { psychology_label?: string | null }).psychology_label === "MasterPoolAuto";
  const primaryTasks = overCapacity ? filteredTasks.filter((t) => !isAutoMission(t as ExtendedTask)) : filteredTasks;
  const optionalAutoTasks = overCapacity ? filteredTasks.filter((t) => isAutoMission(t as ExtendedTask)) : [];
  const { work, personal, other } = groupByCategory(primaryTasks as ExtendedTask[]);
  const sections: { label: string; tasks: ExtendedTask[] }[] = [
    { label: "Werk", tasks: work },
    { label: "Persoonlijk", tasks: personal },
    { label: "Overig", tasks: other },
  ];
  if (optionalAutoTasks.length > 0) {
    sections.push({ label: "Bij capaciteit · optioneel", tasks: optionalAutoTasks as ExtendedTask[] });
  }
  const sectionsToShow = sections.some((s) => s.tasks.length > 0) ? sections : [{ label: "Vandaag", tasks: extendedTasks }];
  const flatIncompleteOrder: string[] = [];
  for (const s of sectionsToShow) {
    for (const t of s.tasks) {
      if (!t.completed) flatIncompleteOrder.push(t.id);
    }
  }
  const firstIncompleteId = flatIncompleteOrder[0] ?? null;
  const maxSlots = brainMode?.maxSlots ?? Infinity;
  const slotsFilled = Number.isFinite(maxSlots) ? activeCount >= maxSlots : false;
  const addBlocked = brainMode?.addBlocked ?? false;
  const canAdd = !addBlocked && !slotsFilled;
  const limitMessage =
    addBlocked
      ? "Let op: hoge mentale belasting vandaag — je kunt nog steeds missies toevoegen (bijv. lichte of voor een andere dag)."
      : slotsFilled
        ? "Let op: je focus slots zijn vol. Je kunt nog steeds toevoegen; overweeg eerst iets af te ronden of te verplaatsen."
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
    const rankLabel = result?.performanceRank ? ` · Prestatie ${result.performanceRank}` : "";
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
    const completedCountBefore = completedForDisplay.length;
    const task = extendedTasks.find((t) => t.id === id);
    if (task) {
      upsertTask({
        ...task,
        completed: true,
        completed_at: new Date().toISOString(),
      } as Task);
    }
    setOptimisticCompleteIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setCompletingIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      try {
        const result = await completeTaskOffline(id);
        trackEvent("mission_completed", { taskId: id });
        showCompleteToast(id, result ?? undefined);
        if (result?.levelUp && result.newLevel) {
          const rankPromotion = (result as { rankPromotion?: boolean; newRank?: string; previousRank?: string }).rankPromotion;
          const newRank = (result as { newRank?: string }).newRank;
          const previousRank = (result as { previousRank?: string }).previousRank;
          toast.success(
            rankPromotion && newRank
              ? `Rank promotion · ${newRank}`
              : `Level up · Level ${result.newLevel}`,
            {
              description:
                rankPromotion && newRank
                  ? `Van ${previousRank ?? "?"} naar ${newRank}. Bekijk je nieuwe perks in de level-modal.`
                  : "Je performance-profiel is geüpdatet. Bekijk de details in de level-modal of op de XP-pagina.",
            }
          );
          setLevelUpInfo({
            level: result.newLevel,
            reputation: (result as { reputation?: { discipline: number; consistency: number; impact: number } | null })
              .reputation ?? identityReputation ?? undefined,
            ...(rankPromotion ? { rankPromotion: true, newRank, previousRank } : {}),
          });
        }
        if (result?.lowSynergy) {
          toast.warning(
            "Low synergy state · XP −25%, lagere kans op afronden. Dit is een beslissing van de engine — beter om deze missie op een ander moment te plannen.",
            { duration: 7000 }
          );
        }
        appState?.triggerReward();
        if (completedCountBefore + 1 >= suggestedTaskCount) {
          setDetailsTask(null);
          setFocusTask(null);
          setEditTask(null);
          setShowDoAnotherModal(true);
        }
        router.refresh();
      } catch {
        if (task) {
          upsertTask(task as Task);
        }
        appState?.triggerError();
      } finally {
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        if (typeof navigator !== "undefined" && navigator.onLine) {
          setOptimisticCompleteIds((prev) => prev.filter((x) => x !== id));
        }
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
    setConfirmDeleteId(null);
    setRemovingId(id);
    window.setTimeout(() => {
      removeTask(id, date);
      setRemovingId(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue("deleteTask", { id });
      } else {
        deleteTask(id);
      }
      showDeleteToast(id);
    }, 320);
    // No router.refresh() — UI already updated from store; undo toast will refresh if needed.
  }

  function handleDuplicate(task: ExtendedTask) {
    startTransition(async () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await addToQueue("duplicateTask", { id: task.id, due_date: date });
        return;
      }
      await duplicateTask(task.id, date);
      router.refresh();
    });
  }

  function handleSnooze(id: string) {
    setSnoozingIds((prev) => new Set(prev).add(id));
    removeTask(id, date);
    startTransition(async () => {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await addToQueue("snoozeTask", { id });
        } else {
          await snoozeTask(id);
          router.refresh();
        }
      } finally {
        setSnoozingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      }
    });
  }

  function handleSkipNext(id: string) {
    setSkipNextIds((prev) => new Set(prev).add(id));
    removeTask(id, date);
    startTransition(async () => {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await addToQueue("skipNextOccurrence", { id });
        } else {
          await skipNextOccurrence(id);
          router.refresh();
        }
      } finally {
        setSkipNextIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      }
    });
  }

  function handleUncomplete(id: string) {
    startTransition(async () => {
      const task = completedForDisplay.find((t) => t.id === id);
      if (task) {
        upsertTask({
          ...task,
          completed: false,
          completed_at: null,
        } as Task);
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await addToQueue("uncompleteTask", { id });
      } else {
        await uncompleteTask(id);
      }
      // No router.refresh() — list already updated from upsertTask.
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
    setAddingSubtaskParentId(parentId);
    startTransition(async () => {
      try {
        const result = await createTask({ title, due_date: date, parent_task_id: parentId });
        if (result?.task) {
          const task = result.task as Task;
          upsertTask(task);
          const asSubtask: SubtaskRow = {
            id: task.id,
            title: task.title ?? "",
            completed: task.completed ?? false,
            created_at: (task as { created_at?: string }).created_at ?? new Date().toISOString(),
            parent_task_id: (task as { parent_task_id?: string | null }).parent_task_id ?? parentId,
            due_date: (task as { due_date?: string | null }).due_date ?? date,
          };
          setLocalSubtasksByParent((prev) => {
            const current = prev[parentId] ?? [];
            return { ...prev, [parentId]: [...current, asSubtask] };
          });
        }
        form.reset();
      } catch (err) {
        setSubtaskError(err instanceof Error ? err.message : "Failed to add subtask");
      } finally {
        setAddingSubtaskParentId(null);
      }
    });
  }

  const showAvoidance = carryOverCount >= 3 && carryOverCount < 5;

  function recurrencePreview(task: ExtendedTask): string {
    if (!task.recurrence_rule || !task.due_date) return "";
    const next = nextRecurrenceDates(task.due_date, task.recurrence_rule, task.recurrence_weekdays, 3);
    if (next.length === 0) return "";
    return "Next: " + next.map(formatShortDate).join(", ");
  }

  function renderTask(task: ExtendedTask, isFirstIncomplete: boolean) {
    const subtasks = localSubtasksByParent[task.id] ?? [];
    const preview = recurrencePreview(task);
    const isRemoving = task.id === removingId;
    return (
      <li
        key={task.id}
        className={`space-y-1 transition-all duration-300 ease-out ${isRemoving ? "task-row-removing" : ""}`}
      >
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
            disabled={task.completed || completingIds.has(task.id)}
            className={`h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${
              task.completed ? "border-green-500 bg-green-500/20 text-green-400" : "border-neutral-500 bg-transparent hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 text-transparent"
            } disabled:opacity-50`}
            aria-label={task.completed ? "Completed" : completingIds.has(task.id) ? "Saving…" : "Complete task"}
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
            {task.notes?.trim() && (
              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]" title={task.notes}>
                {task.notes}
              </p>
            )}
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
                disabled={snoozingIds.has(task.id)}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--accent-focus)]"
              >
                {snoozingIds.has(task.id) ? "…" : "Snooze"}
              </button>
              {task.recurrence_rule && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSkipNext(task.id); }}
                  disabled={skipNextIds.has(task.id)}
                  className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--accent-focus)]/10 hover:text-[var(--accent-focus)]"
                  title="Skip next occurrence (move to the following date)"
                >
                  {skipNextIds.has(task.id) ? "…" : "Skip next"}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
            disabled={!!confirmDeleteId}
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
                  onClick={() => {
                    if (s.completed) return;
                    setLocalSubtasksByParent((prev) => {
                      const current = prev[task.id] ?? [];
                      const next = current.map((row) =>
                        row.id === s.id ? { ...row, completed: true } : row
                      );
                      return { ...prev, [task.id]: next };
                    });
                    const existing = extendedTasks.find((t) => t.id === s.id);
                    if (existing) {
                      upsertTask({
                        ...(existing as Task),
                        completed: true,
                        completed_at: new Date().toISOString(),
                      } as Task);
                    }
                    startTransition(() => {
                      void completeTaskOffline(s.id);
                    });
                  }}
                  disabled={s.completed}
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
        {!canAdd && limitMessage && <p className="ml-9 mb-1 text-xs text-[var(--text-muted)]">{limitMessage}</p>}
        <form onSubmit={(e) => handleAddSubtask(task.id, e)} className="ml-9 flex gap-2">
          <input name="subtask-title" type="text" placeholder="Add subtask…" className="flex-1 rounded-lg border border-white/10 bg-[var(--bg-primary)] px-2 py-1 text-xs text-white placeholder-neutral-500" />
          <button type="submit" disabled={addingSubtaskParentId === task.id} className="rounded-lg px-2 py-1 text-xs text-[var(--accent-focus)]">{addingSubtaskParentId === task.id ? "…" : "Add"}</button>
        </form>
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
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Volledige taakformulier · XP per missie</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setDetailsTask(null); setFocusTask(null); setAddFullOpen(true); }}
              className="rounded-full bg-[var(--accent-focus)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] hover:opacity-95 hover:shadow-[0_0_16px_rgba(37,99,235,0.5)]"
            >
              + Taak toevoegen
            </button>
            {mode === "stabilize" && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">Stabilize mode</span>}
            {incompleteTasksForDisplay.length + completedForDisplay.length > 0 && (
              <button
                type="button"
                onClick={() => { setDetailsTask(null); setFocusTask(null); setShowAllTasksModal(true); }}
                className="rounded-full border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                All tasks ({incompleteTasksForDisplay.length + completedForDisplay.length})
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
              {section.label !== "Vandaag" && (
                <h3 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${section.label.startsWith("Bij capaciteit") ? "text-[var(--text-muted)]/80 italic" : "text-[var(--text-muted)]"}`}>
                  {section.label}
                </h3>
              )}
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

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => { setDetailsTask(null); setFocusTask(null); setAddFullOpen(true); }}
            className="rounded-full border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20"
          >
            + Taak toevoegen
          </button>
        </div>

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
        <EditMissionModal
          open={!!editTask || addFullOpen || quickAddOpen}
          onClose={() => { setEditTask(null); setAddFullOpen(false); setQuickAddOpen(false); if (addParam) router.replace(pathname); }}
          task={editTask ?? null}
          defaultDate={addParam && /^\d{4}-\d{2}-\d{2}$/.test(addParam) ? addParam : date}
          onSaved={() => setEditTask(null)}
          onAddOptimistic={({ title: t, due_date: d }) => {
            if (d !== date) return undefined;
            const tempId = `temp-${Date.now()}`;
            const placeholder: ExtendedTask = {
              id: tempId,
              title: t || "…",
              due_date: d,
              completed: false,
              created_at: new Date().toISOString(),
            } as ExtendedTask;
            setLocalTasksAdded((prev) => [...prev, placeholder]);
            return tempId;
          }}
          onAdded={(task, tempId) => {
            setLocalTasksAdded((prev) => prev.filter((t) => t.id !== tempId));
            if (task) {
              upsertTask(task as Task);
              if ((task as ExtendedTask).due_date === date) setLocalTasksAdded((prev) => [...prev, task as ExtendedTask]);
            }
            setAddFullOpen(false);
            setQuickAddOpen(false);
            if (addParam) router.replace(pathname);
            router.refresh();
          }}
        />
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
          slideFromBottom
          onConfirm={handleConfirmDelete}
        />
        <Modal open={showDoAnotherModal} onClose={() => setShowDoAnotherModal(false)} title="Nice work!" size="sm">
          <p className="text-sm text-[var(--text-muted)]">
            Je hebt je minimale missie-doel voor vandaag geraakt. Wil je 2 bonusmissies uit de pool toevoegen?
          </p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setShowDoAnotherModal(false)} className="flex-1 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]">Maybe later</button>
            <button
              type="button"
              onClick={() => {
                setShowDoAnotherModal(false);
                startTransition(async () => {
                  try {
                    await addBonusAutoMissionsForToday();
                    toast.success("2 bonusmissies toegevoegd.");
                    router.refresh();
                  } catch {
                    toast.error("Bonusmissies toevoegen is niet gelukt. Probeer later opnieuw.");
                  }
                });
              }}
              className="flex-1 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Voeg 2 bonusmissies toe
            </button>
          </div>
        </Modal>

        <Modal open={showAllTasksModal} onClose={() => setShowAllTasksModal(false)} title="All today&apos;s tasks" size="lg">
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {([...incompleteTasksForDisplay, ...completedForDisplay] as ExtendedTask[]).filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i).map((t) => (
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
          title={
            levelUpInfo?.rankPromotion && levelUpInfo.newRank
              ? `Rank promotion · ${levelUpInfo.newRank}`
              : levelUpInfo
                ? `Level up · Level ${levelUpInfo.level}`
                : "Level up"
          }
          subtitle={
            levelUpInfo?.rankPromotion && levelUpInfo.previousRank && levelUpInfo.newRank
              ? `Van ${levelUpInfo.previousRank} naar ${levelUpInfo.newRank}.`
              : identityLevel != null && levelUpInfo
                ? `Je bent van level ${identityLevel} naar level ${levelUpInfo.level} gegaan.`
                : "Je performance-profiel is geüpdatet."
          }
          footer={levelModalFooter}
          size="md"
          showBranding
        >
          {levelUpInfo?.rankPromotion && levelUpInfo.newRank && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <p className="text-sm font-medium text-amber-200">Rank promotion</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Je bent nu <strong className="text-amber-400">{levelUpInfo.newRank}</strong>. Nieuwe perks zijn beschikbaar in je profiel.
              </p>
            </div>
          )}
          <p className="text-sm text-[var(--text-secondary)]">
            Je discipline-, consistentie- en impact-scores zijn vernieuwd. Hieronder zie je je huidige reputatiebalken.
          </p>
          <LevelReputationBars />
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Voltooi consistente missies binnen je strategie om deze balken verder te laten groeien.
          </p>
        </Modal>

        {completedForDisplay.length > 0 && (
          <div className="mt-6 border-t border-[var(--card-border)] pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Done today</h3>
            <ul className="space-y-1">
              {completedForDisplay.map((t) => (
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

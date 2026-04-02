"use client";

import { useState, useTransition, useEffect, useMemo, useCallback, useRef, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createTask,
  deleteTask,
  duplicateTask,
  restoreTask,
  snoozeTask,
  uncompleteTask,
  skipNextOccurrence,
  rescheduleTask,
} from "@/app/actions/tasks";
import type { CompleteTaskResult } from "@/app/actions/mission-completion-flow";
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
import { EnergyCapBar } from "@/components/missions/EnergyCapBar";
import { DoneTodayToast } from "@/components/missions/DoneTodayToast";
import { MissionsEngineWarningIcon } from "@/components/missions/MissionsEngineWarningIcon";
import { collectMissionEngineWarningLines } from "@/lib/mission-engine-warnings";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { Modal } from "@/components/Modal";
import { ErrorWithNextStep } from "@/components/ui/ErrorWithNextStep";
import { useAppState } from "@/components/providers/AppStateProvider";
import { addBonusAutoMissionsForToday } from "@/app/actions/master-missions";
import { useHQStore } from "@/lib/hq-store";
import { useTasksBootstrap } from "@/lib/tasks-bootstrap";
import { refreshMergedSnapshotFromNetwork } from "@/lib/daily-bootstrap";
import { parseMissionProgressionFromTaskTags } from "@/lib/mission-progression";
import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { NeuroMicroReportBar } from "@/components/missions/NeuroMicroReportBar";
import { BacklogAndToekomstTriggers } from "@/components/missions/BacklogAndToekomstTriggers";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type ExtendedTask = Task & {
  category?: string | null;
  task_type?: string | null;
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
  /** When set, complete/start is disabled and reason is shown (system gate: recovery / energy). */
  blockedReasonByTaskId?: Record<string, string>;
  /** Settings: show optional micro-report bar after skip/snooze (server also enforces opt-in). */
  neuroSelfReportOptIn?: boolean;
  energyCap?: { used: number; cap: number; remaining: number; planned: number } | null;
  /** Mode banner etc. Consequence + focus-slot hints are merged into MissionsEngineWarningIcon. */
  missionsContextBelowHero?: ReactNode;
  /** Backlog / Toekomst uitklap — shown only on the missions "backlog" subtab when set. */
  missionsBacklogShelf?: {
    backlog: { id: string; title: string | null; due_date: string | null; category?: string | null }[];
    futureTasks: { id: string; title: string | null; due_date: string | null; category?: string | null }[];
    todayDate: string;
  } | null;
  /** Recovery / energy consequence flags (missions page); merged with focus-slot limitMessage in the warning icon. */
  missionEngineWarnings?: {
    energyDepleted?: boolean;
    recoveryOnly?: boolean;
    recoveryProtocol?: boolean;
    daysSinceLastCompletion?: number;
    zeroCompletionPenalty?: boolean;
    burnout?: boolean;
  };
};

function isRoutineTask(task: ExtendedTask): boolean {
  return !!task.recurrence_rule?.trim() || task.task_type === "routine";
}

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

function expectedXpForMission(task: ExtendedTask, strategic?: StrategicPreview | null): number {
  if (strategic?.expectedXP != null) return strategic.expectedXP;
  const bx = (task as { base_xp?: number | null }).base_xp;
  if (bx != null && bx > 0) return bx;
  const impact = task.impact ?? 2;
  return Math.max(10, Math.min(100, impact * 35)) || 50;
}

/** Realistic time hint when duration_minutes is missing (energy-based bracket). */
function formatMissionTimeFrame(task: ExtendedTask): string {
  const dm = (task as { duration_minutes?: number | null }).duration_minutes;
  if (dm != null && dm > 0) {
    if (dm < 60) return `±${dm} min`;
    const h = Math.floor(dm / 60);
    const m = dm % 60;
    return m > 0 ? `±${h}u ${m}m` : `±${h} u`;
  }
  const e = task.energy_required;
  if (e != null) {
    if (e <= 2) return "±10–20 min";
    if (e <= 4) return "±20–45 min";
    return "±45–90 min";
  }
  return "±15–45 min";
}

/** One-line engine summary under the main mission title (visual-lab command deck). */
function missionDeckSubtitle(
  task: ExtendedTask,
  strategic: StrategicPreview | null | undefined,
  enginePick: boolean
): string {
  const parts: string[] = [];
  if (enginePick) parts.push("Aanbevolen door engine");
  parts.push(formatMissionTimeFrame(task));
  const roi = strategic?.roi;
  if (roi != null) {
    if (roi >= 55) parts.push("hoge impact");
    else if (roi >= 35) parts.push("solide impact");
  }
  return `${parts.join(" · ")} — tik Details voor subtasks en notities.`;
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
  blockedReasonByTaskId,
  neuroSelfReportOptIn = false,
  energyCap = null,
  missionsContextBelowHero = null,
  missionsBacklogShelf = null,
  missionEngineWarnings,
}: Props) {
  // `/tasks` missions uses only the new visuals: hero layout + command-deck styling.
  const missionsHeroLayout = true;
  const commandDeckVisuals = true;
  const router = useRouter();
  const { gameState } = useDCICGameState();
  const isWarMode = gameState?.mode?.current === "war";
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
  /** Missions tab: start in Focus so hero + grid show (Plan hides them). */
  const missionsHeroInitialFocus = useRef(false);
  useEffect(() => {
    if (missionsHeroInitialFocus.current) return;
    missionsHeroInitialFocus.current = true;
    setViewMode("focus");
  }, [missionsHeroLayout]);
  const [pending, startTransition] = useTransition();
  const [addError, setAddError] = useState<string | null>(null);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "aanbevolen" | "nieuw" | "work" | "personal" | "recurring">("all");
  const [viewMode, setViewMode] = useState<"focus" | "plan" | "backlog">("focus");
  const [detailsTask, setDetailsTask] = useState<ExtendedTask | null>(null);
  const [editTask, setEditTask] = useState<ExtendedTask | null>(null);
  const [focusTask, setFocusTask] = useState<ExtendedTask | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  /** ID of task just removed; animate it out then clear (no re-render flash). */
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [microReportTaskId, setMicroReportTaskId] = useState<string | null>(null);

  const queueMicroReport = useCallback(
    (taskId: string) => {
      if (!neuroSelfReportOptIn) return;
      setMicroReportTaskId(taskId);
    },
    [neuroSelfReportOptIn]
  );
  const addParam = searchParams.get("add");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addFullOpen, setAddFullOpen] = useState(false);

  useEffect(() => {
    if (addParam && (/^\d{4}-\d{2}-\d{2}$/.test(addParam) || addParam === "today")) setAddFullOpen(true);
  }, [addParam]);
  const [showDoAnotherModal, setShowDoAnotherModal] = useState(false);
  const [nextMissionPromptTask, setNextMissionPromptTask] = useState<ExtendedTask | null>(null);
  const [showAllTasksModal, setShowAllTasksModal] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [doneTodayOpen, setDoneTodayOpen] = useState(false);
  const toggleOrOpenDoneToday = useCallback(() => {
    if (commandDeckVisuals && !isWarMode) setDoneTodayOpen((o) => !o);
    else setDoneTodayOpen(true);
  }, [commandDeckVisuals, isWarMode]);
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

  const heroMissionTask = useMemo(() => {
    if (incompleteTasksForDisplay.length === 0) return null;
    if (isWarMode) return incompleteTasksForDisplay[0] ?? null;
    const unblocked = incompleteTasksForDisplay.find((t) => !blockedReasonByTaskId?.[t.id]);
    return unblocked ?? incompleteTasksForDisplay[0] ?? null;
  }, [missionsHeroLayout, incompleteTasksForDisplay, blockedReasonByTaskId, isWarMode]);

  const restMissionTasks = useMemo(() => {
    if (!heroMissionTask) return [];
    return incompleteTasksForDisplay.filter((t) => t.id !== heroMissionTask.id);
  }, [missionsHeroLayout, incompleteTasksForDisplay, heroMissionTask]);

  const completedForDisplay = useMemo(() => {
    const byId = new Map<string, ExtendedTask>();
    for (const task of completedToday as ExtendedTask[]) {
      byId.set(task.id, task);
    }
    for (const task of extendedTasks) {
      const id = task.id;
      if (task.completed || optimisticCompleteIds.includes(id)) {
        byId.set(id, {
          ...task,
          completed: true,
          completed_at: task.completed_at ?? new Date().toISOString(),
        } as ExtendedTask);
      } else {
        byId.delete(id);
      }
    }
    return Array.from(byId.values());
  }, [completedToday, extendedTasks, optimisticCompleteIds]);

  useEffect(() => {
    if (!doneTodayOpen || isWarMode) return;
    if (completedForDisplay.length === 0) setDoneTodayOpen(false);
  }, [doneTodayOpen, commandDeckVisuals, isWarMode, completedForDisplay.length]);

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
  const focusModeTasks = incompleteTasksForDisplay.slice(0, 3);
  const warModeTasks = incompleteTasksForDisplay.slice(0, 1);
  const backlogModeTasks = incompleteTasksForDisplay.filter((t) => (t.carry_over_count ?? 0) > 0);
  const effectiveViewMode = isWarMode ? "focus" : viewMode;
  const flatIncompleteOrder: string[] = [];
  for (const s of sectionsToShow) {
    for (const t of s.tasks) {
      if (!t.completed) flatIncompleteOrder.push(t.id);
    }
  }
  const firstIncompleteId =
    flatIncompleteOrder.find((tid) => !blockedReasonByTaskId?.[tid]) ?? flatIncompleteOrder[0] ?? null;
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
  const engineWarningLines = collectMissionEngineWarningLines({
    limitMessage: !isWarMode ? limitMessage : null,
    ...(missionEngineWarnings ?? {}),
  });
  const topRecommendedTask = useMemo(() => {
    const recommended = incompleteTasksForDisplay.find((t) => recommendedTaskIds?.includes(t.id));
    return recommended ?? incompleteTasksForDisplay[0] ?? null;
  }, [incompleteTasksForDisplay, recommendedTaskIds]);

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

  /** Mission voltooid + optioneel level-up / low-synergy — alle paden (lijst, details, focus) moeten dit aanroepen. */
  function presentCompleteTaskFeedback(taskId: string, result?: CompleteTaskResult | null) {
    const rankLabel = result?.performanceRank ? ` · Prestatie ${result.performanceRank}` : "";
    const desc =
      result?.performanceScore != null
        ? `Score ${result.performanceScore}${result.xpAwarded != null ? ` · +${result.xpAwarded} XP` : ""}`
        : undefined;
    neuroToast.success(`Mission voltooid${rankLabel}`, {
      description: desc,
      action: {
        label: "Ongedaan maken",
        onClick: () => {
          startTransition(async () => {
            await uncompleteTask(taskId);
            void refreshMergedSnapshotFromNetwork();
            router.refresh();
          });
        },
      },
    });
    if (result?.levelUp && result.newLevel) {
      const rankPromotion = result.rankPromotion;
      const newRank = result.newRank;
      const previousRank = result.previousRank;
      neuroToast.success(
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
        reputation: result.reputation ?? identityReputation ?? undefined,
        ...(rankPromotion ? { rankPromotion: true, newRank, previousRank } : {}),
      });
    }
    if (result?.lowSynergy) {
      neuroToast.warning(
        "Low synergy state · XP −25%, lagere kans op afronden. Dit is een beslissing van de engine — beter om deze missie op een ander moment te plannen.",
        { duration: 7000 }
      );
    }
    appState?.triggerReward();
  }

  function handleComplete(id: string) {
    const blockReason = blockedReasonByTaskId?.[id];
    if (blockReason) {
      neuroToast.error(blockReason);
      return;
    }
    const completedCountBefore = completedForDisplay.length;
    const nextCandidateId = flatIncompleteOrder.find((taskId) => taskId !== id) ?? null;
    const nextCandidateTask = nextCandidateId
      ? incompleteTasksForDisplay.find((t) => t.id === nextCandidateId) ?? null
      : null;
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
        presentCompleteTaskFeedback(id, result ?? undefined);
        if (nextCandidateTask) {
          setNextMissionPromptTask(nextCandidateTask);
        }
        if (completedCountBefore + 1 >= suggestedTaskCount) {
          setDetailsTask(null);
          setFocusTask(null);
          setEditTask(null);
          setShowDoAnotherModal(true);
        }
        void refreshMergedSnapshotFromNetwork();
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
    neuroToast.success("Mission verwijderd", {
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

  function showMovedToast(taskId: string, fromDate: string, label: "Snoozed" | "Skipped next") {
    neuroToast.success(`${label} mission`, {
      description: `Moved from ${fromDate}.`,
      action: {
        label: "Undo",
        onClick: () => {
          startTransition(async () => {
            await rescheduleTask(taskId, fromDate);
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
          void refreshMergedSnapshotFromNetwork();
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
    const original = extendedTasks.find((t) => t.id === id);
    const originalDate = original?.due_date ?? date;
    setSnoozingIds((prev) => new Set(prev).add(id));
    removeTask(id, date);
    startTransition(async () => {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await addToQueue("snoozeTask", { id });
        } else {
          await snoozeTask(id);
          void trackEvent("mission_skipped", { taskId: id, reason: "list_snooze" });
          queueMicroReport(id);
          showMovedToast(id, originalDate, "Snoozed");
          void refreshMergedSnapshotFromNetwork();
          router.refresh();
        }
      } finally {
        setSnoozingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      }
    });
  }

  function handleSkipNext(id: string) {
    const original = extendedTasks.find((t) => t.id === id);
    const originalDate = original?.due_date ?? date;
    setSkipNextIds((prev) => new Set(prev).add(id));
    removeTask(id, date);
    startTransition(async () => {
      try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          await addToQueue("skipNextOccurrence", { id });
        } else {
          await skipNextOccurrence(id);
          void trackEvent("mission_skipped", { taskId: id, reason: "list_skip_next" });
          queueMicroReport(id);
          showMovedToast(id, originalDate, "Skipped next");
          void refreshMergedSnapshotFromNetwork();
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
        void refreshMergedSnapshotFromNetwork();
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

  function renderCompactMissionCard(task: ExtendedTask) {
    const blockReason = blockedReasonByTaskId?.[task.id];
    const strategic = strategicByTaskId?.[task.id];
    const xp = expectedXpForMission(task, strategic);
    const timeFrame = formatMissionTimeFrame(task);
    function openDetails() {
      setFocusTask(null);
      setDetailsTask(task);
    }
    const deckMeta = [strategic?.domain ?? task.category, `+${xp} XP · ${timeFrame}`].filter(Boolean).join(" · ");
    const deckHint =
      strategic?.psychologyLabel?.trim() ||
      (strategic?.difficultyRank ? `Rank ${strategic.difficultyRank}` : null) ||
      (task.recurrence_rule ? recurrenceLabel(task) : recommendedTaskIds?.includes(task.id) ? "Aanbevolen" : null) ||
      "Missie";

    return (
      <button
        type="button"
        onClick={openDetails}
        disabled={!!blockReason}
        className={[
          "card-simple flex w-full items-start gap-3 !rounded-xl px-3 py-3 text-left outline-none transition-colors ring-offset-2 ring-offset-[var(--bg-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)]",
          blockReason
            ? "cursor-not-allowed border-[var(--card-border)] bg-[var(--bg-surface)]/30 opacity-90"
            : "!border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:!border-[rgba(var(--mode-rgb),0.22)] hover:bg-[rgba(var(--mode-rgb),0.08)]",
        ].join(" ")}
      >
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--semantic-accent)]/70 shadow-[0_0_8px_rgba(var(--mode-rgb),0.35)]"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{deckMeta}</p>
          {blockReason ? (
            <p className="mt-1 line-clamp-2 text-[10px] text-amber-200/90">{blockReason}</p>
          ) : (
            <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]/80">{deckHint}</p>
          )}
        </div>
        <span className="mt-1 shrink-0 text-[var(--text-muted)]" aria-hidden>
          ›
        </span>
      </button>
    );
  }

  function renderTask(task: ExtendedTask, isFirstIncomplete: boolean) {
    const subtasks = localSubtasksByParent[task.id] ?? [];
    const preview = recurrencePreview(task);
    const isRemoving = task.id === removingId;
    const blockReason = blockedReasonByTaskId?.[task.id];
    const progressionMeta = parseMissionProgressionFromTaskTags(task.task_tags);
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
              : blockReason
                ? "border-[var(--card-border)] bg-[var(--bg-surface)]/40 opacity-75"
              : (task.carry_over_count ?? 0) > 0
                ? isRoutineTask(task)
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-amber-500/50 bg-amber-500/10"
                : isFirstIncomplete
                  ? "border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/5"
                  : "border-[var(--card-border)] bg-[var(--bg-surface)]/50"
          }`}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!task.completed) handleComplete(task.id); }}
            disabled={task.completed || completingIds.has(task.id) || !!blockReason}
            className={`h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${
              task.completed ? "border-green-500 bg-green-500/20 text-green-400" : "border-neutral-500 bg-transparent hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 text-transparent"
            } disabled:opacity-50`}
            aria-label={task.completed ? "Completed" : completingIds.has(task.id) ? "Saving…" : blockReason ? "Geblokkeerd" : "Complete task"}
          >
            {task.completed && <span className="text-sm">✓</span>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {blockReason && !task.completed && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200" title={blockReason}>
                  Geblokkeerd
                </span>
              )}
              {isFirstIncomplete && !task.completed && !blockReason && (
                <span className="rounded bg-[var(--accent-focus)]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-focus)]">Today&apos;s mission</span>
              )}
              {isRoutineTask(task) && !task.completed && (
                <span
                  className="rounded bg-violet-500/20 px-2 py-0.5 text-[10px] font-semibold text-violet-300"
                  title={
                    (task.carry_over_count ?? 0) > 0
                      ? "Dit is je vaste routine; ook " + (task.carry_over_count ?? 0) + "× meegenomen."
                      : "Vaste routine"
                  }
                >
                  Routine
                  {(task.carry_over_count ?? 0) > 0 ? ` · ${task.carry_over_count}×` : ""}
                </span>
              )}
              {!isRoutineTask(task) && task.carry_over_count > 0 && !task.completed && (
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
              {progressionMeta && (
                <span
                  className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300"
                  title={`Progression ${progressionMeta.key}`}
                >
                  Lv {progressionMeta.tier}
                  {progressionMeta.nextTier ? ` → ${progressionMeta.nextTier}` : " · Max"}
                </span>
              )}
              <span className={`text-sm text-[var(--text-primary)] ${task.completed ? "line-through text-[var(--text-muted)]" : ""}`}>{task.title}</span>
            </div>
            {recurrenceLabel(task) && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{recurrenceLabel(task)}</p>}
            {task.notes?.trim() && (
              <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]" title={task.notes}>
                {task.notes}
              </p>
            )}
            {progressionMeta && !task.completed && (
              <p className="mt-0.5 text-[11px] text-cyan-200/90">
                Progression: {progressionMeta.key.replaceAll("_", " ")} · huidige tier {progressionMeta.tier}
                {progressionMeta.nextTier ? ` · volgende tier ${progressionMeta.nextTier}` : " · max tier bereikt"}
              </p>
            )}
            {preview && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{preview}</p>}
            {blockReason && !task.completed && (
              <p className="mt-1 text-[11px] text-amber-200/90">{blockReason}</p>
            )}
          </div>
          {isFirstIncomplete && !task.completed && !blockReason && (
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
                      void (async () => {
                        try {
                          const subResult = await completeTaskOffline(s.id);
                          presentCompleteTaskFeedback(s.id, subResult ?? undefined);
                          void refreshMergedSnapshotFromNetwork();
                          router.refresh();
                        } catch {
                          appState?.triggerError();
                        }
                      })();
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
    <div className="w-full space-y-4">
      {missionsHeroLayout && isWarMode && (
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span className="rounded-full border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-focus)]">
            War tunnel
          </span>
          {completedForDisplay.length > 0 && (
            <button
              type="button"
              aria-expanded={doneTodayOpen}
              aria-controls="done-today-toast"
              onClick={toggleOrOpenDoneToday}
              className="rounded-full border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/40 px-3 py-1 text-xs font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-surface)]/70 hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              Voltooid vandaag ({completedForDisplay.length})
            </button>
          )}
        </div>
      )}
      <div className="space-y-4">
        {showAvoidance && (
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{carryOverCount} tasks carried over. Pick one to focus on.</p>
        )}

        {!isWarMode && missionsHeroLayout && (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start" role="tablist" aria-label="Missieweergave">
                {(["focus", "plan", "backlog"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={viewMode === m}
                    onClick={() => setViewMode(m)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                      viewMode === m
                        ? "border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb),0.12)] text-[var(--accent-focus)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.2)]"
                        : "border-transparent text-[var(--text-muted)] hover:border-[var(--card-border)] hover:bg-[var(--bg-surface)]/60 hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {m === "focus" ? "Vandaag" : m}
                  </button>
                ))}
              </div>
              {completedForDisplay.length > 0 && (
                <button
                  type="button"
                  aria-expanded={doneTodayOpen}
                  aria-controls="done-today-inline"
                  onClick={toggleOrOpenDoneToday}
                  className="rounded-full border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/40 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--card-border)] hover:bg-[var(--bg-surface)]/70 hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                >
                  Voltooid vandaag ({completedForDisplay.length})
                </button>
              )}
            </div>
            {doneTodayOpen && completedForDisplay.length > 0 ? (
              <div
                className="glass-card mb-3 !rounded-xl !p-3"
                id="done-today-inline"
                role="region"
                aria-label="Voltooid vandaag"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Gedaan vandaag</p>
                <ul className="mt-2 space-y-2">
                  {completedForDisplay.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-start gap-3 rounded-lg border border-[rgba(var(--mode-rgb),0.08)] bg-black/20 px-3 py-2"
                    >
                      <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked
                          disabled={pending}
                          onChange={(e) => {
                            if (!e.target.checked) handleUncomplete(d.id);
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border border-emerald-500/50 bg-emerald-500/20 accent-[var(--semantic-accent)] disabled:opacity-50"
                          aria-label={`${(d.title ?? "Missie").replace(/"/g, "'")} is voltooid. Vink uit om ongedaan te maken.`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium leading-snug text-[var(--text-muted)] line-through">
                            {d.title ?? "Missie"}
                          </span>
                          {d.category ? (
                            <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{d.category}</span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
                  Vink uit om ongedaan te maken. Tik opnieuw op Voltooid vandaag om dit paneel te sluiten.
                </p>
              </div>
            ) : null}
            {effectiveViewMode === "backlog" && missionsBacklogShelf ? (
              <div className="tasks-war-hide mb-3 w-full">
                <BacklogAndToekomstTriggers
                  backlog={missionsBacklogShelf.backlog}
                  futureTasks={missionsBacklogShelf.futureTasks}
                  todayDate={missionsBacklogShelf.todayDate}
                />
              </div>
            ) : null}
          </>
        )}

        {missionsHeroLayout && effectiveViewMode !== "focus" && (
          <div className="space-y-3">
            {energyCap ? (
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <EnergyCapBar
                    used={energyCap.used}
                    cap={energyCap.cap}
                    remaining={energyCap.remaining}
                    planned={energyCap.planned}
                    variant="commandDeckStrip"
                  />
                </div>
                <MissionsEngineWarningIcon lines={engineWarningLines} className="shrink-0 pt-0.5" />
              </div>
            ) : engineWarningLines.length > 0 ? (
              <div className="flex justify-end">
                <MissionsEngineWarningIcon lines={engineWarningLines} />
              </div>
            ) : null}
            {missionsContextBelowHero}
          </div>
        )}

        {effectiveViewMode === "plan" && filteredTasks.length > 0 && (
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

        {effectiveViewMode === "focus" ? (
            <div className="space-y-4">
              {heroMissionTask ? (
               <section
                  className="glass-card glass-preserve-decoration relative !rounded-xl !p-0"
                  aria-label="Hoofdmissie"
                >
                  <div
                    className="deck-hero-energy-rail absolute left-0 top-0 z-[1] h-full w-[3px] bg-gradient-to-b from-[var(--semantic-accent)] via-[var(--semantic-accent)]/85 to-emerald-500/75 shadow-[4px_0_18px_rgba(var(--mode-rgb),0.45),0_0_12px_rgba(var(--semantic-accent),0.35)]"
                    aria-hidden
                  />
                  <div
                    className="relative z-10 space-y-3 p-4 pl-5 sm:p-5 sm:pl-6"
                  >
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]"
                  >
                    Main mission
                  </p>
                  <h3
                    className="mt-2 text-base font-bold leading-snug text-[var(--text-primary)] md:text-lg"
                  >
                    {heroMissionTask.title}
                  </h3>
                  <>
                      <p
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setFocusTask(null);
                          setDetailsTask(heroMissionTask);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setFocusTask(null);
                            setDetailsTask(heroMissionTask);
                          }
                        }}
                        className="mt-2 max-w-prose cursor-pointer rounded-md text-[11px] leading-relaxed text-[var(--text-secondary)] outline-none transition-colors hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] md:text-xs"
                      >
                        {missionDeckSubtitle(
                          heroMissionTask,
                          strategicByTaskId?.[heroMissionTask.id],
                          !!recommendedTaskIds?.includes(heroMissionTask.id)
                        )}
                      </p>
                      {heroMissionTask.notes?.trim() ? (
                        <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-[var(--text-secondary)] md:text-xs">
                          {heroMissionTask.notes.trim()}
                        </p>
                      ) : null}
                  </>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDetailsTask(null);
                        setFocusTask(heroMissionTask);
                      }}
                      disabled={!!blockedReasonByTaskId?.[heroMissionTask.id]}
                      className="rounded-lg bg-[var(--semantic-accent)]/15 px-3 py-2 text-[11px] font-semibold text-[var(--semantic-accent)] shadow-none transition hover:bg-[var(--semantic-accent)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/40 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Start
                    </button>
                    {commandDeckVisuals && (
                      <button
                        type="button"
                        onClick={() => {
                          setFocusTask(null);
                          handleSnooze(heroMissionTask.id);
                        }}
                        disabled={
                          !!blockedReasonByTaskId?.[heroMissionTask.id] || snoozingIds.has(heroMissionTask.id)
                        }
                        className="rounded-lg border border-[rgba(var(--mode-rgb),0.18)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[rgba(var(--mode-rgb),0.28)] hover:bg-[rgba(var(--mode-rgb),0.06)] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {snoozingIds.has(heroMissionTask.id) ? "…" : "Uitstellen"}
                      </button>
                    )}
                  </div>
                  {blockedReasonByTaskId?.[heroMissionTask.id] && (
                    <p className="mt-2 text-xs text-amber-200/90">{blockedReasonByTaskId[heroMissionTask.id]}</p>
                  )}
                  </div>
                </section>
              ) : (
                <div
                  className={
                    commandDeckVisuals
                      ? "rounded-xl border border-dashed border-[rgba(var(--semantic-accent),0.25)] bg-[rgba(4,12,22,0.4)] px-4 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                      : "rounded-2xl border border-dashed border-[var(--card-border)]/55 bg-[var(--bg-surface)]/25 px-4 py-8 text-center"
                  }
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {completedForDisplay.length > 0 ? "Alles gedaan voor vandaag" : "Nog geen missies vandaag"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {completedForDisplay.length > 0
                      ? "Rust even — of pluk iets uit je backlog als je nog energie hebt."
                      : "Voeg hieronder een missie toe om te starten."}
                  </p>
                </div>
              )}

              {commandDeckVisuals && !isWarMode && (
                <div className="card-simple flex flex-wrap items-center gap-2 !rounded-xl px-3 py-2.5">
                  {(
                    [
                      { k: "Open", v: String(incompleteTasksForDisplay.length) },
                      {
                        k: "Today",
                        v:
                          heroMissionTask != null
                            ? `${restMissionTasks.length} left`
                            : `${incompleteTasksForDisplay.length} left`,
                      },
                      {
                        k: "Mode",
                        v:
                          mode === "stabilize"
                            ? "Stabilise"
                            : mode === "low_energy"
                              ? "Low"
                              : mode === "driven"
                                ? "Drive"
                                : "Focus",
                      },
                    ] as const
                  ).map((s, i) => (
                    <div key={s.k} className="flex items-center gap-2">
                      {i > 0 ? (
                        <span className="text-[var(--text-muted)]/40" aria-hidden>
                          |
                        </span>
                      ) : null}
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{s.k}</span>
                      <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{s.v}</span>
                    </div>
                  ))}
                  {energyCap && energyCap.cap > 0 ? (
                    <span className="ml-auto hidden text-[9px] tabular-nums text-[var(--text-muted)] sm:inline">
                      Energy budget · {Math.min(100, Math.round((energyCap.used / energyCap.cap) * 100))}%
                    </span>
                  ) : null}
                </div>
              )}

              <div className="space-y-3">
                {energyCap ? (
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <EnergyCapBar
                        used={energyCap.used}
                        cap={energyCap.cap}
                        remaining={energyCap.remaining}
                        planned={energyCap.planned}
                        variant="commandDeckStrip"
                      />
                    </div>
                    <MissionsEngineWarningIcon lines={engineWarningLines} className="shrink-0 pt-0.5" />
                  </div>
                ) : engineWarningLines.length > 0 ? (
                  <div className="flex justify-end">
                    <MissionsEngineWarningIcon lines={engineWarningLines} />
                  </div>
                ) : null}
                {missionsContextBelowHero}
              </div>

              {restMissionTasks.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Daarna / parallel
                  </p>
                  <ul className="space-y-2">
                    {restMissionTasks.map((t) => (
                      <li key={t.id} className="w-full">
                        {renderCompactMissionCard(t)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
        ) : effectiveViewMode === "backlog" ? (
          backlogModeTasks.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--card-border)]/50 bg-[var(--bg-surface)]/30 px-3 py-4 text-center text-xs text-[var(--text-muted)]">
              Geen backlog-items in je huidige lijst.
            </p>
          ) : (
            <ul className="space-y-2">
              {backlogModeTasks.map((t) => renderTask(t, false))}
            </ul>
          )
        ) : initialTasks.length === 0 ? (
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

        {!isWarMode && (
          <div className="mt-5 flex flex-col justify-stretch gap-2">
            <button
              type="button"
              onClick={() => {
                setDetailsTask(null);
                setFocusTask(null);
                setAddFullOpen(true);
              }}
              className={
                missionsHeroLayout && commandDeckVisuals
                  ? "primary-btn min-h-[48px] !normal-case !tracking-normal shadow-[0_0_18px_rgba(var(--mode-rgb),0.35)]"
                  : missionsHeroLayout
                    ? "w-full min-h-[48px] rounded-full bg-[var(--accent-focus)] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(var(--mode-rgb),0.35)] transition hover:opacity-95"
                    : "rounded-full border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-4 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20"
                      }
            >
              + Missie toevoegen
            </button>
            {missionsHeroLayout ? (
              <p className="text-center text-[10px] leading-relaxed text-[var(--text-muted)]">
                Opent het volledige missieformulier voor XP, duur en subtasks.
              </p>
            ) : null}
          </div>
        )}

        {detailsTask && (
          <TaskDetailsModal
            open={!!detailsTask}
            onClose={() => setDetailsTask(null)}
            task={detailsTask}
            subtasks={subtasksByParent[detailsTask.id]}
            strategicPreview={strategicByTaskId?.[detailsTask.id]}
            onComplete={(res) => presentCompleteTaskFeedback(detailsTask.id, res)}
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
            onComplete={(res) => {
              presentCompleteTaskFeedback(focusTask.id, res);
              setFocusTask(null);
            }}
            onSnooze={() => {
              const id = focusTask.id;
              setFocusTask(null);
              queueMicroReport(id);
            }}
            energyMatchScore={strategicByTaskId?.[focusTask.id]?.energyMatch}
          />
        )}
        {microReportTaskId && (
          <NeuroMicroReportBar taskId={microReportTaskId} onClose={() => setMicroReportTaskId(null)} />
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
                    neuroToast.success("2 bonusmissies toegevoegd.");
                    router.refresh();
                  } catch {
                    neuroToast.error("Bonusmissies toevoegen is niet gelukt. Probeer later opnieuw.");
                  }
                });
              }}
              className="flex-1 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Voeg 2 bonusmissies toe
            </button>
          </div>
        </Modal>
        <Modal
          open={!!nextMissionPromptTask}
          onClose={() => setNextMissionPromptTask(null)}
          title="Next mission ready"
          size="sm"
        >
          <p className="text-sm text-[var(--text-muted)]">
            Doorgaan met: <span className="font-medium text-[var(--text-primary)]">{nextMissionPromptTask?.title}</span>
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setNextMissionPromptTask(null)}
              className="flex-1 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
            >
              Later
            </button>
            <button
              type="button"
              onClick={() => {
                if (!nextMissionPromptTask) return;
                setDetailsTask(null);
                setNextMissionPromptTask(null);
                setFocusTask(nextMissionPromptTask);
              }}
              className="flex-1 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Start nu
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

        <DoneTodayToast
          open={doneTodayOpen && isWarMode}
          onClose={() => setDoneTodayOpen(false)}
          tasks={completedForDisplay}
          onUncomplete={handleUncomplete}
          pending={pending}
        />
      </div>
    </div>
  );
}

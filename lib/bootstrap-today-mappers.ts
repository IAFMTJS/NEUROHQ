import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";
import type {
  BudgetSnapshot,
  DailySnapshot,
  DashboardSnapshot,
  LearningSnapshot,
  MissionsSnapshot,
} from "@/types/daily-snapshot";

/** Maps `/api/bootstrap/today` `budget` JSON to `BudgetSnapshot` (same rules as `daily-initialize`). */
export function mapBootstrapBudgetToSnapshot(
  budget: unknown,
  dateStr: string
): BudgetSnapshot | null {
  if (budget == null || typeof budget !== "object") return null;
  const b = budget as {
    settings: Record<string, unknown>;
    currentMonthExpenses: number | null;
    currentMonthIncome: number | null;
    currentWeekExpenses: number | null;
    currentWeekIncome: number | null;
    budgetRemainingCents: number | null;
    currency: string;
    isWeekly: boolean;
    financeState: unknown;
    financialInsights: unknown;
    disciplineXpThisWeek: number;
    disciplineCompletedToday: boolean;
    unplannedSummary?: { count: number; totalCents: number };
  };
  return {
    today: dateStr,
    settings: b.settings,
    currentMonthExpenses: b.currentMonthExpenses ?? null,
    currentMonthIncome: b.currentMonthIncome ?? null,
    currentWeekExpenses: b.currentWeekExpenses ?? null,
    currentWeekIncome: b.currentWeekIncome ?? null,
    budgetRemainingCents: b.budgetRemainingCents ?? null,
    currency: b.currency,
    isWeekly: b.isWeekly,
    periodLabel: b.isWeekly ? "this week" : "this month",
    isPaydayCycle: !!(b.financeState as { period?: { isPaydayCycle?: boolean } })?.period?.isPaydayCycle,
    disciplineScore: (b.financeState as { disciplineScore?: number | null })?.disciplineScore ?? null,
    disciplineXpThisWeek: b.disciplineXpThisWeek ?? 0,
    disciplineCompletedToday: b.disciplineCompletedToday ?? false,
    daysUnderBudgetThisWeek: (b.financeState as { safeDaysThisWeek?: number | null })?.safeDaysThisWeek ?? null,
    unplannedSummary: b.unplannedSummary ?? { count: 0, totalCents: 0 },
    financeState: b.financeState ?? null,
    financialInsights: b.financialInsights ?? null,
  };
}

export function budgetFromBootstrapToday(
  b: BootstrapTodayResponse | null | undefined,
  dateStr: string
): BudgetSnapshot | null {
  if (!b?.budget) return null;
  const apiDate = (b.date as string | undefined) ?? dateStr;
  return mapBootstrapBudgetToSnapshot(b.budget, apiDate);
}
export function dashboardFromBootstrapToday(
  b: BootstrapTodayResponse | null | undefined
): DashboardSnapshot | null {
  const d = b?.dashboard;
  if (d?.critical != null && d?.secondary != null) {
    return {
      critical: d.critical as DashboardSnapshot["critical"],
      secondary: d.secondary as DashboardSnapshot["secondary"],
    };
  }
  return null;
}

/**
 * Merges `/api/bootstrap/today` into an existing daily snapshot (missions, dashboard, budget, learning, DCIC).
 * Does not fetch calendar — preserves `snapshot.calendar`.
 */
export function mergeBootstrapTodayIntoDailySnapshot(
  snapshot: DailySnapshot,
  data: BootstrapTodayResponse
): DailySnapshot {
  const dateStr = (data.date as string | undefined) ?? snapshot.date;
  const missions =
    missionsFromBootstrapToday(data, dateStr) ?? {
      dateStr,
      tasksByDate: (data.tasks ?? {}) as Record<string, unknown[]>,
      completedToday: (data.completedToday ?? []) as unknown[],
      energyBudget: (data.energyBudget as Record<string, unknown>) ?? null,
      dailyState: (data.dailyState as Record<string, unknown>) ?? null,
    };
  const budget =
    data.budget != null
      ? mapBootstrapBudgetToSnapshot(data.budget, dateStr) ?? snapshot.budget
      : snapshot.budget;
  const learning: LearningSnapshot | null =
    data.learning != null && typeof data.learning === "object"
      ? (() => {
          const L = data.learning as {
            weeklyMinutes: number;
            weeklyLearningTarget: number;
            learningStreak: number;
            focus: unknown | null;
            streams: unknown;
            consistency: unknown;
            reflection: LearningSnapshot["reflection"];
          };
          return {
            today: dateStr,
            weeklyMinutes: L.weeklyMinutes,
            weeklyLearningTarget: L.weeklyLearningTarget,
            learningStreak: L.learningStreak,
            focus: L.focus,
            streams: L.streams,
            consistency: L.consistency,
            reflection: L.reflection ?? {
              lastEntryDate: null,
              reflectionRequired: false,
            },
          };
        })()
      : snapshot.learning;
  let dashboard: DashboardSnapshot | null = snapshot.dashboard;
  if (data.dashboard?.critical != null && data.dashboard?.secondary != null) {
    dashboard = {
      critical: data.dashboard.critical as DashboardSnapshot["critical"],
      secondary: data.dashboard.secondary as DashboardSnapshot["secondary"],
    };
  }
  return {
    ...snapshot,
    date: dateStr,
    dashboard,
    missions,
    budget,
    learning,
    dcicGameState: data.dcicGameState ?? snapshot.dcicGameState ?? null,
  };
}

export function missionsFromBootstrapToday(
  b: BootstrapTodayResponse | null | undefined,
  dateStr: string
): MissionsSnapshot | null {
  if (!b) return null;
  const apiDate = (b.date as string | undefined) ?? dateStr;
  if (apiDate !== dateStr) return null;
  const mp = (
    (b.dashboard?.critical as { missionsPipeline?: unknown } | undefined)?.missionsPipeline ?? b.missionsPipeline
  ) as
    | {
        decisionBlocks?: unknown;
        capacity?: unknown;
        buildMeta?: { builtAt?: number; inputHash?: string };
      }
    | null
    | undefined;
  return {
    dateStr: apiDate,
    tasksByDate: (b.tasks ?? {}) as Record<string, unknown[]>,
    completedToday: (b.completedToday ?? []) as unknown[],
    energyBudget: (b.energyBudget as Record<string, unknown>) ?? null,
    dailyState: (b.dailyState as Record<string, unknown>) ?? null,
    decisionBlocks: (mp?.decisionBlocks ?? undefined) as MissionsSnapshot["decisionBlocks"],
    capacity: (mp?.capacity ?? undefined) as MissionsSnapshot["capacity"],
    buildMeta: mp?.buildMeta?.builtAt != null ? { builtAt: mp.buildMeta.builtAt, inputHash: mp.buildMeta.inputHash } : undefined,
    rankedTaskIds: Array.isArray((mp as { rankedTaskIds?: string[] }).rankedTaskIds)
      ? (mp as { rankedTaskIds: string[] }).rankedTaskIds
      : undefined,
  };
}

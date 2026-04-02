import type { BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";
import type { BudgetSnapshot, DashboardSnapshot, MissionsSnapshot } from "@/types/daily-snapshot";

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

export function missionsFromBootstrapToday(
  b: BootstrapTodayResponse | null | undefined,
  dateStr: string
): MissionsSnapshot | null {
  if (!b) return null;
  const apiDate = (b.date as string | undefined) ?? dateStr;
  if (apiDate !== dateStr) return null;
  return {
    dateStr: apiDate,
    tasksByDate: (b.tasks ?? {}) as Record<string, unknown[]>,
    completedToday: (b.completedToday ?? []) as unknown[],
    energyBudget: (b.energyBudget as Record<string, unknown>) ?? null,
    dailyState: (b.dailyState as Record<string, unknown>) ?? null,
  };
}

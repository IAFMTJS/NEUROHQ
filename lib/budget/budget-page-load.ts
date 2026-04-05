/**
 * Grouped server data loading for `/budget`.
 * — Preamble: side effects + bounds (one Promise.all).
 * — Main batch: all independent reads + flex hero in the same Promise.all (flex was previously sequential after the batch).
 */

import { getSavingsGoals, getSavingsContributions } from "@/app/actions/savings";
import {
  getBudgetEntries,
  getBudgetSettings,
  getBudgetPeriodBounds,
  getCurrentMonthExpensesCents,
  getCurrentMonthIncomeCents,
  getCurrentWeekExpensesCents,
  getCurrentWeekIncomeCents,
  getFrozenEntries,
  getFrozenEntriesReadyForAction,
  getPaydayDayOfMonth,
  getRecurringTemplates,
  generateRecurringEntries,
  getUnplannedWeeklySummary,
} from "@/app/actions/budget";
import { getFinanceState, getFinancialInsightsSafe, getBudgetTargets } from "@/app/actions/dcic/finance-state";
import { getIncomeSources } from "@/app/actions/dcic/income-sources";
import { getAlternatives } from "@/app/actions/alternatives";
import { getBudgetWeeklyReviewStatus } from "@/app/actions/budget-weekly-review";
import { getBudgetDisciplineXpThisWeek, getBudgetDisciplineCompletedToday } from "@/app/actions/budget-discipline";
import { syncBudgetDisciplineFromDataForToday } from "@/app/actions/missions-performance";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getImpulseTimeWindow } from "@/app/actions/budget-impulse-pattern";
import {
  autoAwardBudgetOptimizationForCurrentUser,
  getBudgetControlState,
  getBudgetOptimizationSuggestions,
} from "@/app/actions/budget-intelligence";
import { evaluateFlexBudgetForDay, getFlexBudgetHeroPayload, type FlexBudgetHeroPayload } from "@/app/actions/flex-budget";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";

export type BudgetPagePreamble = {
  prefs: Awaited<ReturnType<typeof getUserPreferencesOrDefaults>>;
  periodBounds: Awaited<ReturnType<typeof getBudgetPeriodBounds>>;
  paydayDayOfMonth: Awaited<ReturnType<typeof getPaydayDayOfMonth>>;
};

export async function runBudgetPagePreamble(): Promise<BudgetPagePreamble> {
  const [, , , prefs, periodBounds, paydayDayOfMonth] = await Promise.all([
    (async () => {
      try {
        await generateRecurringEntries();
      } catch {
        /* table may not exist yet */
      }
    })(),
    (async () => {
      try {
        await autoAwardBudgetOptimizationForCurrentUser();
      } catch {
        /* ignore auto-award failures */
      }
    })(),
    syncBudgetDisciplineFromDataForToday(),
    getUserPreferencesOrDefaults(),
    getBudgetPeriodBounds(),
    getPaydayDayOfMonth(),
  ]);
  return { prefs, periodBounds, paydayDayOfMonth };
}

export type BudgetPageDataBatch = {
  goals: Awaited<ReturnType<typeof getSavingsGoals>>;
  entries: Awaited<ReturnType<typeof getBudgetEntries>>;
  nextMonthEntries: Awaited<ReturnType<typeof getBudgetEntries>>;
  prevMonthEntries: Awaited<ReturnType<typeof getBudgetEntries>>;
  alternatives: Awaited<ReturnType<typeof getAlternatives>>;
  budgetSettings: Awaited<ReturnType<typeof getBudgetSettings>>;
  currentMonthExpenses: Awaited<ReturnType<typeof getCurrentMonthExpensesCents>>;
  currentMonthIncome: Awaited<ReturnType<typeof getCurrentMonthIncomeCents>>;
  currentWeekExpenses: Awaited<ReturnType<typeof getCurrentWeekExpensesCents>>;
  currentWeekIncome: Awaited<ReturnType<typeof getCurrentWeekIncomeCents>>;
  activeFrozen: Awaited<ReturnType<typeof getFrozenEntries>>;
  readyForAction: Awaited<ReturnType<typeof getFrozenEntriesReadyForAction>>;
  unplannedSummary: Awaited<ReturnType<typeof getUnplannedWeeklySummary>>;
  contributions: Awaited<ReturnType<typeof getSavingsContributions>>;
  recurringTemplates: Awaited<ReturnType<typeof getRecurringTemplates>>;
  financeState: Awaited<ReturnType<typeof getFinanceState>>;
  financialInsights: Awaited<ReturnType<typeof getFinancialInsightsSafe>>;
  incomeSources: Awaited<ReturnType<typeof getIncomeSources>>;
  budgetTargets: Awaited<ReturnType<typeof getBudgetTargets>>;
  weeklyReviewStatus: Awaited<ReturnType<typeof getBudgetWeeklyReviewStatus>>;
  disciplineXpThisWeek: Awaited<ReturnType<typeof getBudgetDisciplineXpThisWeek>>;
  disciplineCompletedToday: Awaited<ReturnType<typeof getBudgetDisciplineCompletedToday>>;
  impulseWindow: Awaited<ReturnType<typeof getImpulseTimeWindow>>;
  budgetControlState: Awaited<ReturnType<typeof getBudgetControlState>>;
  optimization: Awaited<ReturnType<typeof getBudgetOptimizationSuggestions>>;
  strategyPacingHints: Awaited<ReturnType<typeof getStrategyPacingHints>>;
  flexHeroPayload: FlexBudgetHeroPayload | null;
};

type BatchParams = {
  today: string;
  isHistoryView: boolean;
  periodStart: string;
  periodEnd: string;
  nextMonthStart: string;
  nextMonthEnd: string;
  prevStart: string;
  prevEnd: string;
  paydayDayOfMonth: Awaited<ReturnType<typeof getPaydayDayOfMonth>>;
};

export async function loadBudgetPageDataBatch(params: BatchParams): Promise<BudgetPageDataBatch> {
  const {
    today,
    isHistoryView,
    periodStart,
    periodEnd,
    nextMonthStart,
    nextMonthEnd,
    prevStart,
    prevEnd,
    paydayDayOfMonth,
  } = params;

  const flexHeroPromise: Promise<FlexBudgetHeroPayload | null> = !isHistoryView
    ? (async () => {
        try {
          await evaluateFlexBudgetForDay(today);
          return await getFlexBudgetHeroPayload();
        } catch {
          return null;
        }
      })()
    : Promise.resolve(null);

  const [
    goals,
    entries,
    nextMonthEntries,
    prevMonthEntries,
    alternatives,
    budgetSettings,
    currentMonthExpenses,
    currentMonthIncome,
    currentWeekExpenses,
    currentWeekIncome,
    activeFrozen,
    readyForAction,
    unplannedSummary,
    contributions,
    recurringTemplates,
    financeState,
    financialInsights,
    incomeSources,
    budgetTargets,
    weeklyReviewStatus,
    disciplineXpThisWeek,
    disciplineCompletedToday,
    impulseWindow,
    budgetControlState,
    optimization,
    strategyPacingHints,
    flexHeroPayload,
  ] = await Promise.all([
    getSavingsGoals(),
    getBudgetEntries(periodStart, periodEnd),
    getBudgetEntries(nextMonthStart, nextMonthEnd),
    getBudgetEntries(prevStart, prevEnd),
    getAlternatives(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getCurrentMonthIncomeCents(),
    getCurrentWeekExpensesCents(),
    getCurrentWeekIncomeCents(),
    getFrozenEntries(),
    getFrozenEntriesReadyForAction(),
    getUnplannedWeeklySummary(),
    getSavingsContributions({ fromDate: periodStart, toDate: periodEnd }),
    getRecurringTemplates(),
    getFinanceState(),
    getFinancialInsightsSafe(),
    getIncomeSources(),
    getBudgetTargets(),
    getBudgetWeeklyReviewStatus(),
    getBudgetDisciplineXpThisWeek(),
    getBudgetDisciplineCompletedToday(),
    getImpulseTimeWindow(),
    getBudgetControlState(),
    getBudgetOptimizationSuggestions(),
    getStrategyPacingHints(),
    flexHeroPromise,
  ]);

  return {
    goals,
    entries,
    nextMonthEntries,
    prevMonthEntries,
    alternatives,
    budgetSettings,
    currentMonthExpenses,
    currentMonthIncome,
    currentWeekExpenses,
    currentWeekIncome,
    activeFrozen,
    readyForAction,
    unplannedSummary,
    contributions,
    recurringTemplates,
    financeState,
    financialInsights,
    incomeSources,
    budgetTargets,
    weeklyReviewStatus,
    disciplineXpThisWeek,
    disciplineCompletedToday,
    impulseWindow,
    budgetControlState,
    optimization,
    strategyPacingHints,
    flexHeroPayload,
  };
}

/**
 * Grouped server data loading for `/budget`.
 * — Preamble: side effects + bounds (one Promise.all).
 * — Main batch: all independent reads + flex hero in the same Promise.all (flex was previously sequential after the batch).
 */

import { getSavingsGoals, getSavingsContributions } from "@/app/actions/savings";
import {
  applyPendingNextPeriodBudgetIfDue,
  getBudgetPageEntryBundle,
  getBudgetSettings,
  getBudgetPeriodBounds,
  getFrozenEntries,
  getFrozenEntriesReadyForAction,
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
  paydayDayOfMonth: number | null;
};

export async function runBudgetPagePreamble(): Promise<BudgetPagePreamble> {
  const [, , , , prefs, periodBounds] = await Promise.all([
    (async () => {
      try {
        await applyPendingNextPeriodBudgetIfDue();
      } catch {
        /* non-fatal */
      }
    })(),
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
  ]);
  return { prefs, periodBounds, paydayDayOfMonth: periodBounds.paydayDayOfMonth };
}

export type BudgetPageDataBatch = {
  goals: Awaited<ReturnType<typeof getSavingsGoals>>;
  entries: Awaited<ReturnType<typeof getBudgetPageEntryBundle>>["entries"];
  nextMonthEntries: Awaited<ReturnType<typeof getBudgetPageEntryBundle>>["nextMonthEntries"];
  prevMonthEntries: Awaited<ReturnType<typeof getBudgetPageEntryBundle>>["prevMonthEntries"];
  alternatives: Awaited<ReturnType<typeof getAlternatives>>;
  budgetSettings: Awaited<ReturnType<typeof getBudgetSettings>>;
  currentMonthExpenses: number;
  currentMonthIncome: number;
  currentWeekExpenses: number;
  currentWeekIncome: number;
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
};

export async function loadBudgetPageDataBatch(params: BatchParams): Promise<BudgetPageDataBatch> {
  const { today, isHistoryView, periodStart, periodEnd, nextMonthStart, nextMonthEnd, prevStart, prevEnd } = params;

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

  const entryBundlePromise = getBudgetPageEntryBundle({
    periodStart,
    periodEnd,
    nextMonthStart,
    nextMonthEnd,
    prevStart,
    prevEnd,
  });

  const [
    goals,
    entryBundle,
    alternatives,
    budgetSettings,
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
    entryBundlePromise,
    getAlternatives(),
    getBudgetSettings(),
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

  const {
    entries,
    nextMonthEntries,
    prevMonthEntries,
    currentMonthExpenses,
    currentMonthIncome,
    currentWeekExpenses,
    currentWeekIncome,
  } = entryBundle;

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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPayload } from "@/app/actions/dashboard-data";
import { getGameState, saveGameState } from "@/app/actions/dcic/game-state";
import { todayDateString } from "@/lib/utils/timezone";
import { getWeekBounds } from "@/lib/utils/learning";
import { getTasksForDate } from "@/app/actions/tasks";
import { getDailyState } from "@/app/actions/daily-state";
import { getEnergyBudget } from "@/app/actions/energy";
import {
  getBudgetSettings,
  getCurrentMonthExpensesCents,
  getCurrentMonthIncomeCents,
  getCurrentWeekExpensesCents,
  getCurrentWeekIncomeCents,
} from "@/app/actions/budget";
import { getWeeklyMinutes, getWeeklyLearningTarget, getLearningStreak } from "@/app/actions/learning";
import { getLearningState } from "@/app/actions/learning-state";
import { getBudgetDisciplineXpThisWeek, getBudgetDisciplineCompletedToday } from "@/app/actions/budget-discipline";
import { getFinanceState, getFinancialInsightsSafe } from "@/app/actions/dcic/finance-state";
import { getUnplannedWeeklySummary } from "@/app/actions/budget";
import type { LearningSnapshot } from "@/types/hq-store.types";
import { updateDynamicMissions } from "@/lib/dcic/dynamic-missions";
import { triggerRandomEvents } from "@/lib/dcic/event-engine";

/** Default true. Set `includeDashboard=0` to skip `getDashboardPayload()` when the client already fetched `/api/dashboard/data` in the same flow (saves one full dashboard build). */
function includeDashboardInBootstrap(request: NextRequest): boolean {
  const v = request.nextUrl.searchParams.get("includeDashboard");
  if (v == null) return true;
  const lower = v.toLowerCase();
  return lower !== "0" && lower !== "false" && lower !== "no";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateStr = todayDateString();
    const loadDashboard = includeDashboardInBootstrap(request);
    const dashboardPromise = loadDashboard ? getDashboardPayload() : Promise.resolve(null);

    const [
      dashboard,
      dcicGameState,
      tasksForDate,
      dailyState,
      energyBudget,
      budgetSettings,
      currentMonthExpenses,
      currentMonthIncome,
      currentWeekExpenses,
      currentWeekIncome,
      weeklyMinutes,
      weeklyLearningTarget,
      learningStreak,
      financeState,
      financialInsights,
      disciplineXpThisWeek,
      disciplineCompletedToday,
      unplannedSummary,
    ] = await Promise.all([
      dashboardPromise,
      getGameState({ includeFinance: false }),
      getTasksForDate(dateStr),
      getDailyState(dateStr),
      getEnergyBudget(dateStr),
      getBudgetSettings(),
      getCurrentMonthExpensesCents(),
      getCurrentMonthIncomeCents(),
      getCurrentWeekExpensesCents(),
      getCurrentWeekIncomeCents(),
      // learning minutes over this week (not just today)
      (async () => {
        const today = new Date(dateStr + "T12:00:00Z");
        const { start, end } = getWeekBounds(today);
        return getWeeklyMinutes(start, end);
      })(),
      getWeeklyLearningTarget(),
      getLearningStreak(),
      getFinanceState(),
      getFinancialInsightsSafe(),
      getBudgetDisciplineXpThisWeek(),
      getBudgetDisciplineCompletedToday(),
      getUnplannedWeeklySummary(),
    ]);

    if (!dcicGameState) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (loadDashboard && !dashboard) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spendableCents = Math.max(
      0,
      (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0)
    );
    const budgetRemainingCents =
      budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;
    const currency = budgetSettings.currency ?? "EUR";
    const isWeekly = budgetSettings.budget_period === "weekly";

    const now = Date.now();
    updateDynamicMissions(dcicGameState, now);
    triggerRandomEvents(dcicGameState, dateStr);
    await saveGameState(dcicGameState);

    const learningState = await getLearningState();
    const learning: LearningSnapshot = {
      weeklyMinutes,
      weeklyLearningTarget,
      learningStreak,
      focus: learningState.focus,
      streams: learningState.streams,
      consistency: learningState.consistency,
      reflection: {
        lastEntryDate: learningState.reflection.lastEntryDate,
        reflectionRequired: learningState.reflection.reflectionRequired,
      },
    };

    const completedToday = (tasksForDate ?? []).filter(
      (task) => !!(task as { completed?: boolean }).completed
    );

    const payload = {
      date: dateStr,
      dashboard: dashboard ?? null,
      dcicGameState,
      tasks: {
        [dateStr]: tasksForDate ?? [],
      },
      completedToday,
      dailyState,
      energyBudget: {
        remaining: energyBudget.remaining,
        capacity: energyBudget.capacity,
        completedTaskCount: energyBudget.completedTaskCount,
        suggestedTaskCount: energyBudget.suggestedTaskCount,
        taskUsed: energyBudget.taskUsed,
        taskPlanned: energyBudget.taskPlanned,
        calendarCost: energyBudget.calendarCost,
        energy: energyBudget.energy,
        focus: energyBudget.focus,
        load: energyBudget.load,
        insight: energyBudget.insight,
        brainMode: energyBudget.brainMode,
        segments: energyBudget.segments,
        consequence: energyBudget.consequence ?? undefined,
        activeStartedCount: energyBudget.activeStartedCount ?? undefined,
        maxSlots: energyBudget.maxSlots ?? undefined,
      },
      budget: {
        settings: budgetSettings,
        currentMonthExpenses,
        currentMonthIncome,
        currentWeekExpenses,
        currentWeekIncome,
        budgetRemainingCents,
        currency,
        isWeekly,
        financeState,
        financialInsights,
        disciplineXpThisWeek,
        disciplineCompletedToday,
        unplannedSummary,
      },
      learning,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    console.error("[API bootstrap/today]", err);
    return NextResponse.json(
      { error: "Failed to load bootstrap snapshot" },
      { status: 500 }
    );
  }
}


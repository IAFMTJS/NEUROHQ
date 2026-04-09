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
import { loadMissionsPipeline } from "@/lib/missions/load-missions-pipeline";
import { bootstrapEtagsMatch, computeBootstrapWeakEtag } from "@/lib/bootstrap-etag";
import { runDailyMissionsBootstrapServer } from "@/lib/bootstrap/run-daily-missions-bootstrap";

/** Default true. Set `includeDashboard=0` to skip `getDashboardPayload()` when the client already fetched `/api/dashboard/data` in the same flow (saves one full dashboard build). */
function includeDashboardInBootstrap(request: NextRequest): boolean {
  const v = request.nextUrl.searchParams.get("includeDashboard");
  if (v == null) return true;
  const lower = v.toLowerCase();
  return lower !== "0" && lower !== "false" && lower !== "no";
}

/** `depth=core`: missions/energy/tasks/DCIC only — skips budget + learning DB work and omits those JSON keys. */
function isBootstrapDepthCore(request: NextRequest): boolean {
  return request.nextUrl.searchParams.get("depth")?.toLowerCase() === "core";
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth
      .getUser()
      .catch(() => ({ data: { user: null } }));
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await runDailyMissionsBootstrapServer();
    } catch (bootErr) {
      console.error("[API bootstrap/today] daily missions bootstrap", bootErr);
    }

    const dateStr = todayDateString();
    const depthCore = isBootstrapDepthCore(request);
    const loadDashboard = includeDashboardInBootstrap(request) && !depthCore;
    const dashboardPromise = loadDashboard ? getDashboardPayload() : Promise.resolve(null);

    const budgetP = depthCore
      ? Promise.resolve(null)
      : Promise.all([
          getBudgetSettings(),
          getCurrentMonthExpensesCents(),
          getCurrentMonthIncomeCents(),
          getCurrentWeekExpensesCents(),
          getCurrentWeekIncomeCents(),
          getFinanceState(),
          getFinancialInsightsSafe(),
          getBudgetDisciplineXpThisWeek(),
          getBudgetDisciplineCompletedToday(),
          getUnplannedWeeklySummary(),
        ]).then(
          ([
            budgetSettings,
            currentMonthExpenses,
            currentMonthIncome,
            currentWeekExpenses,
            currentWeekIncome,
            financeState,
            financialInsights,
            disciplineXpThisWeek,
            disciplineCompletedToday,
            unplannedSummary,
          ]) => ({
            budgetSettings,
            currentMonthExpenses,
            currentMonthIncome,
            currentWeekExpenses,
            currentWeekIncome,
            financeState,
            financialInsights,
            disciplineXpThisWeek,
            disciplineCompletedToday,
            unplannedSummary,
          })
        );

    const learningPartialP = depthCore
      ? Promise.resolve(null)
      : (async () => {
          const today = new Date(dateStr + "T12:00:00Z");
          const { start, end } = getWeekBounds(today);
          const [weeklyMinutes, weeklyLearningTarget, learningStreak] = await Promise.all([
            getWeeklyMinutes(start, end),
            getWeeklyLearningTarget(),
            getLearningStreak(),
          ]);
          return { weeklyMinutes, weeklyLearningTarget, learningStreak };
        })();

    const [
      dashboard,
      dcicGameState,
      tasksForDate,
      dailyState,
      energyBudget,
      budgetData,
      learningPartial,
      missionsPipelineParallel,
    ] = await Promise.all([
      dashboardPromise,
      getGameState({ includeFinance: false }),
      getTasksForDate(dateStr),
      getDailyState(dateStr),
      getEnergyBudget(dateStr),
      budgetP,
      learningPartialP,
      loadMissionsPipeline(dateStr),
    ]);

    if (!dcicGameState) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (loadDashboard && !dashboard) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = Date.now();
    updateDynamicMissions(dcicGameState, now);
    triggerRandomEvents(dcicGameState, dateStr);
    await saveGameState(dcicGameState, { persistUserXp: false });

    let learning: LearningSnapshot | undefined;
    if (!depthCore && learningPartial) {
      const learningState = await getLearningState();
      learning = {
        weeklyMinutes: learningPartial.weeklyMinutes,
        weeklyLearningTarget: learningPartial.weeklyLearningTarget,
        learningStreak: learningPartial.learningStreak,
        focus: learningState.focus,
        streams: learningState.streams,
        consistency: learningState.consistency,
        reflection: {
          lastEntryDate: learningState.reflection.lastEntryDate,
          reflectionRequired: learningState.reflection.reflectionRequired,
        },
      };
    }

    let budget: Record<string, unknown> | undefined;
    if (!depthCore && budgetData) {
      const {
        budgetSettings,
        currentMonthExpenses,
        currentMonthIncome,
        currentWeekExpenses,
        currentWeekIncome,
        financeState,
        financialInsights,
        disciplineXpThisWeek,
        disciplineCompletedToday,
        unplannedSummary,
      } = budgetData;
      const spendableCents = Math.max(
        0,
        (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0)
      );
      const budgetRemainingCents =
        budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;
      const currency = budgetSettings.currency ?? "EUR";
      const isWeekly = budgetSettings.budget_period === "weekly";
      budget = {
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
      };
    }

    const completedToday = (tasksForDate ?? []).filter(
      (task) => !!(task as { completed?: boolean }).completed
    );

    const missionsPipelineForClient =
      dashboard?.critical?.missionsPipeline ?? missionsPipelineParallel;

    const energyBudgetJson = {
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
    };

    const payload: Record<string, unknown> = {
      date: dateStr,
      dashboard: depthCore ? null : (dashboard ?? null),
      dcicGameState,
      tasks: {
        [dateStr]: tasksForDate ?? [],
      },
      completedToday,
      dailyState,
      energyBudget: energyBudgetJson,
    };
    if (budget) payload.budget = budget;
    if (learning) payload.learning = learning;
    if (!loadDashboard) {
      payload.missionsPipeline = missionsPipelineForClient;
    }

    const etag = computeBootstrapWeakEtag(
      user.id,
      dateStr,
      tasksForDate ?? [],
      missionsPipelineForClient
    );
    if (bootstrapEtagsMatch(request.headers.get("if-none-match"), etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag },
      });
    }

    return NextResponse.json(payload, { status: 200, headers: { ETag: etag } });
  } catch (err) {
    console.error("[API bootstrap/today]", err);
    return NextResponse.json(
      { error: "Failed to load bootstrap snapshot" },
      { status: 500 }
    );
  }
}


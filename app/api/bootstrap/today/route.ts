import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDashboardPayload } from "@/app/actions/dashboard-data";
import { getGameState } from "@/app/actions/dcic/game-state";
import { todayDateString } from "@/lib/utils/timezone";
import { getWeekBounds } from "@/lib/utils/learning";
import { getTodaysTasks, getCompletedTodayTasks } from "@/app/actions/tasks";
import { getDailyState } from "@/app/actions/daily-state";
import { getEnergyBudget } from "@/app/actions/energy";
import { getBudgetSettings, getCurrentMonthExpensesCents } from "@/app/actions/budget";
import { getWeeklyMinutes, getWeeklyLearningTarget, getLearningStreak } from "@/app/actions/learning";
import { getLearningState } from "@/app/actions/learning-state";
import type { LearningSnapshot } from "@/types/hq-store.types";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dateStr = todayDateString();

    const [
      dashboard,
      dcicGameState,
      tasksResult,
      completedToday,
      dailyState,
      energyBudget,
      budgetSettings,
      currentMonthExpenses,
      weeklyMinutes,
      weeklyLearningTarget,
      learningStreak,
    ] = await Promise.all([
      getDashboardPayload(),
      getGameState({ includeFinance: false }),
      getTodaysTasks(dateStr, "normal"),
      getCompletedTodayTasks(dateStr),
      getDailyState(dateStr),
      getEnergyBudget(dateStr),
      getBudgetSettings(),
      getCurrentMonthExpensesCents(),
      // learning minutes over this week (not just today)
      (async () => {
        const today = new Date(dateStr + "T12:00:00Z");
        const { start, end } = getWeekBounds(today);
        return getWeeklyMinutes(start, end);
      })(),
      getWeeklyLearningTarget(),
      getLearningStreak(),
    ]);

    if (!dashboard) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const spendableCents = Math.max(
      0,
      (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0)
    );
    const budgetRemainingCents =
      budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;

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

    const payload = {
      date: dateStr,
      dashboard,
      dcicGameState,
      tasks: {
        [dateStr]: tasksResult.tasks,
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
        budgetRemainingCents,
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


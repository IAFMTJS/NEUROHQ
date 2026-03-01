import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileForSession } from "@/app/actions/auth";
import { getDailyState } from "@/app/actions/daily-state";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getQuoteForDay } from "@/app/actions/quote";
import { getEnergyBudget } from "@/app/actions/energy";
import { getLearningStreak, getWeeklyMinutes, getWeeklyLearningTarget } from "@/app/actions/learning";
import { getBudgetSettings, getCurrentMonthExpensesCents } from "@/app/actions/budget";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getXP, getXPIdentity } from "@/app/actions/xp";
import { getUserEconomy } from "@/app/actions/economy";
import { getTodayEngine } from "@/app/actions/dcic/today-engine";
import { getAutoSuggestions } from "@/app/actions/dcic/smart-suggestion";
import { getAccountabilitySettings } from "@/app/actions/behavior";
import { shouldShowStrategyCheckInReminder } from "@/app/actions/strategy";
import { getFrictionSignals } from "@/app/actions/friction";
import { getAdaptiveSuggestions } from "@/app/actions/adaptive";
import { ensureIdentityEngineRows } from "@/app/actions/identity-engine";
import { ensureMasterMissionsForToday } from "@/app/actions/master-missions";
import { yesterdayDate, getDayOfYearFromDateString } from "@/lib/utils/timezone";
import {
  scale1To10ToPct,
  defaultTimeWindow,
} from "@/lib/dashboard-utils";

/** GET /api/dashboard/data?part=critical|secondary — dashboard data for client shell (fast first paint). */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfileForSession();

    const part = request.nextUrl.searchParams.get("part");
    if (part === "critical") {
      return await criticalResponse();
    }
    if (part === "secondary") {
      return await secondaryResponse();
    }
    return NextResponse.json(
      { error: "Missing or invalid part. Use ?part=critical or ?part=secondary" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API dashboard/data]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function criticalResponse() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(dateStr)));
  const yesterdayStr = yesterdayDate(dateStr);

  await ensureIdentityEngineRows();
  await ensureMasterMissionsForToday(dateStr);

  const { applyZeroCompletionRollover } = await import("@/app/actions/daily-obligation");
  await applyZeroCompletionRollover(dateStr);

  const { getWeekBounds } = await import("@/lib/utils/learning");
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekBounds(today);

  const [
    state,
    yesterdayState,
    quoteToday,
    mode,
    energyBudget,
    learningStreak,
    prefs,
    xp,
    economy,
    budgetSettings,
    currentMonthExpenses,
    accountabilitySettings,
    todayEngine,
    showStrategyCheckIn,
    frictionSignals,
    adaptiveSuggestions,
    weeklyLearningMinutes,
    weeklyLearningTarget,
    autoSuggestions,
    consequenceState,
  ] = await Promise.all([
    getDailyState(dateStr),
    getDailyState(yesterdayStr),
    getQuoteForDay(quoteDay),
    getMode(dateStr),
    getEnergyBudget(dateStr),
    getLearningStreak(),
    getUserPreferencesOrDefaults(),
    getXP(),
    getUserEconomy(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getAccountabilitySettings(),
    getTodayEngine(dateStr),
    shouldShowStrategyCheckInReminder(),
    getFrictionSignals(),
    getAdaptiveSuggestions(dateStr),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getAutoSuggestions(dateStr),
    import("@/app/actions/consequence-engine").then((m) => m.getConsequenceState(dateStr)),
  ]);

  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks, carryOverCount } = await getTodaysTasks(dateStr, taskMode);

  const spendableCents = Math.max(
    0,
    (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0)
  );
  const budgetRemainingCents =
    budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;

  const energyPct = scale1To10ToPct(state?.energy ?? null);
  const focusPct = scale1To10ToPct(state?.focus ?? null);
  const loadPct = scale1To10ToPct(state?.sensory_load ?? null);

  const todaysTasks = (tasks ?? []).map((t) => ({
    id: (t as { id: string }).id,
    title: (t as { title: string }).title,
    carryOverCount: (t as { carry_over_count?: number }).carry_over_count ?? 0,
  }));
  const firstTask = tasks?.[0] as { id: string; title: string; impact?: number | null } | undefined;
  const estimatedXP = firstTask ? Math.max(10, Math.min(100, (firstTask.impact ?? 2) * 35)) : 50;
  const streakAtRisk = todayEngine.streakAtRisk;
  const singleGoalLabel = firstTask
    ? (streakAtRisk ? "Behoud je streak — " : "Wat nu: ") +
      (firstTask.title.length > 40 ? firstTask.title.slice(0, 37) + "…" : firstTask.title)
    : streakAtRisk
      ? "Behoud je streak — voltooi 1 missie vandaag"
      : null;
  const ctaVariants =
    streakAtRisk && todaysTasks.length > 0
      ? ["Behoud je streak — 1 missie", "Behoud streak"]
      : firstTask
        ? [`Voltooi 1 missie voor +${estimatedXP} XP`, "Start missie", "Volgende stap", `Claim +${estimatedXP} XP`]
        : ["Start Mission", "Start missie", "Volgende stap"];
  const missionLabel = ctaVariants[quoteDay % ctaVariants.length];
  const missionSubtext =
    todaysTasks.length > 0
      ? "Ga naar je missies en kies de volgende taak."
      : "Praat met de assistant om een taak toe te voegen.";
  const learningNeeded = weeklyLearningMinutes < weeklyLearningTarget;
  const emptyMissionMessage = learningNeeded
    ? `${weeklyLearningTarget} min this week to stay on track. Log time on Growth.`
    : "Add a task on Missions or head to Growth.";
  const emptyMissionHref = learningNeeded ? "/learning" : "/tasks";
  const { window: timeWindow, isActive: isTimeWindowActive } = defaultTimeWindow();

  const isMinimalUI = mode === "high_sensory";
  const showLateDayNoTask = new Date().getHours() >= 20 && energyBudget.completedTaskCount === 0;
  const actionsCount =
    (energyBudget.remaining < 0 ? 1 : 0) +
    (showLateDayNoTask ? 1 : 0) +
    (showStrategyCheckIn ? 1 : 0) +
    (frictionSignals.length > 0 ? 1 : 0) +
    (carryOverCount >= 3 ? 1 : 0) +
    (adaptiveSuggestions.themeSuggestion || adaptiveSuggestions.emotionSuggestion || adaptiveSuggestions.taskCountSuggestion != null ? 1 : 0) +
    (accountabilitySettings.enabled && streakAtRisk && accountabilitySettings.streakFreezeTokens > 0 ? 1 : 0);
  const topQuickActions = [
    { key: "streak", show: accountabilitySettings.enabled && streakAtRisk && accountabilitySettings.streakFreezeTokens > 0, label: "Streak", href: "/tasks" },
    { key: "energy", show: energyBudget.remaining < 0, label: "Licht", href: "/tasks" },
    { key: "late", show: showLateDayNoTask, label: "1 Actie", href: "/tasks" },
    { key: "strategy", show: showStrategyCheckIn, label: "Strategy", href: "/strategy" },
    { key: "friction", show: frictionSignals.length > 0, label: "Micro", href: "/tasks" },
    { key: "carry", show: carryOverCount >= 3, label: "Carry", href: "/tasks" },
    { key: "tip", show: !!(adaptiveSuggestions.themeSuggestion || adaptiveSuggestions.emotionSuggestion || adaptiveSuggestions.taskCountSuggestion != null), label: "Tip", href: "/tasks" },
  ]
    .filter((a) => a.show)
    .slice(0, 2);

  return NextResponse.json({
    dateStr,
    isMinimalUI,
    energyPct,
    focusPct,
    loadPct,
    budgetRemainingCents,
    currency: budgetSettings.currency ?? "EUR",
    xp: { total_xp: xp.total_xp, level: xp.level },
    economy: {
      discipline_points: economy.discipline_points,
      focus_credits: economy.focus_credits,
      momentum_boosters: economy.momentum_boosters,
    },
    actionsCount,
    topQuickActions,
    missionLabel,
    singleGoalLabel,
    missionSubtext,
    emptyMissionMessage,
    emptyMissionHref,
    dailyQuoteText: quoteToday?.quote_text ?? null,
    dailyQuoteAuthor: quoteToday?.author_name ?? null,
    streakAtRisk,
    todaysTasks,
    timeWindow,
    isTimeWindowActive,
    energyBudget: serializeEnergyBudget(energyBudget),
    state,
    yesterdayState,
    mode,
    carryOverCount,
    accountabilitySettings,
    learningStreak,
    copyVariant: adaptiveSuggestions.copyVariant,
    autoSuggestions,
    burnout: (consequenceState as { burnout?: boolean })?.burnout ?? false,
  });
}

function serializeEnergyBudget(b: Awaited<ReturnType<typeof getEnergyBudget>>) {
  return {
    remaining: b.remaining,
    capacity: b.capacity,
    completedTaskCount: b.completedTaskCount,
    suggestedTaskCount: b.suggestedTaskCount,
    taskUsed: b.taskUsed,
    taskPlanned: b.taskPlanned,
    calendarCost: b.calendarCost,
    energy: b.energy,
    focus: b.focus,
    load: b.load,
    insight: b.insight,
    brainMode: b.brainMode,
    segments: b.segments,
    consequence: b.consequence ?? undefined,
    activeStartedCount: b.activeStartedCount ?? undefined,
    maxSlots: b.maxSlots ?? undefined,
  };
}

async function secondaryResponse() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(dateStr)));
  const yesterdayStr = yesterdayDate(dateStr);
  const lastWeekDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { getWeekBounds } = await import("@/lib/utils/learning");
  const { start: lastWeekStart, end: lastWeekEnd } = getWeekBounds(lastWeekDate);
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekBounds(today);

  const [
    identity,
    identityEngine,
    momentum,
    todayEngine,
    xpForecast,
    heatmapDays,
    confrontationSummary,
    insightState,
    lastWeekReport,
    strategy,
    weeklyLearningMinutes,
    weeklyLearningTarget,
    budgetSettings,
    currentMonthExpenses,
    progressionRank,
    primeWindow,
    weeklyBudgetOutcome,
  ] = await Promise.all([
    getXPIdentity(),
    import("@/app/actions/identity-engine").then((m) => m.getIdentityEngine()),
    import("@/app/actions/dcic/momentum").then((m) => m.getMomentum()),
    getTodayEngine(dateStr),
    import("@/app/actions/dcic/xp-forecast").then((m) => m.getXPForecast(dateStr)),
    import("@/app/actions/dcic/heatmap").then((m) => m.getHeatmapLast30Days()),
    import("@/app/actions/confrontation-summary").then((m) => m.getConfrontationSummary()),
    import("@/app/actions/dcic/insight-engine").then((m) => m.getInsightEngineState()),
    import("@/app/actions/report").then((m) => m.getRealityReport(lastWeekStart, lastWeekEnd)),
    import("@/app/actions/strategy").then((m) => m.getQuarterlyStrategy()),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    import("@/app/actions/progression-rank").then((m) => m.getProgressionRankState()),
    import("@/app/actions/prime-window").then((m) => m.getPrimeWindow()),
    import("@/app/actions/weekly-budget-feedback").then((m) => m.getWeeklyBudgetOutcome()),
  ]);

  const { getWeekSummary, upsertDailyAnalytics } = await import("@/app/actions/analytics");
  const [weekSummary, , , frictionSignals] = await Promise.all([
    getWeekSummary(thisWeekStart, thisWeekEnd, weeklyLearningTarget),
    getAdaptiveSuggestions(dateStr),
    upsertDailyAnalytics(dateStr),
    getFrictionSignals(),
  ]);

  const [quotesPrev, quoteCurrent, quotesNext] = await Promise.all([
    getQuoteForDay(Math.max(1, quoteDay - 1)),
    getQuoteForDay(quoteDay),
    getQuoteForDay(Math.min(365, quoteDay + 1)),
  ]);
  const quotesResult = [quotesPrev, quoteCurrent, quotesNext];

  const state = await getDailyState(dateStr);
  const yesterdayState = await getDailyState(yesterdayStr);
  const energyPct = scale1To10ToPct(state?.energy ?? null);
  const focusPct = scale1To10ToPct(state?.focus ?? null);
  const loadPct = scale1To10ToPct(state?.sensory_load ?? null);
  const { defaultInsight, defaultSuggestion } = await import("@/lib/dashboard-utils");
  const insight = defaultInsight(energyPct, focusPct, loadPct);
  const patternSuggestion = defaultSuggestion(energyPct, focusPct, loadPct);

  const spendableCents = Math.max(0, (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0));
  const budgetRemainingCents = budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;

  return NextResponse.json({
    identity,
    identityEngine,
    momentum,
    todayEngine,
    xpForecast,
    heatmapDays,
    confrontationSummary,
    insightState,
    lastWeekReport,
    strategy,
    weeklyLearningMinutes,
    weeklyLearningTarget,
    weekSummary,
    frictionSignals,
    quotesResult,
    quoteDay,
    insight,
    patternSuggestion,
    budgetRemainingCents,
    currency: budgetSettings.currency ?? "EUR",
    state,
    yesterdayState,
    energyBudget: serializeEnergyBudget(await getEnergyBudget(dateStr)),
    progressionRank,
    primeWindow,
    weeklyBudgetOutcome,
  });
}

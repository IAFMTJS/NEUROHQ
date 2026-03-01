import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfileForSession } from "@/app/actions/auth";
import { getDailyState } from "@/app/actions/daily-state";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getModeFromState } from "@/lib/app-mode";
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
import { yesterdayDate, getDayOfYearFromDateString, todayDateString } from "@/lib/utils/timezone";
import { getWeekBounds } from "@/lib/utils/learning";
import {
  scale1To10ToPct,
  defaultTimeWindow,
  defaultInsight,
  defaultSuggestion,
} from "@/lib/dashboard-utils";
import { getIdentityEngine } from "@/app/actions/identity-engine";
import { getMomentum } from "@/app/actions/dcic/momentum";
import { getXPForecast } from "@/app/actions/dcic/xp-forecast";
import { getHeatmapLast30Days } from "@/app/actions/dcic/heatmap";
import { getConfrontationSummary } from "@/app/actions/confrontation-summary";
import { getInsightEngineState } from "@/app/actions/dcic/insight-engine";
import { getRealityReport } from "@/app/actions/report";
import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getProgressionRankState } from "@/app/actions/progression-rank";
import { getPrimeWindow } from "@/app/actions/prime-window";
import { getWeeklyBudgetOutcome } from "@/app/actions/weekly-budget-feedback";
import { getWeekSummary, upsertDailyAnalytics } from "@/app/actions/analytics";
import { getConsequenceState } from "@/app/actions/consequence-engine";
import { applyZeroCompletionRollover } from "@/app/actions/daily-obligation";
import type { EnergyBudget } from "@/app/actions/energy";
import type { TodayEngineResult } from "@/app/actions/dcic/today-engine";

/** Request-scoped today context: built once and reused by critical + secondary to avoid duplicate getTodayEngine/getDailyState/getEnergyBudget. */
type TodayContext = {
  dateStr: string;
  yesterdayStr: string;
  state: Awaited<ReturnType<typeof getDailyState>>;
  yesterdayState: Awaited<ReturnType<typeof getDailyState>>;
  tasks: Awaited<ReturnType<typeof getTodaysTasks>>["tasks"];
  carryOverCount: number;
  mode: ReturnType<typeof getModeFromState>;
  energyBudget: EnergyBudget;
  todayEngine: TodayEngineResult;
};

/** GET /api/dashboard/data?part=critical|secondary|all — dashboard data for client shell. Use part=all for one round-trip and no duplicate work. */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfileForSession(user);
    void ensureIdentityEngineRows(user.id);

    const part = request.nextUrl.searchParams.get("part");
    if (part === "all") {
      const ctx = await buildTodayContext();
      const [criticalPayload, secondaryPayload] = await Promise.all([
        buildCriticalPayload(ctx),
        buildSecondaryPayload(ctx),
      ]);
      return NextResponse.json({ critical: criticalPayload, secondary: secondaryPayload });
    }
    if (part === "critical") {
      return await criticalResponse();
    }
    if (part === "secondary") {
      return await secondaryResponse();
    }
    return NextResponse.json(
      { error: "Missing or invalid part. Use ?part=critical, ?part=secondary, or ?part=all" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API dashboard/data]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Build today context once: state, tasks, mode, energyBudget, todayEngine. */
async function buildTodayContext(): Promise<TodayContext> {
  const dateStr = todayDateString();
  const yesterdayStr = yesterdayDate(dateStr);

  await applyZeroCompletionRollover(dateStr);

  const [state, yesterdayState] = await Promise.all([
    getDailyState(dateStr),
    getDailyState(yesterdayStr),
  ]);

  const { tasks: initialTasks, carryOverCount } = await getTodaysTasks(dateStr, "normal");
  const mode = getModeFromState(state as { energy?: number | null; focus?: number | null; sensory_load?: number | null } | null, carryOverCount);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";

  const tasks = taskMode === "normal" ? initialTasks : (await getTodaysTasks(dateStr, taskMode)).tasks;
  const energyBudget = await getEnergyBudget(dateStr);
  const todayEngine = await getTodayEngine(dateStr, { tasks: tasks ?? [], carryOverCount, mode });

  return {
    dateStr,
    yesterdayStr,
    state,
    yesterdayState,
    tasks: tasks ?? initialTasks ?? [],
    carryOverCount,
    mode,
    energyBudget,
    todayEngine,
  };
}

async function buildCriticalPayload(ctx: TodayContext) {
  const today = new Date();
  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(ctx.dateStr)));
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekBounds(today);

  const [
    quoteToday,
    learningStreak,
    prefs,
    xp,
    economy,
    budgetSettings,
    currentMonthExpenses,
    accountabilitySettings,
    showStrategyCheckIn,
    frictionSignals,
    adaptiveSuggestions,
    weeklyLearningMinutes,
    weeklyLearningTarget,
    autoSuggestions,
    consequenceState,
  ] = await Promise.all([
    getQuoteForDay(quoteDay),
    getLearningStreak(),
    getUserPreferencesOrDefaults(),
    getXP(),
    getUserEconomy(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getAccountabilitySettings(),
    shouldShowStrategyCheckInReminder(),
    getFrictionSignals(),
    getAdaptiveSuggestions(ctx.dateStr),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getAutoSuggestions(ctx.dateStr),
    getConsequenceState(ctx.dateStr),
  ]);

  const { state, yesterdayState, tasks, carryOverCount, mode, energyBudget, todayEngine } = ctx;
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

  return {
    dateStr: ctx.dateStr,
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
  };
}

async function buildSecondaryPayload(ctx: TodayContext) {
  const today = new Date();
  const lastWeekDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { start: lastWeekStart, end: lastWeekEnd } = getWeekBounds(lastWeekDate);
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekBounds(today);

  const [
    identity,
    identityEngine,
    momentum,
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
    getIdentityEngine(),
    getMomentum(),
    getXPForecast(ctx.dateStr),
    getHeatmapLast30Days(),
    getConfrontationSummary(),
    getInsightEngineState(),
    getRealityReport(lastWeekStart, lastWeekEnd),
    getQuarterlyStrategy(),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getProgressionRankState(),
    getPrimeWindow(),
    getWeeklyBudgetOutcome(),
  ]);

  void upsertDailyAnalytics(ctx.dateStr);

  const [weekSummary, , frictionSignals] = await Promise.all([
    getWeekSummary(thisWeekStart, thisWeekEnd, weeklyLearningTarget),
    getAdaptiveSuggestions(ctx.dateStr),
    getFrictionSignals(),
  ]);

  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(ctx.dateStr)));
  const [quotesPrev, quoteCurrent, quotesNext] = await Promise.all([
    getQuoteForDay(Math.max(1, quoteDay - 1)),
    getQuoteForDay(quoteDay),
    getQuoteForDay(Math.min(365, quoteDay + 1)),
  ]);
  const quotesResult = [quotesPrev, quoteCurrent, quotesNext];

  const energyPct = scale1To10ToPct(ctx.state?.energy ?? null);
  const focusPct = scale1To10ToPct(ctx.state?.focus ?? null);
  const loadPct = scale1To10ToPct(ctx.state?.sensory_load ?? null);
  const insight = defaultInsight(energyPct, focusPct, loadPct);
  const patternSuggestion = defaultSuggestion(energyPct, focusPct, loadPct);
  const spendableCents = Math.max(0, (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0));
  const budgetRemainingCents = budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;

  return {
    identity,
    identityEngine,
    momentum,
    todayEngine: ctx.todayEngine,
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
    state: ctx.state,
    yesterdayState: ctx.yesterdayState,
    energyBudget: serializeEnergyBudget(ctx.energyBudget),
    progressionRank,
    primeWindow,
    weeklyBudgetOutcome,
  };
}

async function criticalResponse() {
  const dateStr = todayDateString();
  const today = new Date();
  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(dateStr)));
  const yesterdayStr = yesterdayDate(dateStr);

  await applyZeroCompletionRollover(dateStr);

  const { start: thisWeekStart, end: thisWeekEnd } = getWeekBounds(today);

  const [
    state,
    yesterdayState,
    quoteToday,
    learningStreak,
    prefs,
    xp,
    economy,
    budgetSettings,
    currentMonthExpenses,
    accountabilitySettings,
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
    getLearningStreak(),
    getUserPreferencesOrDefaults(),
    getXP(),
    getUserEconomy(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getAccountabilitySettings(),
    shouldShowStrategyCheckInReminder(),
    getFrictionSignals(),
    getAdaptiveSuggestions(dateStr),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getAutoSuggestions(dateStr),
    getConsequenceState(dateStr),
  ]);

  const { tasks: initialTasks, carryOverCount } = await getTodaysTasks(dateStr, "normal");
  const mode = getModeFromState(state as { energy?: number | null; focus?: number | null; sensory_load?: number | null } | null, carryOverCount);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks } = taskMode === "normal" ? { tasks: initialTasks } : await getTodaysTasks(dateStr, taskMode);
  const energyBudget = await getEnergyBudget(dateStr);
  const todayEngine = await getTodayEngine(dateStr, { tasks: tasks ?? [], carryOverCount, mode });

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
  const dateStr = todayDateString();
  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(dateStr)));
  const yesterdayStr = yesterdayDate(dateStr);
  const lastWeekDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
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
    getIdentityEngine(),
    getMomentum(),
    getTodayEngine(dateStr),
    getXPForecast(dateStr),
    getHeatmapLast30Days(),
    getConfrontationSummary(),
    getInsightEngineState(),
    getRealityReport(lastWeekStart, lastWeekEnd),
    getQuarterlyStrategy(),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getProgressionRankState(),
    getPrimeWindow(),
    getWeeklyBudgetOutcome(),
  ]);

  void upsertDailyAnalytics(dateStr);

  const [weekSummary, , frictionSignals] = await Promise.all([
    getWeekSummary(thisWeekStart, thisWeekEnd, weeklyLearningTarget),
    getAdaptiveSuggestions(dateStr),
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

import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import { HeroMascotImage } from "@/components/HeroMascotImage";
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
  getMonthExpensesCents,
  getMonthIncomeCents,
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
import { formatMonthYearShort } from "@/lib/utils/date-locale";
import { formatCents } from "@/lib/utils/currency";
import { getBudgetToday, getBudgetAdjacentMonths, getPreviousPeriodBounds } from "@/lib/utils/budget-date";
import { getSafeDaysThisWeek, getBudgetLoadTrend } from "@/lib/dcic/finance-engine";
import { deriveCanonicalBudgetSignals } from "@/lib/budget/canonical";
import { BudgetOverviewLockGate } from "@/components/budget/BudgetOverviewLockGate";
import { BudgetExecuteHub } from "@/components/budget/BudgetExecuteHub";
import { BudgetInsightHub } from "@/components/budget/BudgetInsightHub";
import { BudgetDailyControlToast } from "@/components/budget/BudgetDailyControlToast";
import { BudgetPrePaydayUrgencyToast } from "@/components/budget/BudgetPrePaydayUrgencyToast";
import { BudgetWeeklyPaceGuardToast } from "@/components/budget/BudgetWeeklyPaceGuardToast";
import { BudgetSyncStatus } from "@/components/budget/BudgetSyncStatus";
import { RemainingBudgetHero } from "@/components/budget/RemainingBudgetHero";
import { BudgetTabsShell } from "@/components/budget/BudgetTabsShell";
import { BudgetSnapshotProvider } from "@/components/budget/BudgetSnapshotProvider";
import { BudgetSnapshotFallback } from "@/components/budget/BudgetSnapshotFallback";
import { PaydayPlannerCard } from "@/components/budget/PaydayPlannerCard";
import { GroceryMissionPlannerCard } from "@/components/budget/GroceryMissionPlannerCard";
import { BudgetLockHub } from "@/components/budget/BudgetLockHub";
import { BudgetOptimizationHub } from "@/components/budget/BudgetOptimizationHub";
import { StrategyEnginePaceHint } from "@/components/strategy/StrategyEnginePaceHint";
import hudStyles from "@/components/hud-test/hud.module.css";

const BudgetHistorySelector = nextDynamic(() => import("@/components/BudgetHistorySelector").then((m) => ({ default: m.BudgetHistorySelector })), { loading: () => null });
const ExportBudgetCsvButton = nextDynamic(() => import("@/components/ExportBudgetCsvButton").then((m) => ({ default: m.ExportBudgetCsvButton })), { loading: () => null });
const BudgetPlanCard = nextDynamic(() => import("@/components/budget/BudgetPlanCard").then((m) => ({ default: m.BudgetPlanCard })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
// Temporary gate for UX reset rollout; keep experimental cards disabled by default.
const ENABLE_BUDGET_UX_EXPERIMENTS = false;
const ENABLE_BUDGET_BEHAVIOR_REIMAGINING = false;

type Props = { searchParams: Promise<{ month?: string; tab?: string }> };

/** Always fetch fresh data so "Vandaag loon gehad" (new period) is reflected everywhere. */
export const dynamic = "force-dynamic";

async function BudgetContent({ searchParams }: Props) {
  const today = getBudgetToday();
  const params = await searchParams;
  const monthParam = params.month;
  const tabParam = params.tab;
  const isHistoryView = !!monthParam && /^\d{4}-\d{2}$/.test(monthParam);
  const [year, month] = isHistoryView ? monthParam!.split("-").map(Number) : [0, 0];

  try {
    await generateRecurringEntries();
  } catch {
    /* table may not exist yet */
  }
  try {
    await autoAwardBudgetOptimizationForCurrentUser();
  } catch {
    /* ignore auto-award failures to keep budget page resilient */
  }
  await syncBudgetDisciplineFromDataForToday();
  const prefs = await getUserPreferencesOrDefaults();
  const simplifiedBudget = prefs.simplified_content === true;
  const periodBounds = await getBudgetPeriodBounds();
  const { periodStart, periodEnd, isPaydayCycle } = periodBounds;
  const { nextMonthStart, nextMonthEnd, prevMonthStart, prevMonthEnd } = getBudgetAdjacentMonths();
  const paydayDayOfMonth = await getPaydayDayOfMonth();
  const prevPeriodRange = isPaydayCycle
    ? getPreviousPeriodBounds(periodStart, paydayDayOfMonth ?? 25)
    : { prevStart: prevMonthStart, prevEnd: prevMonthEnd };
  const [goals, entries, nextMonthEntries, prevMonthEntries, alternatives, budgetSettings, currentMonthExpenses, currentMonthIncome, currentWeekExpenses, currentWeekIncome, activeFrozen, readyForAction, unplannedSummary, contributions, recurringTemplates, financeState, financialInsights, incomeSources, budgetTargets, _paydayDayOfMonth, weeklyReviewStatus, disciplineXpThisWeek, disciplineCompletedToday, impulseWindow, budgetControlState, optimization] = await Promise.all([
    getSavingsGoals(),
    getBudgetEntries(periodStart, periodEnd),
    getBudgetEntries(nextMonthStart, nextMonthEnd),
    getBudgetEntries(prevPeriodRange.prevStart, prevPeriodRange.prevEnd),
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
    Promise.resolve(paydayDayOfMonth),
    getBudgetWeeklyReviewStatus(),
    getBudgetDisciplineXpThisWeek(),
    getBudgetDisciplineCompletedToday(),
    getImpulseTimeWindow(),
    getBudgetControlState(),
    getBudgetOptimizationSuggestions(),
  ]);
  type EntryRow = { date: string; amount_cents: number; category: string | null };
  const categoryTotals = (entries as EntryRow[])
    .filter((e) => (e.amount_cents ?? 0) < 0)
    .reduce((acc, e) => {
      const cat = e.category?.trim() || "Other";
      acc[cat] = (acc[cat] ?? 0) + Math.abs(e.amount_cents ?? 0);
      return acc;
    }, {} as Record<string, number>);
  const nextPaydayLabel = financialInsights
    ? `Volgende loondag: ${format(addDays(new Date(), financialInsights.daysUntilNextIncome), "d MMMM", { locale: nl })}`
    : "Stel loondag in om te zien hoeveel dagen nog.";
  const nextPaydayShortLabel = financialInsights
    ? format(addDays(new Date(), financialInsights.daysUntilNextIncome), "d MMM", { locale: nl })
    : null;
  const contributedByGoal = (contributions as { goal_id: string; amount_cents: number }[]).reduce((acc, c) => {
    acc[c.goal_id] = (acc[c.goal_id] || 0) + c.amount_cents;
    return acc;
  }, {} as Record<string, number>);
  const currency = budgetSettings.currency ?? "EUR";
  const spendableCents = Math.max(
    0,
    (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0)
  );
  const isWeekly = budgetSettings.budget_period === "weekly";
  const disciplineInputsReady =
    (budgetSettings.monthly_budget_cents ?? 0) > 0 || (entries as EntryRow[]).length > 0;

  const activeTab: "overview" | "execute" | "analysis" | "optimization" | "lock" | "tactical" | "goals" =
    tabParam === "execute" || tabParam === "tactical" || tabParam === "analysis" || tabParam === "goals" || tabParam === "optimization" || tabParam === "lock"
      ? tabParam
      : "overview";

  const lockPanelParams = new URLSearchParams();
  if (isHistoryView && monthParam) lockPanelParams.set("month", monthParam);
  lockPanelParams.set("tab", "lock");
  const lockPanelHref = `/budget?${lockPanelParams.toString()}#budget-lock-control`;
  const emergencyPanelHref = `/budget?${lockPanelParams.toString()}#budget-lock-emergency`;
  const executeEntriesParams = new URLSearchParams();
  if (isHistoryView && monthParam) executeEntriesParams.set("month", monthParam);
  executeEntriesParams.set("tab", "execute");
  const executeEntriesHref = `/budget?${executeEntriesParams.toString()}#entries-frozen`;

  // Canonical page-level sources used by all sections/cards in this view.
  let expensesCents = currentMonthExpenses; // canonical spent value for active period
  let incomeCents = currentMonthIncome; // canonical income value for active period
  let periodLabel = "this month"; // canonical period label for active period
  let historyMode = false;
  if (isHistoryView) {
    expensesCents = await getMonthExpensesCents(year, month);
    incomeCents = await getMonthIncomeCents(year, month);
    periodLabel = formatMonthYearShort(year, month);
    historyMode = true;
  } else if (isWeekly) {
    expensesCents = currentWeekExpenses;
    incomeCents = currentWeekIncome;
    periodLabel = "this week";
  }
  const remainingToSpendCents =
    !historyMode
      ? financeState?.planning?.plannedRemainingCents ??
        (budgetSettings.monthly_budget_cents ?? 0) -
          (budgetSettings.monthly_savings_cents ?? 0) -
          expensesCents
      : null;
  const canonicalBudgetView = {
    periodLabel,
    remainingToSpendCents,
    daysUntilNextIncome: financialInsights?.daysUntilNextIncome ?? 0,
    disciplineScore: financeState?.disciplineScore ?? null,
  } as const;

  let previousPeriodRemaining: { prevStart: string; prevEnd: string; remainingCents: number; label: string } | null = null;
  if (!historyMode && isPaydayCycle && periodStart) {
    const paydayDay = paydayDayOfMonth ?? 25;
    const prev = getPreviousPeriodBounds(periodStart, paydayDay);
    const prevEntriesForCalc = (prevMonthEntries as EntryRow[]).filter(
      (e) => e.date >= prev.prevStart && e.date <= prev.prevEnd,
    );
    const prevExpensesCents = prevEntriesForCalc
      .filter((e) => (e.amount_cents ?? 0) < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount_cents ?? 0), 0);
    const spendable = Math.max(0, (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0));
    const prevRemainingCents = spendable - prevExpensesCents;
    previousPeriodRemaining = {
      prevStart: prev.prevStart,
      prevEnd: prev.prevEnd,
      remainingCents: prevRemainingCents,
      label: `${format(new Date(prev.prevStart + "T12:00:00Z"), "d MMM", { locale: nl })} – ${format(new Date(prev.prevEnd + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}`,
    };
  }

  const daysUnderBudgetThisWeek =
    !historyMode && financeState ? getSafeDaysThisWeek(financeState) : null;
  const loadTrend = !historyMode && financeState ? getBudgetLoadTrend(financeState) : [];
  const daysUntilNextIncome = financialInsights?.daysUntilNextIncome ?? 0;
  const {
    safeDailySpendCents: canonicalSafeDailySpendCents,
    projectedOverspendCents: canonicalProjectedOverspendCents,
    insightsSorted: canonicalInsightsSorted,
    topInsight: canonicalTopInsight,
  } = deriveCanonicalBudgetSignals({
    remainingToSpendCents,
    daysUntilNextIncome,
    insights: financialInsights?.insights,
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
  const unplannedRate = entries.length > 0 ? (unplannedSummary.count / entries.length) * 100 : 0;
  const archetype =
    remainingToSpendCents != null && remainingToSpendCents < 0
      ? "Reactive spender"
      : unplannedRate > 40
      ? "Comfort spender"
      : disciplineXpThisWeek > 10
      ? "Planner"
      : "Adaptive spender";
  const archetypeReason =
    remainingToSpendCents != null && remainingToSpendCents < 0
      ? "Recent tempo ligt boven je veilige pace en remaining staat onder druk."
      : unplannedRate > 40
      ? "Relatief veel ongeplande uitgaven in de huidige cyclus."
      : disciplineXpThisWeek > 10
      ? "Consistente discipline-signalen en stabiele weekperformance."
      : "Gemengd patroon met wisselende planning vs uitvoering.";
  const archetypeAction =
    archetype === "Reactive spender"
      ? "Zet 1 no-spend window in voor de komende 24 uur."
      : archetype === "Comfort spender"
      ? "Plan je volgende grote boodschappen vooraf met een harde cap."
      : archetype === "Planner"
      ? "Behoud je cap en sluit weekreview af op tijd."
      : "Kies 1 categorie om 48 uur strak te begrenzen.";
  const commandStatus =
    remainingToSpendCents == null
      ? { title: "History snapshot", tone: "text-slate-300", border: "border-slate-400/30 bg-slate-400/10" }
      : remainingToSpendCents < 0
      ? { title: "Critical", tone: "text-amber-200", border: "border-amber-400/30 bg-amber-400/10" }
      : remainingToSpendCents < 5000
      ? { title: "Guarded", tone: "text-[var(--mode-text-soft)]", border: "border-[var(--semantic-ring)]/30 bg-[var(--semantic-accent)]/10" }
      : { title: "Stable", tone: "text-emerald-200", border: "border-emerald-400/30 bg-emerald-400/10" };

  const budgetCommandToolbar = (
    <>
      <ExportBudgetCsvButton />
      <Link
        href="/strategy"
        className="inline-flex items-center justify-center rounded border border-[rgba(var(--mode-rgb),0.2)] bg-[var(--bg-elevated)]/40 px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.3)] focus-visible:ring-offset-0"
      >
        Strategy
      </Link>
    </>
  );

  const overviewSection = (
    <div className="space-y-4">
      {historyMode && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <BudgetHistorySelector currentMonth={monthParam} />
          {budgetCommandToolbar}
        </div>
      )}
      {!historyMode && <BudgetDailyControlToast />}
      {!historyMode && (
        <BudgetWeeklyPaceGuardToast
          historyMode={historyMode}
          spendableCents={spendableCents}
          budgetPeriod={budgetSettings.budget_period}
          periodStart={periodStart}
          periodEnd={periodEnd}
          weekSpentCents={currentWeekExpenses}
        />
      )}
      {!historyMode && (
        <>
          <BudgetSyncStatus historyMode={historyMode} suppressChrome />
          <RemainingBudgetHero
            budgetCents={budgetSettings.monthly_budget_cents ?? 0}
            savingsCents={budgetSettings.monthly_savings_cents ?? 0}
            expensesCents={expensesCents}
            currency={currency}
            periodLabel={periodLabel}
            budgetPeriod={budgetSettings.budget_period}
            historyMode={historyMode}
            logDate={today}
            daysUntilNextIncome={financialInsights?.daysUntilNextIncome ?? null}
            nextPaydayShortLabel={nextPaydayShortLabel}
            safeDailySpendCents={canonicalSafeDailySpendCents}
            previousPeriodRemaining={previousPeriodRemaining}
            disciplineXpThisWeek={disciplineXpThisWeek}
            periodStart={periodStart}
            periodEnd={periodEnd}
            executeHref={executeEntriesHref}
            historyMonthParam={monthParam}
            commandToolbar={budgetCommandToolbar}
          />
        </>
      )}
    </div>
  );

  const tacticalSection = (
    <div className="space-y-5">
      {!historyMode && (
        <BudgetExecuteHub
          today={today}
          currency={currency}
          financeState={financeState}
          daysUntilNextIncome={financialInsights?.daysUntilNextIncome ?? 0}
          nextPaydayLabel={nextPaydayLabel}
          incomeSources={incomeSources}
          paydayDayOfMonth={paydayDayOfMonth}
          cycleStartDate={financialInsights?.cycleStartDate ?? null}
          nextPaydayDate={financialInsights?.nextPaydayDate ?? null}
          serverRowUpdatedAt={budgetSettings.row_updated_at}
          entries={entries}
          goals={goals}
          contributedByGoal={contributedByGoal}
          activeFrozen={activeFrozen}
          readyForAction={readyForAction}
          recurringTemplates={recurringTemplates}
          isPaydayCycle={isPaydayCycle}
          prevPeriodRange={prevPeriodRange}
          prevMonthEntries={prevMonthEntries}
          executeEntriesHref={executeEntriesHref}
        />
      )}

      {ENABLE_BUDGET_BEHAVIOR_REIMAGINING && (
        <div className="card-simple space-y-4 p-4 md:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Allocation plan</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <PaydayPlannerCard
              monthlyBudgetCents={budgetSettings.monthly_budget_cents ?? 0}
              monthlySavingsCents={budgetSettings.monthly_savings_cents ?? 0}
              currency={currency}
            />
            <GroceryMissionPlannerCard currency={currency} />
          </div>
          <BudgetPlanCard targets={budgetTargets} spentByCategory={categoryTotals} currency={currency} />
        </div>
      )}
    </div>
  );

  const analysisSection = (
    <BudgetInsightHub
      historyMode={historyMode}
      uxExperiments={ENABLE_BUDGET_UX_EXPERIMENTS}
      behaviorReimagining={ENABLE_BUDGET_BEHAVIOR_REIMAGINING}
      currency={currency}
      periodLabel={periodLabel}
      budgetPeriod={budgetSettings.budget_period === "weekly" ? "weekly" : "monthly"}
      categoryTotals={categoryTotals}
      goals={goals}
      alternatives={alternatives}
      commandStatus={commandStatus}
      remainingToSpendCents={remainingToSpendCents}
      disciplineScore={financeState?.disciplineScore ?? null}
      disciplineInputsReady={disciplineInputsReady}
      monthlyBudgetCents={budgetSettings.monthly_budget_cents}
      monthlySavingsCents={budgetSettings.monthly_savings_cents}
      expensesCents={expensesCents}
      incomeCents={incomeCents}
      forecastProjectedBalanceCents={financialInsights?.forecast?.projectedBalance ?? null}
      forecastOverspendCents={financialInsights?.forecast?.overspend ?? null}
      financeState={financeState}
      daysUntilNextIncome={canonicalBudgetView.daysUntilNextIncome}
      safeDailySpendOverrideCents={canonicalSafeDailySpendCents}
      daysUnderBudgetThisWeek={daysUnderBudgetThisWeek}
      disciplineXpThisWeek={disciplineXpThisWeek}
      insights={financialInsights?.insights ?? []}
      unplannedCount={unplannedSummary.count}
      unplannedTotalCents={unplannedSummary.totalCents}
      emergencyActive={financialInsights?.emergencyMode.active ?? false}
      emergencyReasons={financialInsights?.emergencyMode.reason ?? []}
      loadTrend={loadTrend}
      impulseWindow={impulseWindow}
      weeklyReviewCompleted={weeklyReviewStatus.completed}
      canonicalInsightsSorted={canonicalInsightsSorted}
      canonicalTopInsight={canonicalTopInsight}
      archetype={archetype}
      archetypeReason={archetypeReason}
      archetypeAction={archetypeAction}
      topCategories={topCategories}
      prevMonthEntries={prevMonthEntries}
      nextMonthEntries={nextMonthEntries}
      isPaydayCycle={isPaydayCycle}
    />
  );

  /** Goals, recurring, entries & frozen live in Execute via BudgetExecuteHub (toasts + tiles). */
  const goalsSection = null;

  const optimizationSection = (
    <BudgetOptimizationHub
      historyMode={historyMode}
      needsPaydaySurvey={budgetControlState.needsPaydaySurvey}
      weeklyReviewCompleted={weeklyReviewStatus.completed}
      lockPanelHref={lockPanelHref}
      summary={optimization.summary}
      suggestions={optimization.suggestions}
      challenges={optimization.challenges}
    />
  );

  const lockSection = (
    <BudgetLockHub
      historyMode={historyMode}
      lockActive={budgetControlState.lockActive}
      lockUntil={budgetControlState.lockUntil}
      lockUntilAt={budgetControlState.lockUntilAt}
      currency={currency}
    />
  );

  const budgetTabsShell = (
    <BudgetTabsShell
      key={monthParam ?? "live"}
      initialTab={activeTab}
      isHistoryView={isHistoryView}
      historyMode={historyMode}
      lockActive={budgetControlState.lockActive}
      lockUntil={budgetControlState.lockUntil}
      lockUntilAt={budgetControlState.lockUntilAt}
      lockPanelHref={lockPanelHref}
      headerRight={null}
      simplifiedLayout={simplifiedBudget}
      simplifiedTopSlot={
        simplifiedBudget && !historyMode ? (
          <BudgetPrePaydayUrgencyToast
            daysToPayday={budgetControlState.daysToPayday}
            needsPaydaySurvey={budgetControlState.needsPaydaySurvey}
            hasRecentSurvey={budgetControlState.hasRecentSurvey}
          />
        ) : undefined
      }
      belowTabsSlot={
        simplifiedBudget ? undefined : (
          <>
            {!isHistoryView && (
              <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="budget" aria-hidden>
                <div className="mascot-hero-inner mx-auto">
                  <HeroMascotImage page="budget" className="mascot-img" heroLarge />
                </div>
              </section>
            )}
            {!historyMode && (
              <Suspense fallback={null}>
                <StrategyEnginePaceHint variant="budget" />
              </Suspense>
            )}
            {!historyMode && (
              <BudgetPrePaydayUrgencyToast
                daysToPayday={budgetControlState.daysToPayday}
                needsPaydaySurvey={budgetControlState.needsPaydaySurvey}
                hasRecentSurvey={budgetControlState.hasRecentSurvey}
              />
            )}
          </>
        )
      }
      overview={
        <BudgetOverviewLockGate
          lockPanelHref={lockPanelHref}
          emergencyPanelHref={emergencyPanelHref}
          lockActive={!historyMode && budgetControlState.lockActive}
          lockUntil={budgetControlState.lockUntil}
          lockUntilAt={budgetControlState.lockUntilAt}
        >
          {overviewSection}
        </BudgetOverviewLockGate>
      }
      tactical={tacticalSection}
      analysis={analysisSection}
      goals={goalsSection}
      optimization={optimizationSection}
      lock={lockSection}
    />
  );

  return (
    <BudgetSnapshotProvider>
      <main
        className={
          simplifiedBudget
            ? `relative overflow-hidden flex min-h-0 flex-1 flex-col ${hudStyles.flatGlassPageRoot}`
            : "relative min-h-screen"
        }
      >
        {simplifiedBudget ? (
          <div className="relative z-10 flex min-h-[calc(100svh-7rem)] w-full max-w-none flex-1 flex-col pb-6 sm:min-h-[calc(100svh-6.5rem)] dashboard-cinematic">
            {budgetTabsShell}
          </div>
        ) : (
          <div className="container page page-wide dashboard-cinematic relative z-10 pb-10">
            {budgetTabsShell}
          </div>
        )}
      </main>
    </BudgetSnapshotProvider>
  );
}

export default function BudgetPage(props: Props) {
  return (
    <Suspense fallback={<BudgetSnapshotFallback />}>
      <BudgetContent {...props} />
    </Suspense>
  );
}


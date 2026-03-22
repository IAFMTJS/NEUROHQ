import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import { HQPageHeader } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getSavingsGoals, getSavingsContributions } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";
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
import type { Insight } from "@/lib/dcic/finance-engine";
import { deriveCanonicalBudgetSignals } from "@/lib/budget/canonical";
import { BudgetOverviewLockGate } from "@/components/budget/BudgetOverviewLockGate";
import { DisciplineIndexCard } from "@/components/budget/DisciplineIndexCard";
import { BudgetQuickLogCard } from "@/components/budget/BudgetQuickLogCard";
import { BudgetDailyControlToast } from "@/components/budget/BudgetDailyControlToast";
import { BudgetSyncStatus } from "@/components/budget/BudgetSyncStatus";
import { BudgetPerformanceSummaryCard } from "@/components/budget/BudgetPerformanceSummaryCard";
import { BudgetPatternDetectionCard } from "@/components/budget/BudgetPatternDetectionCard";
import { RemainingBudgetHero } from "@/components/budget/RemainingBudgetHero";
import { BudgetTabsShell } from "@/components/budget/BudgetTabsShell";
import { BudgetSnapshotProvider } from "@/components/budget/BudgetSnapshotProvider";
import { BudgetSnapshotFallback } from "@/components/budget/BudgetSnapshotFallback";
import { BudgetStabilityRiskCard } from "@/components/budget/BudgetStabilityRiskCard";
import { BudgetNextActionCard } from "@/components/budget/BudgetNextActionCard";
import { BudgetForecastAndReviewCard } from "@/components/budget/BudgetForecastAndReviewCard";
import { BudgetInsightsAndSpendingCard } from "@/components/budget/BudgetInsightsAndSpendingCard";
import { BudgetRiskInsightCard } from "@/components/budget/BudgetRiskInsightCard";
import { WeeklyPerformanceCard } from "@/components/budget/WeeklyPerformanceCard";
import { BudgetCognitiveLoadTrendCard } from "@/components/budget/BudgetCognitiveLoadTrendCard";
import { PaydayPlannerCard } from "@/components/budget/PaydayPlannerCard";
import { GroceryMissionPlannerCard } from "@/components/budget/GroceryMissionPlannerCard";
import { ArchetypeRiskLensCard } from "@/components/budget/ArchetypeRiskLensCard";
import { ImpulseTriggerMapCard } from "@/components/budget/ImpulseTriggerMapCard";
import { ReflectionEngineCard } from "@/components/budget/ReflectionEngineCard";
import { BudgetLockControlCard } from "@/components/budget/BudgetLockControlCard";
import { BudgetPaydaySurveyCard } from "@/components/budget/BudgetPaydaySurveyCard";
import { BudgetOptimizationCard } from "@/components/budget/BudgetOptimizationCard";
import { StrategyEnginePaceHint } from "@/components/strategy/StrategyEnginePaceHint";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";

const BudgetHistorySelector = nextDynamic(() => import("@/components/BudgetHistorySelector").then((m) => ({ default: m.BudgetHistorySelector })), { loading: () => null });
const ExportBudgetCsvButton = nextDynamic(() => import("@/components/ExportBudgetCsvButton").then((m) => ({ default: m.ExportBudgetCsvButton })), { loading: () => null });
const BudgetSummaryCard = nextDynamic(() => import("@/components/BudgetSummaryCard").then((m) => ({ default: m.BudgetSummaryCard })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const FinancialStatusCard = nextDynamic(() => import("@/components/dcic/FinancialStatusCard").then((m) => ({ default: m.FinancialStatusCard })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const WeeklyTacticalCard = nextDynamic(() => import("@/components/dcic/WeeklyTacticalCard").then((m) => ({ default: m.WeeklyTacticalCard })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const PaydayCard = nextDynamic(() => import("@/components/budget/PaydayCard").then((m) => ({ default: m.PaydayCard })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const FinancialInsightsCard = nextDynamic(() => import("@/components/dcic/FinancialInsightsCard").then((m) => ({ default: m.FinancialInsightsCard })), { loading: () => null });
const ExpenseDistributionChart = nextDynamic(() => import("@/components/budget/ExpenseDistributionChart").then((m) => ({ default: m.ExpenseDistributionChart })), { loading: () => <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const BudgetPlanCard = nextDynamic(() => import("@/components/budget/BudgetPlanCard").then((m) => ({ default: m.BudgetPlanCard })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const SavingsTipsCard = nextDynamic(() => import("@/components/budget/SavingsTipsCard").then((m) => ({ default: m.SavingsTipsCard })), { loading: () => null });
const FrozenPurchaseCard = nextDynamic(() => import("@/components/FrozenPurchaseCard").then((m) => ({ default: m.FrozenPurchaseCard })), { loading: () => null });
const SavingsGoalCard = nextDynamic(() => import("@/components/SavingsGoalCard").then((m) => ({ default: m.SavingsGoalCard })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const AddSavingsGoalForm = nextDynamic(() => import("@/components/AddSavingsGoalForm").then((m) => ({ default: m.AddSavingsGoalForm })), { loading: () => null });
const RecurringBudgetCard = nextDynamic(() => import("@/components/RecurringBudgetCard").then((m) => ({ default: m.RecurringBudgetCard })), { loading: () => null });
const AddBudgetEntryForm = nextDynamic(() => import("@/components/AddBudgetEntryForm").then((m) => ({ default: m.AddBudgetEntryForm })), { loading: () => <div className="min-h-[140px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const BudgetEntryList = nextDynamic(() => import("@/components/BudgetEntryList").then((m) => ({ default: m.BudgetEntryList })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const NextMonthExpensesTrigger = nextDynamic(() => import("@/components/budget/NextMonthExpensesTrigger").then((m) => ({ default: m.NextMonthExpensesTrigger })), { loading: () => null });
const LastMonthExpensesTrigger = nextDynamic(() => import("@/components/budget/LastMonthExpensesTrigger").then((m) => ({ default: m.LastMonthExpensesTrigger })), { loading: () => null });
const AlternativesList = nextDynamic(() => import("@/components/AlternativesList").then((m) => ({ default: m.AlternativesList })), { loading: () => null });
const BudgetAchievementsCard = nextDynamic(
  () => import("@/components/budget/BudgetAchievementsCard").then((m) => ({ default: m.BudgetAchievementsCard })),
  { loading: () => null }
);
const BudgetWeeklyReviewCard = nextDynamic(
  () => import("@/components/budget/BudgetWeeklyReviewCard").then((m) => ({ default: m.BudgetWeeklyReviewCard })),
  { loading: () => null }
);

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
  const contributedByGoal = (contributions as { goal_id: string; amount_cents: number }[]).reduce((acc, c) => {
    acc[c.goal_id] = (acc[c.goal_id] || 0) + c.amount_cents;
    return acc;
  }, {} as Record<string, number>);
  const currency = budgetSettings.currency ?? "EUR";
  const isWeekly = budgetSettings.budget_period === "weekly";
  const disciplineInputsReady =
    (budgetSettings.monthly_budget_cents ?? 0) > 0 || (entries as EntryRow[]).length > 0;

  const activeTab: "overview" | "execute" | "analysis" | "optimization" | "tactical" | "goals" =
    tabParam === "execute" || tabParam === "tactical" || tabParam === "analysis" || tabParam === "goals" || tabParam === "optimization"
      ? tabParam
      : "overview";

  const lockPanelParams = new URLSearchParams();
  if (isHistoryView && monthParam) lockPanelParams.set("month", monthParam);
  lockPanelParams.set("tab", "execute");
  const lockPanelHref = `/budget?${lockPanelParams.toString()}#budget-lock-control`;

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

  const headerRight = (
    <div className="flex flex-wrap items-center gap-3">
      <BudgetHistorySelector currentMonth={monthParam} />
      <ExportBudgetCsvButton />
      <Link href="/strategy" className="dashboard-mini-btn dashboard-mini-btn-secondary text-sm">
        Strategy
      </Link>
    </div>
  );

  const overviewSection = (
    <div className="space-y-4">
      {!historyMode && <BudgetDailyControlToast />}
      {!historyMode && (
        <Suspense fallback={null}>
          <StrategyEnginePaceHint variant="budget" />
        </Suspense>
      )}
      {!historyMode && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">1. Status</p>
            <div className="flex items-center gap-2">
              <BudgetSyncStatus historyMode={historyMode} />
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${commandStatus.border} ${commandStatus.tone}`}>
                {commandStatus.title}
              </span>
            </div>
          </div>
          <RemainingBudgetHero
            budgetCents={budgetSettings.monthly_budget_cents ?? 0}
            savingsCents={budgetSettings.monthly_savings_cents ?? 0}
            expensesCents={expensesCents}
            currency={currency}
            periodLabel={periodLabel}
            budgetPeriod={budgetSettings.budget_period}
            historyMode={historyMode}
          />
          {previousPeriodRemaining != null && (
            <p className="text-sm text-[var(--text-muted)]">
              Vorige periode ({previousPeriodRemaining.label}): resterend{" "}
              <span className={previousPeriodRemaining.remainingCents < 0 ? "text-amber-400" : "font-medium text-[var(--text-primary)]"}>
                {formatCents(previousPeriodRemaining.remainingCents, currency)}
              </span>
            </p>
          )}
        </>
      )}
      {!historyMode && ENABLE_BUDGET_UX_EXPERIMENTS && (
        <section className="card-simple overflow-hidden p-0">
          <div className="px-4 pb-1 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">2. Decide & Execute</p>
          </div>
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <BudgetNextActionCard
              remainingToSpendCents={remainingToSpendCents}
              readyForActionCount={readyForAction.length}
              daysUntilNextIncome={canonicalBudgetView.daysUntilNextIncome}
              insights={financialInsights?.insights}
            />
            <div id="budget-quick-log">
              <BudgetQuickLogCard date={today} currency={currency} />
            </div>
          </div>
        </section>
      )}
      {ENABLE_BUDGET_UX_EXPERIMENTS ? null : (
        <BudgetSummaryCard
          monthlyBudgetCents={budgetSettings.monthly_budget_cents}
          monthlySavingsCents={budgetSettings.monthly_savings_cents}
          expensesCents={expensesCents}
          incomeCents={incomeCents}
          currency={currency}
          periodLabel={periodLabel}
          budgetPeriod={budgetSettings.budget_period}
          historyMode={historyMode}
        />
      )}
      {!historyMode && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">3. Monitor</p>
          <DisciplineIndexCard
            value={financeState?.disciplineScore ?? null}
            inputsReady={disciplineInputsReady}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FinancialStatusCard
              financeState={financeState}
              remainingToSpendCents={remainingToSpendCents}
              daysUntilIncomeOverride={canonicalBudgetView.daysUntilNextIncome}
              safeDailySpendOverrideCents={canonicalSafeDailySpendCents}
            />
            {ENABLE_BUDGET_UX_EXPERIMENTS ? (
              <BudgetStabilityRiskCard
                daysUnderBudget={daysUnderBudgetThisWeek}
                disciplineXp={disciplineXpThisWeek}
                insights={canonicalInsightsSorted}
                topInsightOverride={canonicalTopInsight}
              />
            ) : (
              <WeeklyPerformanceCard
                daysUnderBudget={daysUnderBudgetThisWeek}
                disciplineXp={disciplineXpThisWeek}
              />
            )}
            {ENABLE_BUDGET_UX_EXPERIMENTS ? (
              <section className="card-simple overflow-hidden p-0">
                <div className="border-b border-[var(--card-border)] px-4 py-3">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Execution focus</h2>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Keep today inside your cycle envelope with one concrete action.
                  </p>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    Use your safe daily spend as hard cap and process frozen purchases before new non-essential spend.
                  </p>
                  <Link href="/budget?tab=execute" className="text-xs font-medium text-[var(--accent-focus)] hover:underline">
                    Open execution queue →
                  </Link>
                </div>
              </section>
            ) : (
              <BudgetRiskInsightCard insights={financialInsights?.insights} />
            )}
          </div>
        </>
      )}

      {unplannedSummary.count > 0 && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-2 text-sm text-[var(--text-muted)]">
          Unplanned expenses this week: {unplannedSummary.count} ({(unplannedSummary.totalCents / 100).toFixed(2)}{" "}
          {currency})
        </div>
      )}

      {!historyMode && (
        <div className="flex justify-end">
          <a
            href="#add-entry"
            className="btn-primary inline-flex h-auto w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold sm:w-auto"
          >
            UITGAVE TOEVOEGEN
          </a>
        </div>
      )}
    </div>
  );

  const tacticalSection = (
    <section className="card-simple overflow-hidden p-0">
      <div className="space-y-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">1. Cycle Status</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <PaydayCard
            daysUntilNextIncome={financialInsights?.daysUntilNextIncome ?? 0}
            nextPaydayLabel={nextPaydayLabel}
            incomeSources={incomeSources}
            paydayDayOfMonth={paydayDayOfMonth}
            currency={currency}
            cycleStartDate={financialInsights?.cycleStartDate ?? null}
            nextPaydayDate={financialInsights?.nextPaydayDate ?? null}
            serverRowUpdatedAt={budgetSettings.row_updated_at}
          />
          <WeeklyTacticalCard
            financeState={financeState}
            safeDailySpendCents={canonicalSafeDailySpendCents}
            projectedOverspendCents={canonicalProjectedOverspendCents}
            topInsight={canonicalTopInsight}
          />
        </div>

        {ENABLE_BUDGET_BEHAVIOR_REIMAGINING && (
          <>
            <div className="border-t border-[var(--card-border)] pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">2. Allocation Plan</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PaydayPlannerCard
                monthlyBudgetCents={budgetSettings.monthly_budget_cents ?? 0}
                monthlySavingsCents={budgetSettings.monthly_savings_cents ?? 0}
                currency={currency}
              />
              <GroceryMissionPlannerCard currency={currency} />
            </div>
            <BudgetPlanCard
              targets={budgetTargets}
              spentByCategory={categoryTotals}
              currency={currency}
            />
          </>
        )}

        <div className="border-t border-[var(--card-border)] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">3. Execution Queue</p>
        </div>
        {!historyMode && (
          <BudgetLockControlCard
            lockActive={budgetControlState.lockActive}
            lockUntil={budgetControlState.lockUntil}
            lockUntilAt={budgetControlState.lockUntilAt}
            currency={currency}
          />
        )}
        <FrozenPurchaseCard activeFrozen={activeFrozen} readyForAction={readyForAction} currency={currency} goals={goals} />
        {!historyMode && !ENABLE_BUDGET_UX_EXPERIMENTS && <BudgetQuickLogCard date={today} currency={currency} />}
      </div>
    </section>
  );

  const analysisSection = (
    <div className="space-y-4">
      {!historyMode && (
        <>
          <section className="card-simple-accent overflow-hidden p-0">
            <div className="border-b border-[var(--card-border)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200">1. Detect</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Detect drift early: compare safe pace, burn rate, and current pattern signals.
              </p>
            </div>
          </section>
          {ENABLE_BUDGET_UX_EXPERIMENTS ? (
            <>
              <BudgetForecastAndReviewCard
                financeState={financeState}
                remainingToSpendCents={remainingToSpendCents}
                periodLabel={canonicalBudgetView.periodLabel}
                completedThisWeek={weeklyReviewStatus.completed}
                daysUntilNextIncome={canonicalBudgetView.daysUntilNextIncome}
                safeDailySpendCents={canonicalSafeDailySpendCents}
              />
              <BudgetInsightsAndSpendingCard
                categoryTotals={categoryTotals}
                impulseWindow={impulseWindow}
                insights={canonicalInsightsSorted}
                points={loadTrend}
                currency={currency}
              />
            </>
          ) : (
            <>
              <BudgetPerformanceSummaryCard
                financeState={financeState}
                remainingToSpendCents={remainingToSpendCents}
                periodLabel={canonicalBudgetView.periodLabel}
              />
              <BudgetWeeklyReviewCard completedThisWeek={weeklyReviewStatus.completed} />
              <BudgetCognitiveLoadTrendCard points={loadTrend} />
              <BudgetPatternDetectionCard categoryTotals={categoryTotals} impulseWindow={impulseWindow} />
            </>
          )}
          {!historyMode && financialInsights?.emergencyMode.active && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
              <strong>Let op:</strong> {financialInsights.emergencyMode.reason.join(" ")}
            </div>
          )}
        </>
      )}
      {!historyMode && ENABLE_BUDGET_BEHAVIOR_REIMAGINING && (
        <>
          <section className="card-simple-accent overflow-hidden p-0">
            <div className="border-b border-[var(--card-border)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200">2. Interpret</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Translate signals into behavioral context: archetype, triggers, and risk windows.
              </p>
            </div>
          </section>
          <ArchetypeRiskLensCard
            archetype={archetype}
            reason={archetypeReason}
            action={archetypeAction}
          />
          <ImpulseTriggerMapCard impulseWindow={impulseWindow} topCategories={topCategories} />
        </>
      )}
      {!historyMode && ENABLE_BUDGET_BEHAVIOR_REIMAGINING && (
        <>
          <section className="card-simple-accent overflow-hidden p-0">
            <div className="border-b border-[var(--card-border)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200">3. Intervene & Reflect</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Commit one action, then capture a brief reflection to improve the next cycle.
              </p>
            </div>
          </section>
          <ReflectionEngineCard />
        </>
      )}
      {historyMode && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-3 text-sm text-[var(--text-muted)]">
          History mode is read-only. Forecast and live behavior cards are hidden for archived months.
        </div>
      )}
      {!historyMode && financialInsights && financialInsights.insights.length > 0 && !ENABLE_BUDGET_UX_EXPERIMENTS && (
        <FinancialInsightsCard insights={financialInsights.insights} />
      )}
      {!ENABLE_BUDGET_UX_EXPERIMENTS && <ExpenseDistributionChart categoryTotals={categoryTotals} currency={currency} />}
      {!ENABLE_BUDGET_UX_EXPERIMENTS && <SavingsTipsCard insights={financialInsights?.insights} />}

      {alternatives.length > 0 && (
        <section className="card-simple-accent overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)]/80 px-4 py-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Suggestions</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Ideas based on your choices.</p>
          </div>
          <div className="p-4">
            <AlternativesList alternatives={alternatives} goals={goals} currency={currency} />
          </div>
        </section>
      )}

      {!historyMode && (
        <details className="card-simple overflow-hidden p-0">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
            Archief & toekomstboekingen
          </summary>
          <div className="border-t border-[var(--card-border)] px-4 py-4 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {isPaydayCycle ? "Uitgaven vorige periode" : "Uitgaven vorige maand"}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {isPaydayCycle
                  ? "Overzicht van boekingen van de vorige budgetperiode (van loon tot loon)."
                  : "Overzicht van boekingen van de vorige maand (archief)."}
              </p>
              <div className="mt-3">
                <LastMonthExpensesTrigger prevMonthEntries={prevMonthEntries} currency={currency} goals={goals} />
              </div>
            </div>
            <div className="border-t border-[var(--card-border)] pt-4">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Uitgaven volgende maand</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Toekomst: boekingen met datum in de volgende maand. Niet meegenomen in het budget van nu.
              </p>
              <div className="mt-3">
                <NextMonthExpensesTrigger nextMonthEntries={nextMonthEntries} currency={currency} goals={goals} />
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  );

  const goalsSection = (
    <section className="card-simple overflow-hidden p-0">
      <div className="space-y-4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">1. Define Goals</p>
        <section className="card-simple overflow-hidden p-0" data-tutorial="budget-goals">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Savings goals</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Track progress toward your targets. Savings are reserved from your budget (pay savings first).
          </p>
          <BudgetAchievementsCard financeState={financeState} compact />
        </div>
        <div className="p-4">
          <AddSavingsGoalForm readOnly={historyMode} />
          <div className="mt-4 space-y-4">
            {goals.length === 0 ? (
              <div
                id="savings-goals-empty"
                className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-6 text-center"
              >
                <p className="text-sm text-[var(--text-muted)]">Nog geen spaardoelen.</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Stel een doel in en volg je voortgang.</p>
                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  Voeg hierboven je eerste doel toe ↑
                </p>
              </div>
            ) : (
              goals.map((g) => (
                <SavingsGoalCard
                  key={g.id}
                  goal={g}
                  weeklyReq={weeklyRequired(g.target_cents, g.current_cents, g.deadline)}
                  currency={currency}
                  contributedThisMonthCents={contributedByGoal[g.id] ?? 0}
                />
              ))
            )}
          </div>
        </div>
        </section>

        <div className="border-t border-[var(--card-border)] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">2. Automate Base Plan</p>
        </div>
        <RecurringBudgetCard templates={recurringTemplates} currency={currency} />

        <div className="border-t border-[var(--card-border)] pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">3. Ledger Execution</p>
        </div>
        <section id="add-entry" className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Ledger</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {historyMode
              ? "History mode: alleen bekijken, geen mutaties."
              : "Log inkomsten/uitgaven en beheer entries en freezes in één werkvlak."}
          </p>
        </div>
        <div className="p-4">
          <AddBudgetEntryForm date={today} currency={currency} readOnly={historyMode} />
          <div className="mt-4 border-t border-[var(--card-border)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Entries & frozen</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {isPaydayCycle
                ? `Boekingen van deze budgetperiode (${format(new Date(periodStart + "T12:00:00Z"), "d MMM", { locale: nl })} – ${format(new Date(periodEnd + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}). Vorige periode hieronder.`
                : "Deze maand en 24u-freezes. Oudere boekingen staan in het archief voor slim budgetbeheer."}
            </p>
          </div>
          {entries.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                {isPaydayCycle && prevMonthEntries.length > 0
                  ? "Nog geen boekingen in deze periode. Je boekingen van de vorige periode staan hieronder."
                  : "Nog geen boekingen."}
              </p>
              {(!isPaydayCycle || prevMonthEntries.length === 0) && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">Log inkomsten en uitgaven om ze hier te zien.</p>
              )}
              <a
                href="#add-entry"
                className="btn-secondary mt-2 inline-block rounded-lg px-3 py-2 text-sm font-medium"
              >
                Eerste boeking toevoegen ↑
              </a>
            </div>
          ) : (
            <div className="mt-3">
              <BudgetEntryList entries={entries} currency={currency} goals={goals} readOnly={historyMode} />
            </div>
          )}
        </div>
        </section>

        {!historyMode && isPaydayCycle && (
          <details className="card-simple overflow-hidden p-0">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              Toon vorige periode
            </summary>
            <div className="border-t border-[var(--card-border)] p-4">
              <p className="text-xs text-[var(--text-muted)]">
                Boekingen van de periode vóór &quot;Vandaag loon gehad&quot; — van {format(new Date(prevPeriodRange.prevStart + "T12:00:00Z"), "d MMM", { locale: nl })} tot {format(new Date(prevPeriodRange.prevEnd + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}.
              </p>
              <div className="mt-3">
                <LastMonthExpensesTrigger prevMonthEntries={prevMonthEntries} currency={currency} goals={goals} />
              </div>
            </div>
          </details>
        )}
      </div>
    </section>
  );

  const optimizationSection = (
    <div className="space-y-4">
      {!historyMode && <BudgetPaydaySurveyCard required={budgetControlState.needsPaydaySurvey} />}
      <BudgetOptimizationCard
        lockPanelHref={lockPanelHref}
        summary={optimization.summary}
        suggestions={optimization.suggestions}
        challenges={optimization.challenges}
      />
    </div>
  );

  return (
    <BudgetSnapshotProvider>
      <main className={`relative min-h-screen overflow-hidden ${hudStyles.cinematicBackdrop}`}>
        <div className={hudStyles.spaceMist} aria-hidden />
        <div className={hudStyles.starLayerFar} aria-hidden />
        <div className={hudStyles.starLayerNear} aria-hidden />
        <div className={hudStyles.backgroundAtmosphere} aria-hidden />
        <div className={hudStyles.colorBlend} aria-hidden />
        <div className={hudStyles.spaceNoise} aria-hidden />
        <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10">
          <div className="space-y-4">
            <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
              <CornerNode corner="top-left" />
              <CornerNode corner="top-right" />
              <div className="[&>*+*]:mt-0">
                <HQPageHeader
                  title="Budget"
                  subtitle="Behavioral command center: plan, decide, and stay within your cycle."
                  backHref="/dashboard"
                />
              </div>
            </SciFiPanel>

            <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-6">
              <CornerNode corner="top-left" />
              <CornerNode corner="top-right" />
              <div className="dashboard-bento">
                <BudgetTabsShell
                  key={`${monthParam ?? "live"}-${tabParam ?? "overview"}`}
                  initialTab={activeTab}
                  isHistoryView={isHistoryView}
                  historyMode={historyMode}
                  lockActive={budgetControlState.lockActive}
                  lockUntil={budgetControlState.lockUntil}
                  lockUntilAt={budgetControlState.lockUntilAt}
                  lockPanelHref={lockPanelHref}
                  headerRight={headerRight}
                  overview={
                    <BudgetOverviewLockGate
                      lockPanelHref={lockPanelHref}
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
                />
              </div>
            </SciFiPanel>

            {!isHistoryView && (
              <section className="mascot-hero-inner mx-auto" aria-hidden>
                <HeroMascotImage page="budget" className="mascot-img" />
              </section>
            )}
          </div>
        </div>
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


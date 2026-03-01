import dynamic from "next/dynamic";
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
  copyOldBudgetEntriesToArchive,
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
import { getBudgetDisciplineXpThisWeek } from "@/app/actions/budget-discipline";
import { getImpulseTimeWindow } from "@/app/actions/budget-impulse-pattern";
import { formatMonthYearShort } from "@/lib/utils/date-locale";
import { formatCents } from "@/lib/utils/currency";
import { getBudgetToday, getBudgetAdjacentMonths, getPreviousPeriodBounds } from "@/lib/utils/budget-date";
import { getSafeDaysThisWeek, getBudgetLoadTrend } from "@/lib/dcic/finance-engine";
import { DisciplineIndexCard } from "@/components/budget/DisciplineIndexCard";
import { BudgetRiskInsightCard } from "@/components/budget/BudgetRiskInsightCard";
import { WeeklyPerformanceCard } from "@/components/budget/WeeklyPerformanceCard";
import { DailyControlMissionsCard } from "@/components/budget/DailyControlMissionsCard";
import { BudgetQuickLogCard } from "@/components/budget/BudgetQuickLogCard";
import { BudgetPerformanceSummaryCard } from "@/components/budget/BudgetPerformanceSummaryCard";
import { BudgetPatternDetectionCard } from "@/components/budget/BudgetPatternDetectionCard";
import { RemainingBudgetHero } from "@/components/budget/RemainingBudgetHero";
import { BudgetTabsShell } from "@/components/budget/BudgetTabsShell";

const BudgetHistorySelector = dynamic(() => import("@/components/BudgetHistorySelector").then((m) => ({ default: m.BudgetHistorySelector })), { loading: () => null });
const ExportBudgetCsvButton = dynamic(() => import("@/components/ExportBudgetCsvButton").then((m) => ({ default: m.ExportBudgetCsvButton })), { loading: () => null });
const BudgetSummaryCard = dynamic(() => import("@/components/BudgetSummaryCard").then((m) => ({ default: m.BudgetSummaryCard })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const FinancialStatusCard = dynamic(() => import("@/components/dcic/FinancialStatusCard").then((m) => ({ default: m.FinancialStatusCard })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const WeeklyTacticalCard = dynamic(() => import("@/components/dcic/WeeklyTacticalCard").then((m) => ({ default: m.WeeklyTacticalCard })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const PaydayCard = dynamic(() => import("@/components/budget/PaydayCard").then((m) => ({ default: m.PaydayCard })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const FinancialInsightsCard = dynamic(() => import("@/components/dcic/FinancialInsightsCard").then((m) => ({ default: m.FinancialInsightsCard })), { loading: () => null });
const ExpenseDistributionChart = dynamic(() => import("@/components/budget/ExpenseDistributionChart").then((m) => ({ default: m.ExpenseDistributionChart })), { loading: () => <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const BudgetPlanCard = dynamic(() => import("@/components/budget/BudgetPlanCard").then((m) => ({ default: m.BudgetPlanCard })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const SavingsTipsCard = dynamic(() => import("@/components/budget/SavingsTipsCard").then((m) => ({ default: m.SavingsTipsCard })), { loading: () => null });
const FrozenPurchaseCard = dynamic(() => import("@/components/FrozenPurchaseCard").then((m) => ({ default: m.FrozenPurchaseCard })), { loading: () => null });
const SavingsGoalCard = dynamic(() => import("@/components/SavingsGoalCard").then((m) => ({ default: m.SavingsGoalCard })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const AddSavingsGoalForm = dynamic(() => import("@/components/AddSavingsGoalForm").then((m) => ({ default: m.AddSavingsGoalForm })), { loading: () => null });
const RecurringBudgetCard = dynamic(() => import("@/components/RecurringBudgetCard").then((m) => ({ default: m.RecurringBudgetCard })), { loading: () => null });
const AddBudgetEntryForm = dynamic(() => import("@/components/AddBudgetEntryForm").then((m) => ({ default: m.AddBudgetEntryForm })), { loading: () => <div className="min-h-[140px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const BudgetEntryList = dynamic(() => import("@/components/BudgetEntryList").then((m) => ({ default: m.BudgetEntryList })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const NextMonthExpensesTrigger = dynamic(() => import("@/components/budget/NextMonthExpensesTrigger").then((m) => ({ default: m.NextMonthExpensesTrigger })), { loading: () => null });
const LastMonthExpensesTrigger = dynamic(() => import("@/components/budget/LastMonthExpensesTrigger").then((m) => ({ default: m.LastMonthExpensesTrigger })), { loading: () => null });
const AlternativesList = dynamic(() => import("@/components/AlternativesList").then((m) => ({ default: m.AlternativesList })), { loading: () => null });
const BudgetWeeklyReviewCard = dynamic(
  () => import("@/components/budget/BudgetWeeklyReviewCard").then((m) => ({ default: m.BudgetWeeklyReviewCard })),
  { loading: () => null }
);
const CategorySpendingCard = dynamic(
  () => import("@/components/budget/CategorySpendingCard").then((m) => ({ default: m.CategorySpendingCard })),
  { loading: () => null }
);
const BudgetCognitiveLoadTrendCard = dynamic(
  () => import("@/components/budget/BudgetCognitiveLoadTrendCard").then((m) => ({ default: m.BudgetCognitiveLoadTrendCard })),
  { loading: () => null }
);
const BudgetAchievementsCard = dynamic(
  () => import("@/components/budget/BudgetAchievementsCard").then((m) => ({ default: m.BudgetAchievementsCard })),
  { loading: () => null }
);

type Props = { searchParams: Promise<{ month?: string; tab?: string }> };

export default async function BudgetPage({ searchParams }: Props) {
  const today = getBudgetToday();
  const params = await searchParams;
  const monthParam = params.month;
   const tabParam = params.tab;
  const isHistoryView = !!monthParam && /^\d{4}-\d{2}$/.test(monthParam);
  const [year, month] = isHistoryView ? monthParam!.split("-").map(Number) : [0, 0];

  try { await generateRecurringEntries(); } catch { /* table may not exist yet */ }
  const periodBounds = await getBudgetPeriodBounds();
  const { periodStart, periodEnd, isPaydayCycle } = periodBounds;
  const { nextMonthStart, nextMonthEnd, prevMonthStart, prevMonthEnd } = getBudgetAdjacentMonths();
  try { await copyOldBudgetEntriesToArchive(periodStart); } catch { /* archive table may not exist yet */ }
  const [goals, entries, nextMonthEntries, prevMonthEntries, alternatives, budgetSettings, currentMonthExpenses, currentMonthIncome, currentWeekExpenses, currentWeekIncome, activeFrozen, readyForAction, unplannedSummary, contributions, recurringTemplates, financeState, financialInsights, incomeSources, budgetTargets, paydayDayOfMonth, weeklyReviewStatus, disciplineXpThisWeek, impulseWindow] = await Promise.all([
    getSavingsGoals(),
    getBudgetEntries(periodStart, periodEnd),
    getBudgetEntries(nextMonthStart, nextMonthEnd),
    getBudgetEntries(prevMonthStart, prevMonthEnd),
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
    getPaydayDayOfMonth(),
    getBudgetWeeklyReviewStatus(),
    getBudgetDisciplineXpThisWeek(),
    getImpulseTimeWindow(),
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

  const activeTab: "overview" | "tactical" | "analysis" | "goals" =
    tabParam === "tactical" || tabParam === "analysis" || tabParam === "goals"
      ? tabParam
      : "overview";

  let expensesCents = currentMonthExpenses;
  let incomeCents = currentMonthIncome;
  let periodLabel = "this month";
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
      ? (budgetSettings.monthly_budget_cents ?? 0) -
        (budgetSettings.monthly_savings_cents ?? 0) -
        expensesCents
      : null;

  let previousPeriodRemaining: { prevStart: string; prevEnd: string; remainingCents: number; label: string } | null = null;
  if (!historyMode && isPaydayCycle && periodStart) {
    const paydayDay = paydayDayOfMonth ?? 25;
    const prev = getPreviousPeriodBounds(periodStart, paydayDay);
    const prevEntries = await getBudgetEntries(prev.prevStart, prev.prevEnd) as EntryRow[];
    const prevExpensesCents = prevEntries
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
    !historyMode && isWeekly && financeState ? getSafeDaysThisWeek(financeState) : null;
  const loadTrend = !historyMode && financeState ? getBudgetLoadTrend(financeState) : [];

  const headerRight = (
    <div className="flex flex-wrap items-center gap-3">
      <BudgetHistorySelector currentMonth={monthParam} />
      <ExportBudgetCsvButton />
      <Link href="/strategy" className="text-sm font-medium text-[var(--accent-focus)] hover:underline">
        Strategy →
      </Link>
    </div>
  );

  const overviewSection = (
    <div className="space-y-4">
      {!historyMode && (
        <>
          <RemainingBudgetHero
            budgetCents={budgetSettings.monthly_budget_cents ?? 0}
            savingsCents={budgetSettings.monthly_savings_cents ?? 0}
            expensesCents={expensesCents}
            currency={currency}
            periodLabel={periodLabel}
            budgetPeriod={budgetSettings.budget_period}
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

      {!historyMode && (
        <>
          <DisciplineIndexCard value={financeState?.disciplineScore ?? null} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FinancialStatusCard financeState={financeState} remainingToSpendCents={remainingToSpendCents} />
            <WeeklyPerformanceCard
              daysUnderBudget={daysUnderBudgetThisWeek}
              disciplineXp={disciplineXpThisWeek}
            />
            <BudgetRiskInsightCard insights={financialInsights?.insights} />
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
            className="btn-primary inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold sm:w-auto"
          >
            ADD EXPENSE
          </a>
        </div>
      )}
    </div>
  );

  const tacticalSection = (
    <div className="space-y-4">
      <DailyControlMissionsCard />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WeeklyTacticalCard financeState={financeState} />
        <PaydayCard
          daysUntilNextIncome={financialInsights?.daysUntilNextIncome ?? 0}
          nextPaydayLabel={nextPaydayLabel}
          incomeSources={incomeSources}
          paydayDayOfMonth={paydayDayOfMonth}
          currency={currency}
          cycleStartDate={financialInsights?.cycleStartDate ?? null}
          nextPaydayDate={financialInsights?.nextPaydayDate ?? null}
        />
        <FrozenPurchaseCard activeFrozen={activeFrozen} readyForAction={readyForAction} currency={currency} goals={goals} />
      </div>
      <CategorySpendingCard categoryTotals={categoryTotals} targets={budgetTargets} currency={currency} />
      <BudgetQuickLogCard date={today} currency={currency} />
    </div>
  );

  const analysisSection = (
    <div className="space-y-4">
      <BudgetPerformanceSummaryCard
        financeState={financeState}
        remainingToSpendCents={remainingToSpendCents}
        periodLabel={periodLabel}
      />
      <BudgetWeeklyReviewCard completedThisWeek={weeklyReviewStatus.completed} />
      <BudgetCognitiveLoadTrendCard points={loadTrend} />
      <BudgetPatternDetectionCard categoryTotals={categoryTotals} impulseWindow={impulseWindow} />

      {!historyMode && financialInsights && financialInsights.insights.length > 0 && (
        <FinancialInsightsCard insights={financialInsights.insights} />
      )}
      {!historyMode && financialInsights?.emergencyMode.active && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <strong>Let op:</strong> {financialInsights.emergencyMode.reason.join(" ")}
        </div>
      )}
      <ExpenseDistributionChart categoryTotals={categoryTotals} currency={currency} />
      <BudgetPlanCard
        targets={budgetTargets}
        spentByCategory={categoryTotals}
        currency={currency}
      />
      <SavingsTipsCard insights={financialInsights?.insights} />

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
        <>
          <section className="card-simple overflow-hidden p-0 border-[var(--card-border)]">
            <div className="border-b border-[var(--card-border)] px-4 py-3">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Uitgaven vorige maand</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Overzicht van boekingen van de vorige maand (archief).
              </p>
            </div>
            <div className="p-4">
              <LastMonthExpensesTrigger prevMonthEntries={prevMonthEntries} currency={currency} goals={goals} />
            </div>
          </section>
          <section className="card-simple overflow-hidden p-0 border-[var(--accent-neutral)]/60">
            <div className="border-b border-[var(--card-border)] px-4 py-3">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Uitgaven volgende maand</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Toekomst: boekingen met datum in de volgende maand. Niet meegenomen in het budget van nu.
              </p>
            </div>
            <div className="p-4">
              <NextMonthExpensesTrigger nextMonthEntries={nextMonthEntries} currency={currency} goals={goals} />
            </div>
          </section>
        </>
      )}
    </div>
  );

  const goalsSection = (
    <div className="space-y-4">
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Savings goals</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Track progress toward your targets. Savings are reserved from your budget (pay savings first).
          </p>
        </div>
        <div className="p-4">
          <AddSavingsGoalForm />
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

      <BudgetAchievementsCard financeState={financeState} />

      <RecurringBudgetCard templates={recurringTemplates} currency={currency} />

      <section id="add-entry" className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Add entry</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Log income or expenses.</p>
        </div>
        <div className="p-4">
          <AddBudgetEntryForm date={today} currency={currency} />
        </div>
      </section>

      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Entries & frozen</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Deze maand en 24u-freezes. Oudere boekingen staan in het archief voor slim budgetbeheer.
          </p>
        </div>
        <div className="p-4">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-6 text-center">
              <p className="text-sm text-[var(--text-muted)]">Nog geen boekingen.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Log inkomsten en uitgaven om ze hier te zien.</p>
              <a
                href="#add-entry"
                className="mt-2 inline-block rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--accent-focus)]/30"
              >
                Eerste boeking toevoegen ↑
              </a>
            </div>
          ) : (
            <BudgetEntryList entries={entries} currency={currency} goals={goals} />
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div className="space-y-6">
      <HQPageHeader
        title="Budget"
        subtitle="Financial command center for your month."
        backHref="/dashboard"
      />

      {!isHistoryView && (
        <section className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="budget" className="mascot-img" />
        </section>
      )}

      <BudgetTabsShell
        initialTab={activeTab}
        isHistoryView={isHistoryView}
        historyMode={historyMode}
        headerRight={headerRight}
        overview={overviewSection}
        tactical={tacticalSection}
        analysis={analysisSection}
        goals={goalsSection}
      />
    </div>
  );
}

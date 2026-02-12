import Link from "next/link";
import { getSavingsGoals, getSavingsContributions } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";
import {
  getBudgetEntries,
  getBudgetSettings,
  getCurrentMonthExpensesCents,
  getCurrentMonthIncomeCents,
  getCurrentWeekExpensesCents,
  getCurrentWeekIncomeCents,
  getFrozenEntries,
  getFrozenEntriesReadyForAction,
  getMonthExpensesCents,
  getMonthIncomeCents,
  getRecurringTemplates,
  generateRecurringEntries,
  getUnplannedWeeklySummary,
} from "@/app/actions/budget";
import { getAlternatives } from "@/app/actions/alternatives";
import { SavingsGoalCard } from "@/components/SavingsGoalCard";
import { BudgetEntryList } from "@/components/BudgetEntryList";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import { AddSavingsGoalForm } from "@/components/AddSavingsGoalForm";
import { AlternativesList } from "@/components/AlternativesList";
import { BudgetSummaryCard } from "@/components/BudgetSummaryCard";
import { FrozenPurchaseCard } from "@/components/FrozenPurchaseCard";
import { BudgetHistorySelector } from "@/components/BudgetHistorySelector";
import { ExportBudgetCsvButton } from "@/components/ExportBudgetCsvButton";
import { RecurringBudgetCard } from "@/components/RecurringBudgetCard";

type Props = { searchParams: Promise<{ month?: string }> };

export default async function BudgetPage({ searchParams }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const params = await searchParams;
  const monthParam = params.month;
  const isHistoryView = !!monthParam && /^\d{4}-\d{2}$/.test(monthParam);
  const [year, month] = isHistoryView ? monthParam!.split("-").map(Number) : [0, 0];

  try { await generateRecurringEntries(); } catch { /* table may not exist yet */ }
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const [goals, entries, alternatives, budgetSettings, currentMonthExpenses, currentMonthIncome, currentWeekExpenses, currentWeekIncome, activeFrozen, readyForAction, unplannedSummary, contributions, recurringTemplates] = await Promise.all([
    getSavingsGoals(),
    getBudgetEntries(),
    getAlternatives(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getCurrentMonthIncomeCents(),
    getCurrentWeekExpensesCents(),
    getCurrentWeekIncomeCents(),
    getFrozenEntries(),
    getFrozenEntriesReadyForAction(),
    getUnplannedWeeklySummary(),
    getSavingsContributions({ fromDate: monthStart, toDate: monthEnd }),
    getRecurringTemplates(),
  ]);
  const contributedByGoal = (contributions as { goal_id: string; amount_cents: number }[]).reduce((acc, c) => {
    acc[c.goal_id] = (acc[c.goal_id] || 0) + c.amount_cents;
    return acc;
  }, {} as Record<string, number>);
  const currency = budgetSettings.currency ?? "EUR";
  const isWeekly = budgetSettings.budget_period === "weekly";

  let expensesCents = currentMonthExpenses;
  let incomeCents = currentMonthIncome;
  let periodLabel = "this month";
  let historyMode = false;
  if (isHistoryView) {
    expensesCents = await getMonthExpensesCents(year, month);
    incomeCents = await getMonthIncomeCents(year, month);
    const d = new Date(year, month - 1, 1);
    periodLabel = d.toLocaleString("default", { month: "short", year: "numeric" });
    historyMode = true;
  } else if (isWeekly) {
    expensesCents = currentWeekExpenses;
    incomeCents = currentWeekIncome;
    periodLabel = "this week";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Budget</h1>
          <p className="mt-1 text-sm text-neuro-muted">Savings goals, entries, and spending awareness.</p>
        </div>
        <div className="flex items-center gap-3">
          <BudgetHistorySelector currentMonth={monthParam} />
          <ExportBudgetCsvButton />
          <Link href="/strategy" className="text-sm font-medium text-neuro-blue hover:underline">Strategy →</Link>
        </div>
      </div>

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

      {unplannedSummary.count > 0 && (
        <div className="rounded-lg border border-neuro-border bg-neuro-dark/40 px-4 py-2 text-sm text-neuro-muted">
          Unplanned expenses this week: {unplannedSummary.count} ({(unplannedSummary.totalCents / 100).toFixed(2)} {currency})
        </div>
      )}

      <FrozenPurchaseCard activeFrozen={activeFrozen} readyForAction={readyForAction} currency={currency} goals={goals} />

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Savings goals</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Track progress toward your targets. Savings are reserved from your budget (pay savings first).</p>
        </div>
        <div className="p-4">
          <AddSavingsGoalForm />
          <div className="mt-4 space-y-4">
            {goals.length === 0 ? (
              <div id="savings-goals-empty" className="rounded-xl border border-dashed border-neuro-border bg-neuro-dark/40 px-4 py-6 text-center">
                <p className="text-sm text-neuro-muted">No savings goals yet.</p>
                <p className="mt-1 text-xs text-neuro-muted">Set a target and track progress.</p>
                <p className="mt-2 text-sm font-medium text-neuro-silver">Add your first goal above ↑</p>
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

      <RecurringBudgetCard templates={recurringTemplates} currency={currency} />

      <section id="add-entry" className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Add entry</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Log income or expenses.</p>
        </div>
        <div className="p-4">
          <AddBudgetEntryForm date={today} currency={currency} />
        </div>
      </section>

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Entries & frozen</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Recent activity and 24h freezes.</p>
        </div>
        <div className="p-4">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neuro-border bg-neuro-dark/40 px-4 py-6 text-center">
              <p className="text-sm text-neuro-muted">No entries yet.</p>
              <p className="mt-1 text-xs text-neuro-muted">Log income and expenses to see them here.</p>
              <a href="#add-entry" className="mt-2 inline-block text-sm font-medium text-neuro-blue hover:underline">Log your first entry ↑</a>
            </div>
          ) : (
            <BudgetEntryList entries={entries} currency={currency} goals={goals} />
          )}
        </div>
      </section>

      {alternatives.length > 0 && (
        <section className="card-modern-accent overflow-hidden p-0">
          <div className="border-b border-neuro-border/80 px-4 py-3">
            <h2 className="text-base font-semibold text-neuro-silver">Suggestions</h2>
            <p className="mt-0.5 text-xs text-neuro-muted">Ideas based on your choices.</p>
          </div>
          <div className="p-4">
            <AlternativesList alternatives={alternatives} goals={goals} currency={currency} />
          </div>
        </section>
      )}
    </div>
  );
}

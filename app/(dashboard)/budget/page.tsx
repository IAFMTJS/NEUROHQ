import { getSavingsGoals } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";
import {
  getBudgetEntries,
  getBudgetSettings,
  getCurrentMonthExpensesCents,
  getFrozenEntries,
  getFrozenEntriesReadyForAction,
} from "@/app/actions/budget";
import { getAlternatives } from "@/app/actions/alternatives";
import { SavingsGoalCard } from "@/components/SavingsGoalCard";
import { BudgetEntryList } from "@/components/BudgetEntryList";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import { AddSavingsGoalForm } from "@/components/AddSavingsGoalForm";
import { AlternativesList } from "@/components/AlternativesList";
import { BudgetSummaryCard } from "@/components/BudgetSummaryCard";
import { FrozenPurchaseCard } from "@/components/FrozenPurchaseCard";

export default async function BudgetPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [goals, entries, alternatives, budgetSettings, currentMonthExpenses, activeFrozen, readyForAction] = await Promise.all([
    getSavingsGoals(),
    getBudgetEntries(),
    getAlternatives(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
    getFrozenEntries(),
    getFrozenEntriesReadyForAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Budget</h1>
        <p className="mt-1 text-sm text-neuro-muted">Savings goals, entries, and spending awareness.</p>
      </div>

      <BudgetSummaryCard
        monthlyBudgetCents={budgetSettings.monthly_budget_cents}
        monthlySavingsCents={budgetSettings.monthly_savings_cents}
        currentMonthExpensesCents={currentMonthExpenses}
      />

      <FrozenPurchaseCard activeFrozen={activeFrozen} readyForAction={readyForAction} />

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Savings goals</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Track progress toward your targets.</p>
        </div>
        <div className="p-4">
          <AddSavingsGoalForm />
          <div className="mt-4 space-y-4">
            {goals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neuro-border bg-neuro-dark/40 px-4 py-6 text-center">
                <p className="text-sm text-neuro-muted">No savings goals yet.</p>
                <p className="mt-1 text-xs text-neuro-muted">Add one above to get started.</p>
              </div>
            ) : (
              goals.map((g) => (
                <SavingsGoalCard
                  key={g.id}
                  goal={g}
                  weeklyReq={weeklyRequired(g.target_cents, g.current_cents, g.deadline)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Add entry</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Log income or expenses.</p>
        </div>
        <div className="p-4">
          <AddBudgetEntryForm date={today} />
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
              <p className="mt-1 text-xs text-neuro-muted">Add one above to get started.</p>
            </div>
          ) : (
            <BudgetEntryList entries={entries} />
          )}
        </div>
      </section>

      {alternatives.length > 0 && (
        <section className="card-modern-accent overflow-hidden p-0">
          <div className="border-b border-neuro-border/80 px-4 py-3">
            <h2 className="text-base font-semibold text-neuro-silver">Suggestions</h2>
            <p className="mt-0.5 text-xs text-neuro-muted">Alternatives based on your spending.</p>
          </div>
          <div className="p-4">
            <AlternativesList alternatives={alternatives} />
          </div>
        </section>
      )}
    </div>
  );
}

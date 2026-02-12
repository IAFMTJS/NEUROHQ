import { getSavingsGoals } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";
import { getBudgetEntries } from "@/app/actions/budget";
import { getAlternatives } from "@/app/actions/alternatives";
import { SavingsGoalCard } from "@/components/SavingsGoalCard";
import { BudgetEntryList } from "@/components/BudgetEntryList";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import { AddSavingsGoalForm } from "@/components/AddSavingsGoalForm";
import { AlternativesList } from "@/components/AlternativesList";

export default async function BudgetPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [goals, entries, alternatives] = await Promise.all([
    getSavingsGoals(),
    getBudgetEntries(),
    getAlternatives(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neuro-silver">Budget</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neuro-silver">Savings goals</h2>
        <AddSavingsGoalForm />
        <div className="mt-4 space-y-4">
          {goals.length === 0 ? (
            <p className="text-sm text-neutral-500">No savings goals yet. Add one above.</p>
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
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neuro-silver">Add entry</h2>
        <AddBudgetEntryForm date={today} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-neuro-silver">Entries & frozen</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-neutral-500">No entries yet. Add one above to get started.</p>
        ) : (
          <BudgetEntryList entries={entries} />
        )}
      </section>

      {alternatives.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-neuro-silver">Suggestions</h2>
          <AlternativesList alternatives={alternatives} />
        </section>
      )}
    </div>
  );
}

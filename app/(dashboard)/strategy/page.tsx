import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getCurrentQuarter } from "@/lib/utils/strategy";
import { getSavingsGoals } from "@/app/actions/savings";
import { StrategyForm } from "@/components/StrategyForm";

export default async function StrategyPage() {
  const [strategy, goals] = await Promise.all([getQuarterlyStrategy(), getSavingsGoals()]);
  const { year, quarter } = getCurrentQuarter();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-neuro-silver">Quarterly strategy</h1>
      <p className="text-sm text-neutral-400">
        Q{quarter} {year}
      </p>
      <StrategyForm
        initial={strategy}
        goals={goals.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}

import Link from "next/link";
import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getCurrentQuarter } from "@/lib/utils/strategy";
import { getSavingsGoals } from "@/app/actions/savings";
import { StrategyForm } from "@/components/StrategyForm";
import { StrategyIntro } from "@/components/StrategyIntro";
import { StrategySummaryCard } from "@/components/StrategySummaryCard";

export default async function StrategyPage() {
  const [strategy, goals] = await Promise.all([getQuarterlyStrategy(), getSavingsGoals()]);
  const { year, quarter } = getCurrentQuarter();
  const goalList = goals.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Quarterly strategy</h1>
        <p className="mt-1 text-sm text-neuro-muted">
          Q{quarter} {year} — theme, identity, key results, and linked goals.
        </p>
        <div className="mt-4 rounded-xl border border-neuro-border bg-neuro-surface/50 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neuro-muted">Quick links</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/report"
              className="inline-flex items-center rounded-lg border border-neuro-border bg-neuro-dark px-4 py-2 text-sm font-medium text-neuro-silver hover:border-neuro-blue hover:text-neuro-blue"
            >
              Reality report →
            </Link>
            <Link
              href="/budget"
              className="inline-flex items-center rounded-lg border border-neuro-border bg-neuro-dark px-4 py-2 text-sm font-medium text-neuro-silver hover:border-neuro-blue hover:text-neuro-blue"
            >
              Budget & goals →
            </Link>
          </div>
        </div>
      </div>
      <StrategyIntro />
      <StrategySummaryCard
        strategy={strategy}
        goals={goalList}
        year={year}
        quarter={quarter}
      />
      <StrategyForm initial={strategy} goals={goalList} />
    </div>
  );
}

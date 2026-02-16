import Link from "next/link";
import { getQuarterlyStrategy, getPastQuarterlyStrategies } from "@/app/actions/strategy";
import { getCurrentQuarter, getNextQuarter, getPreviousQuarter } from "@/lib/utils/strategy";
import { getSavingsGoals } from "@/app/actions/savings";
import { StrategyForm } from "@/components/StrategyForm";
import { StrategyIntro } from "@/components/StrategyIntro";
import { StrategySummaryCard } from "@/components/StrategySummaryCard";
import { StrategyExportButton } from "@/components/StrategyExportButton";
import { StrategyCopyFromLast } from "@/components/StrategyCopyFromLast";
import { StrategyPastQuarters } from "@/components/StrategyPastQuarters";

export default async function StrategyPage() {
  const { year, quarter } = getCurrentQuarter();
  const next = getNextQuarter();
  const [strategy, goals, nextQuarterStrategy, prevQuarterStrategy, past] = await Promise.all([
    getQuarterlyStrategy(),
    getSavingsGoals(),
    getQuarterlyStrategy(next),
    getQuarterlyStrategy(getPreviousQuarter()),
    getPastQuarterlyStrategies(6),
  ]);
  const goalList = goals.map((g) => ({
    id: g.id,
    name: g.name,
    current_cents: (g as { current_cents?: number }).current_cents,
    target_cents: (g as { target_cents?: number }).target_cents,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Quarterly strategy</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Q{quarter} {year} — theme, identity, key results, anti-goals, and linked goals.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Quick links</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/report"
                className="inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
              >
                Reality report →
              </Link>
              <Link
                href="/budget"
                className="inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
              >
                Budget & goals →
              </Link>
            </div>
          </div>
          <StrategyCopyFromLast hasLastQuarter={!!prevQuarterStrategy} />
          <StrategyExportButton />
        </div>
        {nextQuarterStrategy == null && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Next quarter (Q{next.quarter} {next.year}) starts soon. You can draft your strategy then or copy from this quarter.
          </p>
        )}
      </div>
      <StrategyIntro />
      <StrategySummaryCard
        strategy={strategy}
        goals={goalList}
        year={year}
        quarter={quarter}
      />
      <StrategyForm initial={strategy} goals={goalList} />
      <StrategyPastQuarters past={past} />
    </div>
  );
}

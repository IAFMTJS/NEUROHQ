import Link from "next/link";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
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
      <HQPageHeader
        title="Quarterly strategy"
        subtitle={`Q${quarter} ${year} — theme, identity, key results, anti-goals, and linked goals.`}
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top" data-mascot-page="strategy" aria-hidden>
        <img src={getMascotSrcForPage("strategy")} alt="" className="mascot-img" />
      </section>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="glass-card rounded-xl px-4 py-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Quick links</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/report"
                className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] transition-all duration-200"
              >
                Reality report →
              </Link>
              <Link
                href="/budget"
                className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] transition-all duration-200"
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

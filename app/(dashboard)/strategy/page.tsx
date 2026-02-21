import dynamic from "next/dynamic";
import Link from "next/link";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import { getQuarterlyStrategy, getPastQuarterlyStrategies, getStrategyCompletion } from "@/app/actions/strategy";
import { getCurrentQuarter, getNextQuarter, getPreviousQuarter } from "@/lib/utils/strategy";
import { getSavingsGoals } from "@/app/actions/savings";

const StrategyForm = dynamic(() => import("@/components/StrategyForm").then((m) => ({ default: m.StrategyForm })), { loading: () => <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const StrategyIntro = dynamic(() => import("@/components/StrategyIntro").then((m) => ({ default: m.StrategyIntro })), { loading: () => null });
const StrategySummaryCard = dynamic(() => import("@/components/StrategySummaryCard").then((m) => ({ default: m.StrategySummaryCard })), { loading: () => <div className="glass-card min-h-[140px] animate-pulse rounded-[22px]" aria-hidden /> });
const StrategyExportButton = dynamic(() => import("@/components/StrategyExportButton").then((m) => ({ default: m.StrategyExportButton })), { loading: () => null });
const StrategyCopyFromLast = dynamic(() => import("@/components/StrategyCopyFromLast").then((m) => ({ default: m.StrategyCopyFromLast })), { loading: () => null });
const StrategyPastQuarters = dynamic(() => import("@/components/StrategyPastQuarters").then((m) => ({ default: m.StrategyPastQuarters })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const StrategyProgressCard = dynamic(() => import("@/components/strategy/StrategyProgressCard").then((m) => ({ default: m.StrategyProgressCard })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const StrategyTipsCard = dynamic(() => import("@/components/strategy/StrategyTipsCard").then((m) => ({ default: m.StrategyTipsCard })), { loading: () => null });
const StrategyCheckInButton = dynamic(() => import("@/components/strategy/StrategyCheckInButton").then((m) => ({ default: m.StrategyCheckInButton })), { loading: () => null });
const StrategyFocusBlock = dynamic(() => import("@/components/strategy/StrategyFocusBlock").then((m) => ({ default: m.StrategyFocusBlock })), { loading: () => null });
const StrategyKeyResultsChecklist = dynamic(() => import("@/components/strategy/StrategyKeyResultsChecklist").then((m) => ({ default: m.StrategyKeyResultsChecklist })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const StrategySuccessActions = dynamic(() => import("@/components/strategy/StrategySuccessActions").then((m) => ({ default: m.StrategySuccessActions })), { loading: () => null });

export default async function StrategyPage() {
  const { year, quarter } = getCurrentQuarter();
  const next = getNextQuarter();
  const [strategy, goals, nextQuarterStrategy, prevQuarterStrategy, past, completion] = await Promise.all([
    getQuarterlyStrategy(),
    getSavingsGoals(),
    getQuarterlyStrategy(next),
    getQuarterlyStrategy(getPreviousQuarter()),
    getPastQuarterlyStrategies(6),
    getStrategyCompletion(),
  ]);
  const goalList = goals.map((g) => ({
    id: g.id,
    name: g.name,
    current_cents: (g as { current_cents?: number }).current_cents,
    target_cents: (g as { target_cents?: number }).target_cents,
  }));

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="Quarterly strategy"
        subtitle={`Q${quarter} ${year} — theme, identity, key results, anti-goals, and linked goals.`}
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top" data-mascot-page="strategy" aria-hidden>
        <img src={getMascotSrcForPage("strategy")} alt="" className="mascot-img" />
      </section>
      <div className="-mt-2 flex flex-wrap items-center justify-end gap-3">
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
        <Link
          href="/learning"
          className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)] transition-all duration-200"
        >
          Growth →
        </Link>
        <StrategyCopyFromLast hasLastQuarter={!!prevQuarterStrategy} />
        <StrategyExportButton />
      </div>
      {nextQuarterStrategy == null && (
        <p className="text-xs text-[var(--text-muted)]">
          Next quarter (Q{next.quarter} {next.year}) starts soon. You can draft your strategy then or copy from this quarter.
        </p>
      )}
      <StrategyIntro />
      <StrategyProgressCard
        completed={completion.completed}
        total={completion.total}
        percent={completion.percent}
        items={completion.items}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/30 px-4 py-3">
        <p className="text-sm text-[var(--text-muted)]">
          Heb je je voortgang bekeken? Doe je check-in zodat de melding op het dashboard verdwijnt.
        </p>
        <StrategyCheckInButton />
      </div>
      <StrategyFocusBlock
        focusText={strategy?.key_results ? (strategy.key_results as string).trim().split(/\n/).map((s) => s.trim()).filter(Boolean)[0] ?? null : null}
        identityStatement={strategy?.identity_statement ?? null}
      />
      <StrategyKeyResultsChecklist
        keyResultsText={strategy?.key_results ?? null}
        krChecked={Array.isArray((strategy as { kr_checked?: boolean[] })?.kr_checked) ? (strategy as { kr_checked: boolean[] }).kr_checked : []}
      />
      <StrategySummaryCard
        strategy={strategy}
        goals={goalList}
        year={year}
        quarter={quarter}
      />
      <StrategySuccessActions />
      <StrategyTipsCard />
      <StrategyForm initial={strategy} goals={goalList} />
      <StrategyPastQuarters past={past} />
    </div>
  );
}

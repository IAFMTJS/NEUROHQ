import dynamic from "next/dynamic";
import Link from "next/link";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import {
  getActiveStrategyFocus,
  getPastStrategyFocus,
  getPressureIndex,
  getAlignmentThisWeek,
  getAlignmentLog,
  getMomentumByDomain,
  getDriftAlert,
  getStrategyReviewStatus,
  computeAndUpsertAlignment,
} from "@/app/actions/strategyFocus";
import { StrategyThesisHero } from "@/components/strategy/StrategyThesisHero";
import { StrategyFocusMultipliers } from "@/components/strategy/StrategyFocusMultipliers";
import { StrategyPhaseIndicator } from "@/components/strategy/StrategyPhaseIndicator";
import { StrategyArchiveHistory } from "@/components/strategy/StrategyArchiveHistory";

const StrategyThesisForm = dynamic(
  () => import("@/components/strategy/StrategyThesisForm").then((m) => ({ default: m.StrategyThesisForm })),
  { loading: () => <div className="min-h-[320px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyAllocationSliders = dynamic(
  () =>
    import("@/components/strategy/StrategyAllocationSliders").then((m) => ({
      default: m.StrategyAllocationSliders,
    })),
  { loading: () => <div className="min-h-[180px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyAlignmentGraph = dynamic(
  () =>
    import("@/components/strategy/StrategyAlignmentGraph").then((m) => ({
      default: m.StrategyAlignmentGraph,
    })),
  { loading: () => <div className="min-h-[280px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyMomentumPerDomain = dynamic(
  () =>
    import("@/components/strategy/StrategyMomentumPerDomain").then((m) => ({
      default: m.StrategyMomentumPerDomain,
    })),
  { loading: () => <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyDriftAlertBlock = dynamic(
  () =>
    import("@/components/strategy/StrategyDriftAlertBlock").then((m) => ({
      default: m.StrategyDriftAlertBlock,
    })),
  { loading: () => null }
);
const StrategyWeeklyReviewCTA = dynamic(
  () =>
    import("@/components/strategy/StrategyWeeklyReviewCTA").then((m) => ({
      default: m.StrategyWeeklyReviewCTA,
    })),
  { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);

export default async function StrategyPage() {
  const strategy = await getActiveStrategyFocus();
  const past = await getPastStrategyFocus(6);

  if (!strategy) {
    return (
      <div className="container page space-y-6">
        <HQPageHeader
          title="🧠 Strategy"
          subtitle="4 lagen: Direction → Allocation → Accountability → Pressure & Adaptation. Geen thesis = geen actieve strategie."
          backHref="/dashboard"
        />
        <section className="mascot-hero mascot-hero-top" data-mascot-page="strategy" aria-hidden>
          <img src={getMascotSrcForPage("strategy")} alt="" className="mascot-img" />
        </section>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/report"
            className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
          >
            Reality report →
          </Link>
          <Link
            href="/budget"
            className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
          >
            Budget & goals →
          </Link>
          <Link
            href="/learning"
            className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
          >
            Growth →
          </Link>
        </div>
        <StrategyThesisForm />
        <StrategyArchiveHistory past={past} />
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  await computeAndUpsertAlignment(strategy.id, today);

  const [pressureData, alignmentThisWeek, alignmentLog, momentum, driftAlert, reviewStatus] =
    await Promise.all([
      getPressureIndex(strategy.id),
      getAlignmentThisWeek(strategy.id),
      getAlignmentLog(strategy.id, 14),
      getMomentumByDomain(),
      getDriftAlert(strategy.id),
      getStrategyReviewStatus(strategy.id, strategy.start_date),
    ]);

  const alignmentLogTrend = alignmentLog.map((l) => ({
    date: l.date,
    alignment_score: l.alignment_score,
  }));

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="🧠 Strategy"
        subtitle="4 lagen: Direction → Allocation → Accountability → Pressure & Adaptation"
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top" data-mascot-page="strategy" aria-hidden>
        <img src={getMascotSrcForPage("strategy")} alt="" className="mascot-img" />
      </section>
      {reviewStatus.reviewDue && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>Zonder review: nieuwe week inactive.</strong> Voltooi je wekelijkse review hieronder om de strategie actief te houden.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href="/report"
          className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
        >
          Reality report →
        </Link>
        <Link
          href="/budget"
          className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
        >
          Budget & goals →
        </Link>
        <Link
          href="/learning"
          className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
        >
          Growth →
        </Link>
      </div>

      <StrategyThesisHero
        thesis={strategy.thesis}
        thesisWhy={strategy.thesis_why}
        deadline={strategy.deadline}
        targetMetric={strategy.target_metric}
        pressure={pressureData.pressure}
        zone={pressureData.zone}
        daysRemaining={pressureData.daysRemaining}
      />

      <StrategyFocusMultipliers
        primaryDomain={strategy.primary_domain}
        secondaryDomains={strategy.secondary_domains}
      />

      <StrategyAllocationSliders initialAllocation={strategy.weekly_allocation} />

      <StrategyAlignmentGraph
        plannedDistribution={alignmentThisWeek.planned}
        actualDistribution={alignmentThisWeek.actual}
        alignmentScore={alignmentThisWeek.alignmentScore}
        alignmentLog={alignmentLogTrend}
      />

      <StrategyMomentumPerDomain momentumByDomain={momentum} />

      {driftAlert && (
        <StrategyDriftAlertBlock message={driftAlert.message} pctOff={driftAlert.pctOff} />
      )}

      <StrategyPhaseIndicator phase={strategy.phase} />

      <StrategyWeeklyReviewCTA
        strategyId={strategy.id}
        weekNumber={reviewStatus.weekNumber}
        weekStart={reviewStatus.weekStart}
        reviewDue={reviewStatus.reviewDue}
        lastAlignmentScore={alignmentThisWeek.alignmentScore}
      />

      <StrategyArchiveHistory past={past} />
    </div>
  );
}

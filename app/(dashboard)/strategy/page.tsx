import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getXP } from "@/app/actions/xp";
import { HQPageHeader } from "@/components/hq";
import { XPBadge } from "@/components/XPBadge";
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

/** Force dynamic: strategy uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";

function StrategyShell() {
  return (
    <>
      <HQPageHeader
        title="🧠 Strategy"
        subtitle="4 lagen: Direction → Allocation → Accountability → Pressure & Adaptation"
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="strategy" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="strategy" className="mascot-img" heroLarge />
        </div>
      </section>
    </>
  );
}

function StrategyContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden />
    </div>
  );
}

const StrategyThesisForm = nextDynamic(
  () => import("@/components/strategy/StrategyThesisForm").then((m) => ({ default: m.StrategyThesisForm })),
  { loading: () => <div className="min-h-[320px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyAllocationSliders = nextDynamic(
  () =>
    import("@/components/strategy/StrategyAllocationSliders").then((m) => ({
      default: m.StrategyAllocationSliders,
    })),
  { loading: () => <div className="min-h-[180px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyAlignmentGraph = nextDynamic(
  () =>
    import("@/components/strategy/StrategyAlignmentGraph").then((m) => ({
      default: m.StrategyAlignmentGraph,
    })),
  { loading: () => <div className="min-h-[280px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyMomentumPerDomain = nextDynamic(
  () =>
    import("@/components/strategy/StrategyMomentumPerDomain").then((m) => ({
      default: m.StrategyMomentumPerDomain,
    })),
  { loading: () => <div className="min-h-[200px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyDriftAlertBlock = nextDynamic(
  () =>
    import("@/components/strategy/StrategyDriftAlertBlock").then((m) => ({
      default: m.StrategyDriftAlertBlock,
    })),
  { loading: () => null }
);
const StrategyWeeklyReviewCTA = nextDynamic(
  () =>
    import("@/components/strategy/StrategyWeeklyReviewCTA").then((m) => ({
      default: m.StrategyWeeklyReviewCTA,
    })),
  { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const StrategyArchiveCTA = nextDynamic(
  () =>
    import("@/components/strategy/StrategyArchiveCTA").then((m) => ({
      default: m.StrategyArchiveCTA,
    })),
  { loading: () => null }
);

async function StrategyContent() {
  let strategy: Awaited<ReturnType<typeof getActiveStrategyFocus>> = null;
  let past: Awaited<ReturnType<typeof getPastStrategyFocus>> = [];
  let xp: Awaited<ReturnType<typeof getXP>> = { total_xp: 0, level: 1 };

  try {
    const result = await Promise.all([
      getActiveStrategyFocus(),
      getPastStrategyFocus(6),
      getXP(),
    ]);
    strategy = result[0];
    past = result[1];
    xp = result[2];
  } catch (e) {
    console.error("Strategy page data load failed (check Supabase env and migrations):", e);
    return (
      <>
        <HQPageHeader title="🧠 Strategy" subtitle="Kon strategie niet laden." backHref="/dashboard" />
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--text-primary)]">
          <p className="font-medium">Er is iets misgegaan</p>
          <p className="mt-1 text-[var(--text-muted)]">
            Mogelijke oorzaken: (1) Supabase env — in Vercel: Project → Settings → Environment Variables, zet NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY. (2) Database — voer migraties uit in Supabase SQL Editor. Zie DEPLOY.md.
          </p>
        </div>
        <StrategyThesisForm />
      </>
    );
  }

  if (!strategy) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
          <Link href="/report" className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]">
            Reality report →
          </Link>
          <Link href="/budget" className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]">
            Budget & goals →
          </Link>
          <Link href="/learning" className="link-glow-hover inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]">
            Growth →
          </Link>
        </div>
        <StrategyThesisForm />
        <StrategyArchiveHistory past={past} />
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    await computeAndUpsertAlignment(strategy.id, today);
  } catch {
    // Non-blocking; alignment can fail if tables missing
  }

  let pressureData = { pressure: 0, zone: "comfort" as "comfort" | "healthy" | "risk", daysRemaining: 0, targetRemaining: 0 };
  let alignmentThisWeek = { planned: {} as Record<string, number>, actual: {} as Record<string, number>, alignmentScore: 0 };
  let alignmentLog: { date: string; alignment_score: number }[] = [];
  let momentum: Record<string, number> = {};
  let driftAlert: { message: string; pctOff: number } | null = null;
  let reviewStatus = { reviewDue: false, weekNumber: 0, weekStart: "", lastReview: null as null | unknown };

  try {
    const [p, a, log, mom, drift, review] = await Promise.all([
      getPressureIndex(strategy.id),
      getAlignmentThisWeek(strategy.id),
      getAlignmentLog(strategy.id, 14),
      getMomentumByDomain(),
      getDriftAlert(strategy.id),
      getStrategyReviewStatus(strategy.id, strategy.start_date),
    ]);
    pressureData = p ?? pressureData;
    alignmentThisWeek = a ?? alignmentThisWeek;
    alignmentLog = (log ?? []).map((l) => ({ date: l.date, alignment_score: l.alignment_score }));
    momentum = mom ?? momentum;
    driftAlert = drift ?? null;
    reviewStatus = review ?? reviewStatus;
  } catch {
    // Fallbacks already set
  }

  const alignmentLogTrend = alignmentLog.map((l) => ({
    date: l.date,
    alignment_score: l.alignment_score,
  }));

  return (
    <>
      {reviewStatus.reviewDue && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <strong>Zonder review: nieuwe week inactive.</strong> Voltooi je wekelijkse review hieronder om de strategie actief te houden.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
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

      <StrategyArchiveCTA strategyId={strategy.id} />

      <StrategyArchiveHistory past={past} />
    </>
  );
}

export default function StrategyPage() {
  return (
    <div className="container page space-y-6">
      <StrategyShell />
      <Suspense fallback={<StrategyContentSkeleton />}>
        <StrategyContent />
      </Suspense>
    </div>
  );
}

import nextDynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
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
import { StrategyQuarterCommandCenter } from "@/components/strategy/StrategyQuarterCommandCenter";
import { StrategyIntegratedOverview } from "@/components/strategy/StrategyIntegratedOverview";
import { StrategyTabsShell } from "@/components/strategy/StrategyTabsShell";
import { getStrategyIntegrationOverview } from "@/app/actions/strategy-integration";
import { getQuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { neuroStrategyBudgetHint } from "@/lib/neuro-copy";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { profileInsightsHref } from "@/lib/profile-routes";
import { DashboardHubCommandShell } from "@/components/layout/DashboardHubCommandShell";
import { isQuarterContractComplete } from "@/lib/strategy/engine-params";
import { StrategyContractLockToast } from "@/components/strategy/StrategyContractLockToast";

/** Force dynamic: strategy uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";

const StrategyThesisForm = nextDynamic(
  () => import("@/components/strategy/StrategyThesisForm").then((m) => ({ default: m.StrategyThesisForm })),
  { loading: () => null }
);
const StrategyAllocationSliders = nextDynamic(
  () =>
    import("@/components/strategy/StrategyAllocationSliders").then((m) => ({
      default: m.StrategyAllocationSliders,
    })),
  { loading: () => null }
);
const StrategyAlignmentGraph = nextDynamic(
  () =>
    import("@/components/strategy/StrategyAlignmentGraph").then((m) => ({
      default: m.StrategyAlignmentGraph,
    })),
  { loading: () => null }
);
const StrategyMomentumPerDomain = nextDynamic(
  () =>
    import("@/components/strategy/StrategyMomentumPerDomain").then((m) => ({
      default: m.StrategyMomentumPerDomain,
    })),
  { loading: () => null }
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
  { loading: () => null }
);
const StrategyArchiveCTA = nextDynamic(
  () =>
    import("@/components/strategy/StrategyArchiveCTA").then((m) => ({
      default: m.StrategyArchiveCTA,
    })),
  { loading: () => null }
);

async function StrategyContent({ simplifiedLayout = false }: { simplifiedLayout?: boolean }) {
  let strategy: Awaited<ReturnType<typeof getActiveStrategyFocus>> = null;
  let past: Awaited<ReturnType<typeof getPastStrategyFocus>> = [];

  try {
    const result = await Promise.all([getActiveStrategyFocus(), getPastStrategyFocus(6)]);
    strategy = result[0];
    past = result[1];
  } catch (e) {
    console.error("Strategy page data load failed (check Supabase env and migrations):", e);
    return (
      <>
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
        <StrategyThesisForm />
        <StrategyArchiveHistory past={past} />
      </>
    );
  }

  const contractComplete = isQuarterContractComplete(strategy.engine_params);

  if (!contractComplete) {
    return (
      <div data-tutorial="strategy-content" className={simplifiedLayout ? "space-y-6" : "space-y-4"}>
        <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
          <StrategyContractLockToast show />
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            <strong>Strategy is vergrendeld</strong>
            <p className="mt-1 text-[var(--text-secondary)]">
              Vul je kwartaalcontract in (spaardoel, leerprogress % en XP-doel dit kwartaal). Dat doe je onder{" "}
              <span className="font-medium text-[var(--text-primary)]">Profiel → Engine → Contract</span>. Daarna
              verschijnen hier overview, thesis en weekly tools.
            </p>
            <Link
              href="/profile?view=engine&engineTab=strategy"
              className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(6,18,30,0.85)] px-4 text-sm font-semibold text-[var(--semantic-accent)] transition hover:border-[rgba(var(--mode-rgb),0.5)]"
            >
              Open contract in Profiel →
            </Link>
          </div>
          <StrategyArchiveHistory past={past} />
        </div>
      </div>
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

  let neuroBudgetHint: string | null = null;
  let quarterSnapshot: Awaited<ReturnType<typeof getQuarterEngineSnapshot>> = null;
  let integrationData: Awaited<ReturnType<typeof getStrategyIntegrationOverview>> = null;
  try {
    const [p, a, log, mom, drift, review, behaviorProfile, quarter, integration] = await Promise.all([
      getPressureIndex(strategy.id),
      getAlignmentThisWeek(strategy.id),
      getAlignmentLog(strategy.id, 14),
      getMomentumByDomain(),
      getDriftAlert(strategy.id),
      getStrategyReviewStatus(strategy.id, strategy.start_date),
      getBehaviorProfile(),
      getQuarterEngineSnapshot(),
      getStrategyIntegrationOverview(),
    ]);
    pressureData = p ?? pressureData;
    alignmentThisWeek = a ?? alignmentThisWeek;
    alignmentLog = (log ?? []).map((l) => ({ date: l.date, alignment_score: l.alignment_score }));
    momentum = mom ?? momentum;
    driftAlert = drift ?? null;
    reviewStatus = review ?? reviewStatus;
    neuroBudgetHint = neuroStrategyBudgetHint(behaviorProfile.neuroProfileTags);
    quarterSnapshot = quarter;
    integrationData = integration;
  } catch {
    // Fallbacks already set
  }

  const alignmentLogTrend = alignmentLog.map((l) => ({
    date: l.date,
    alignment_score: l.alignment_score,
  }));

  const reviewBanner =
    reviewStatus.reviewDue ? (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <strong>Zonder review: nieuwe week inactive.</strong> Voltooi je wekelijkse review hieronder om de strategie
        actief te houden.
      </div>
    ) : null;

  const engineAdjustLink = (
    <p className="text-xs text-[var(--text-muted)]">
      Contract & motor (missies, locks, push):{" "}
      <Link
        href="/profile?view=engine&engineTab=strategy"
        className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline"
      >
        Profiel → Engine → Contract
      </Link>
    </p>
  );

  const mainStack = (
    <StrategyTabsShell
      simplifiedLayout={simplifiedLayout}
      banner={reviewBanner}
      overview={
        <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
          <StrategyIntegratedOverview integrationData={integrationData} />
          {quarterSnapshot ? (
            <StrategyQuarterCommandCenter snapshot={quarterSnapshot} simplifiedLayout={simplifiedLayout} />
          ) : null}
          <StrategyThesisHero
            thesis={strategy.thesis}
            thesisWhy={strategy.thesis_why}
            deadline={strategy.deadline}
            targetMetric={strategy.target_metric}
            pressure={pressureData.pressure}
            zone={pressureData.zone}
            daysRemaining={pressureData.daysRemaining}
            hidePressureMeter={!!quarterSnapshot}
          />
          {engineAdjustLink}
        </div>
      }
      focusBudget={
        <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
          <StrategyFocusMultipliers
            primaryDomain={strategy.primary_domain}
            secondaryDomains={strategy.secondary_domains}
          />
          <StrategyAllocationSliders initialAllocation={strategy.weekly_allocation} neuroHint={neuroBudgetHint} />
        </div>
      }
      alignment={
        <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
          <StrategyAlignmentGraph
            plannedDistribution={alignmentThisWeek.planned}
            actualDistribution={alignmentThisWeek.actual}
            alignmentScore={alignmentThisWeek.alignmentScore}
            alignmentLog={alignmentLogTrend}
          />
          <StrategyMomentumPerDomain momentumByDomain={momentum} />
          {driftAlert ? (
            <StrategyDriftAlertBlock message={driftAlert.message} pctOff={driftAlert.pctOff} />
          ) : null}
        </div>
      }
      review={
        <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
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
        </div>
      }
    />
  );

  return (
    <div data-tutorial="strategy-content" className={simplifiedLayout ? "space-y-6" : "space-y-4"}>
      {mainStack}
    </div>
  );
}

export default async function StrategyPage() {
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;
  const lightUi = false;

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Strategy"
          hideTitleBar
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/profile?view=engine&engineTab=strategy", label: "Contract" },
            { href: profileInsightsHref("overview"), label: "Insights" },
            { href: "/budget", label: "Budget" },
          ]}
        >
          <div className="space-y-6">
            <Suspense fallback={<div className="min-h-[200px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />}>
              <StrategyContent simplifiedLayout />
            </Suspense>
          </div>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <DashboardHubCommandShell hubLabel="Strategy" showBridgeLabel={false} lightUi={lightUi}>
      <Suspense fallback={<div className="min-h-[200px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />}>
        <StrategyContent />
      </Suspense>
    </DashboardHubCommandShell>
  );
}

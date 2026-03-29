import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { HeroMascotImage } from "@/components/HeroMascotImage";
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
import { StrategyEngineSettingsSection } from "@/components/strategy/StrategyEngineSettingsSection";
import { StrategyIntegratedOverview } from "@/components/strategy/StrategyIntegratedOverview";
import { StrategyTabsShell } from "@/components/strategy/StrategyTabsShell";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getStrategyIntegrationOverview } from "@/app/actions/strategy-integration";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { buildStrategyAnalysisSnapshot } from "@/lib/strategy/build-strategy-analysis-square";
import { StrategyAnalysisSquare } from "@/components/strategy/StrategyAnalysisSquare";
import { neuroStrategyBudgetHint } from "@/lib/neuro-copy";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { DashboardHubCommandShell } from "@/components/layout/DashboardHubCommandShell";

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
  let strategyIntegration: Awaited<ReturnType<typeof getStrategyIntegrationOverview>> = null;
  let strategyEngineHints: Awaited<ReturnType<typeof getStrategyPacingHints>> = null;
  try {
    const [p, a, log, mom, drift, review, behaviorProfile, integration, engineHints] = await Promise.all([
      getPressureIndex(strategy.id),
      getAlignmentThisWeek(strategy.id),
      getAlignmentLog(strategy.id, 14),
      getMomentumByDomain(),
      getDriftAlert(strategy.id),
      getStrategyReviewStatus(strategy.id, strategy.start_date),
      getBehaviorProfile(),
      getStrategyIntegrationOverview(),
      getStrategyPacingHints(),
    ]);
    pressureData = p ?? pressureData;
    alignmentThisWeek = a ?? alignmentThisWeek;
    alignmentLog = (log ?? []).map((l) => ({ date: l.date, alignment_score: l.alignment_score }));
    momentum = mom ?? momentum;
    driftAlert = drift ?? null;
    reviewStatus = review ?? reviewStatus;
    neuroBudgetHint = neuroStrategyBudgetHint(behaviorProfile.neuroProfileTags);
    strategyIntegration = integration;
    strategyEngineHints = engineHints;
  } catch {
    // Fallbacks already set
  }

  const analysisSnapshot = buildStrategyAnalysisSnapshot(
    strategyIntegration,
    alignmentThisWeek.alignmentScore,
    reviewStatus.reviewDue,
    strategyEngineHints,
  );

  const alignmentLogTrend = alignmentLog.map((l) => ({
    date: l.date,
    alignment_score: l.alignment_score,
  }));

  const reviewBanner =
    reviewStatus.reviewDue ? (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <strong>Zonder review: nieuwe week inactive.</strong> Voltooi je wekelijkse review in het tabblad Review om de strategie actief te houden.
      </div>
    ) : null;

  return (
    <div data-tutorial="strategy-content" className={simplifiedLayout ? "space-y-6" : "space-y-4"}>
      {analysisSnapshot ? <StrategyAnalysisSquare snapshot={analysisSnapshot} /> : null}
      <Suspense fallback={<div className="min-h-[120px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />}>
        <div
          className={
            analysisSnapshot
              ? "mt-4 border-t border-[rgba(var(--mode-rgb),0.12)] pt-6"
              : "mt-2 border-t border-[rgba(var(--mode-rgb),0.1)] pt-6"
          }
        >
          <StrategyEngineSettingsSection />
        </div>
      </Suspense>
      <StrategyTabsShell
        simplifiedLayout={simplifiedLayout}
        banner={reviewBanner}
        belowTabsSlot={
          !simplifiedLayout ? (
            <>
              <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="strategy" aria-hidden>
                <div className="mascot-hero-inner mx-auto">
                  <HeroMascotImage page="strategy" className="mascot-img" heroLarge />
                </div>
              </section>
              <p className="text-center text-xs text-[var(--text-muted)]">
                Overzicht, allocatie, momentum en review — hieronder thesis en stack.
              </p>
            </>
          ) : undefined
        }
        overview={
          <>
            <StrategyIntegratedOverview integrationData={strategyIntegration} />
            <StrategyThesisHero
              thesis={strategy.thesis}
              thesisWhy={strategy.thesis_why}
              deadline={strategy.deadline}
              targetMetric={strategy.target_metric}
              pressure={pressureData.pressure}
              zone={pressureData.zone}
              daysRemaining={pressureData.daysRemaining}
            />
          </>
        }
        focusBudget={
          <>
            <StrategyFocusMultipliers
              primaryDomain={strategy.primary_domain}
              secondaryDomains={strategy.secondary_domains}
            />
            <StrategyAllocationSliders initialAllocation={strategy.weekly_allocation} neuroHint={neuroBudgetHint} />
          </>
        }
        alignment={
          <>
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
          </>
        }
        review={
          <>
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
        }
      />
    </div>
  );
}

export default async function StrategyPage() {
  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;
  const lightUi = prefs.light_ui === true;

  if (simplified) {
    return (
      <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
        <SimplifiedPageShell
          title="Strategy"
          hideTitleBar
          footerLinks={[
            { href: "/tasks", label: "Missions" },
            { href: "/report", label: "Insights" },
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

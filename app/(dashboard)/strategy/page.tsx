import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import {
  getActiveStrategyFocus,
  getPastStrategyFocus,
  getPressureIndex,
  getStrategyReviewStatus,
  getAlignmentThisWeek,
  computeAndUpsertAlignment,
} from "@/app/actions/strategyFocus";
import { StrategyThesisHero } from "@/components/strategy/StrategyThesisHero";
import { StrategyArchiveHistory } from "@/components/strategy/StrategyArchiveHistory";
import { getQuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";
import { profileInsightsHref } from "@/lib/profile-routes";
import { DashboardHubCommandShell } from "@/components/layout/DashboardHubCommandShell";
import { isQuarterContractComplete } from "@/lib/strategy/engine-params";
import { StrategyContractLockToast } from "@/components/strategy/StrategyContractLockToast";
import { StrategyQuarterContractPanel } from "@/components/strategy/StrategyQuarterContractPanel";
import { StrategyThreeTabShell } from "@/components/strategy/StrategyThreeTabShell";
import { StrategyCommandTab } from "@/components/strategy/StrategyCommandTab";
import { StrategyReviewTabPanel } from "@/components/strategy/StrategyReviewTabPanel";

/** Force dynamic: strategy uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";

const StrategyThesisForm = nextDynamic(
  () => import("@/components/strategy/StrategyThesisForm").then((m) => ({ default: m.StrategyThesisForm })),
  { loading: () => null }
);
const StrategyArchiveCTA = nextDynamic(
  () => import("@/components/strategy/StrategyArchiveCTA").then((m) => ({ default: m.StrategyArchiveCTA })),
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
            Mogelijke oorzaken: (1) Supabase env — in Vercel: Project → Settings → Environment Variables, zet
            NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY. (2) Database — voer migraties uit in Supabase SQL
            Editor. Zie DEPLOY.md.
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
              Vul hieronder je kwartaalcontract in: spaardoel, leerprogress (%) en XP-doel dit kwartaal. Daarna ontgrendel
              je Command en Review.
            </p>
          </div>
          <StrategyQuarterContractPanel />
          <StrategyArchiveHistory past={past} />
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  try {
    await computeAndUpsertAlignment(strategy.id, today);
  } catch {
    // Non-blocking
  }

  let pressureData = {
    pressure: 0,
    zone: "comfort" as "comfort" | "healthy" | "risk",
    daysRemaining: 0,
    targetRemaining: 0,
  };
  let reviewStatus = { reviewDue: false, weekNumber: 0, weekStart: "", lastReview: null as null | unknown };
  let quarterSnapshot = null as Awaited<ReturnType<typeof getQuarterEngineSnapshot>>;
  let alignmentThisWeekScore: number | null = null;

  try {
    const [p, review, quarter, align] = await Promise.all([
      getPressureIndex(strategy.id),
      getStrategyReviewStatus(strategy.id, strategy.start_date),
      getQuarterEngineSnapshot(),
      getAlignmentThisWeek(strategy.id),
    ]);
    pressureData = p ?? pressureData;
    reviewStatus = review ?? reviewStatus;
    quarterSnapshot = quarter;
    alignmentThisWeekScore = align?.alignmentScore ?? null;
  } catch {
    // fallbacks
  }

  const contractTab = (
    <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
      <StrategyQuarterContractPanel />
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
    </div>
  );

  const reviewTab = (
    <div className={simplifiedLayout ? "space-y-6" : "space-y-5"}>
      <StrategyReviewTabPanel
        strategyId={strategy.id}
        weekNumber={reviewStatus.weekNumber}
        weekStart={reviewStatus.weekStart}
        reviewDue={reviewStatus.reviewDue}
        lastAlignmentScore={alignmentThisWeekScore}
      />
      <StrategyArchiveCTA strategyId={strategy.id} />
      <StrategyArchiveHistory past={past} />
    </div>
  );

  return (
    <div data-tutorial="strategy-content" className={simplifiedLayout ? "space-y-6" : "space-y-4"}>
      <StrategyThreeTabShell
        simplifiedLayout={simplifiedLayout}
        command={<StrategyCommandTab snapshot={quarterSnapshot} />}
        contract={contractTab}
        review={reviewTab}
      />
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
            { href: "/strategy?tab=contract#strategy-contract", label: "Contract" },
            { href: profileInsightsHref("overview"), label: "Insights" },
            { href: "/budget", label: "Budget" },
          ]}
        >
          <div className="space-y-6">
            <Suspense
              fallback={<div className="min-h-[200px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />}
            >
              <StrategyContent simplifiedLayout />
            </Suspense>
          </div>
        </SimplifiedPageShell>
      </div>
    );
  }

  return (
    <DashboardHubCommandShell hubLabel="Strategy" showBridgeLabel={false} lightUi={lightUi}>
      <Suspense
        fallback={<div className="min-h-[200px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />}
      >
        <StrategyContent />
      </Suspense>
    </DashboardHubCommandShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { HQHeader, BrainStatusCard, ActiveMissionCard } from "@/components/hq";
import { EconomyBadge } from "@/components/EconomyBadge";
import { CommanderHomeHero } from "@/components/commander";
import { ModeBanner, ModeExplanationModal } from "@/components/dashboard/DashboardClientOnly";
import { XPBadge } from "@/components/XPBadge";
import { DashboardContextCard } from "@/components/dashboard/DashboardContextCard";
import { DashboardUpdatesCard } from "@/components/dashboard/DashboardUpdatesCard";
import { BudgetBadge } from "@/components/dashboard/BudgetBadge";
import { DashboardActionsTrigger } from "@/components/dashboard/DashboardActionsTrigger";
import { CollapsibleDashboardCard } from "@/components/dashboard/CollapsibleDashboardCard";
import { DashboardQuickBudgetLog } from "@/components/dashboard/DashboardQuickBudgetLog";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { Divider1px } from "@/components/hud-test/Divider1px";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";
import { DashboardSkeleton } from "@/components/Skeleton";
import { useDashboardData } from "@/components/providers/DashboardDataProvider";
import type { CopyVariant } from "@/app/actions/adaptive";
import type { BrainMode } from "@/lib/brain-mode";
import type { ConfrontationSummary } from "@/app/actions/confrontation-summary";
import type { PoolBudget } from "@/app/actions/energy";
import type { AppMode } from "@/app/actions/mode";
import type { Archetype, EvolutionPhase, ReputationScore } from "@/lib/identity-engine";
import type { MomentumBand } from "@/lib/momentum";
import type { BucketedToday } from "@/lib/today-engine";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";
import type { Quote } from "@/types/database.types";
import type { HeatmapDay } from "@/app/actions/dcic/heatmap";
import type { WeekSummary } from "@/app/actions/analytics";
import type { RealityReport } from "@/app/actions/report";
import { getDayOfYearFromDateString } from "@/lib/utils/timezone";

const IdentityBlock = dynamic(() => import("@/components/dashboard/IdentityBlock").then((m) => ({ default: m.IdentityBlock })), { loading: () => <div className="glass-card min-h-[140px] animate-pulse rounded-[22px]" aria-hidden /> });
const MomentumScore = dynamic(() => import("@/components/dashboard/MomentumScore").then((m) => ({ default: m.MomentumScore })), { loading: () => <div className="glass-card min-h-[100px] animate-pulse rounded-[22px]" aria-hidden /> });
const TodayEngineCard = dynamic(() => import("@/components/dashboard/TodayEngineCard").then((m) => ({ default: m.TodayEngineCard })), { loading: () => <div className="glass-card min-h-[160px] animate-pulse rounded-[22px]" aria-hidden /> });
const WeeklyHeatmap = dynamic(() => import("@/components/dashboard/WeeklyHeatmap").then((m) => ({ default: m.WeeklyHeatmap })), { loading: () => <div className="glass-card min-h-[80px] animate-pulse rounded-[22px]" aria-hidden /> });
const HQChart = dynamic(() => import("@/components/hq").then((m) => ({ default: m.HQChart })), { loading: () => <div className="glass-card min-h-[180px] animate-pulse rounded-[22px]" aria-hidden /> });
const RealityReportBlock = dynamic(() => import("@/components/RealityReportBlock").then((m) => ({ default: m.RealityReportBlock })), { loading: () => <div className="glass-card min-h-[100px] animate-pulse rounded-[22px]" aria-hidden /> });
const PatternInsightCard = dynamic(() => import("@/components/hq/PatternInsightCard").then((m) => ({ default: m.PatternInsightCard })), { loading: () => <div className="glass-card min-h-[80px] animate-pulse rounded-[22px]" aria-hidden /> });
const EnergyBudgetBar = dynamic(() => import("@/components/EnergyBudgetBar").then((m) => ({ default: m.EnergyBudgetBar })), { loading: () => <div className="h-3 w-full animate-pulse rounded-full bg-white/10" aria-hidden /> });
const EnergyOverBudgetBanner = dynamic(() => import("@/components/dashboard/EnergyOverBudgetBanner").then((m) => ({ default: m.EnergyOverBudgetBanner })), { loading: () => null });
const LateDayNoTaskBanner = dynamic(() => import("@/components/dashboard/LateDayNoTaskBanner").then((m) => ({ default: m.LateDayNoTaskBanner })), { loading: () => null });
const ConsequenceBanner = dynamic(() => import("@/components/ConsequenceBanner").then((m) => ({ default: m.ConsequenceBanner })), { loading: () => null });
const AvoidanceNotice = dynamic(() => import("@/components/AvoidanceNotice").then((m) => ({ default: m.AvoidanceNotice })), { loading: () => null });
const FocusBlock = dynamic(() => import("@/components/FocusBlock").then((m) => ({ default: m.FocusBlock })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const OnTrackCard = dynamic(() => import("@/components/OnTrackCard").then((m) => ({ default: m.OnTrackCard })), { loading: () => <div className="glass-card min-h-[60px] animate-pulse rounded-[22px]" aria-hidden /> });
const OnboardingBanner = dynamic(() => import("@/components/OnboardingBanner").then((m) => ({ default: m.OnboardingBanner })), { loading: () => null });
const AnalyticsWeekWidget = dynamic(() => import("@/components/AnalyticsWeekWidget").then((m) => ({ default: m.AnalyticsWeekWidget })), { loading: () => <div className="glass-card min-h-[100px] animate-pulse rounded-[22px]" aria-hidden /> });
const ConfrontationBanner = dynamic(() => import("@/components/dashboard/ConfrontationBanner").then((m) => ({ default: m.ConfrontationBanner })), { loading: () => null });
const WeeklyMirrorBanner = dynamic(() => import("@/components/dashboard/WeeklyMirrorBanner").then((m) => ({ default: m.WeeklyMirrorBanner })), { loading: () => null });
const BehaviorSuggestionsBanner = dynamic(() => import("@/components/dashboard/BehaviorSuggestionsBanner").then((m) => ({ default: m.BehaviorSuggestionsBanner })), { loading: () => null });
const MinimalIntegrityBanner = dynamic(() => import("@/components/dashboard/MinimalIntegrityBanner").then((m) => ({ default: m.MinimalIntegrityBanner })), { loading: () => null });
const ProgressionPrimeBudgetCard = dynamic(() => import("@/components/dashboard/ProgressionPrimeBudgetCard").then((m) => ({ default: m.ProgressionPrimeBudgetCard })), { loading: () => null });
const DangerousModulesCard = dynamic(() => import("@/components/dashboard/DangerousModulesCard").then((m) => ({ default: m.DangerousModulesCard })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });

type CriticalData = Awaited<ReturnType<typeof fetchCritical>>;
type SecondaryData = Awaited<ReturnType<typeof fetchSecondary>>;

async function fetchCritical(): Promise<Record<string, unknown>> {
  const res = await fetch("/api/dashboard/data?part=critical", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body && typeof body.error === "string") ? body.error : `Failed to load dashboard (${res.status})`;
    throw new Error(res.status === 401 ? "Unauthorized" : msg);
  }
  return res.json();
}

async function fetchSecondary(): Promise<Record<string, unknown>> {
  const res = await fetch("/api/dashboard/data?part=secondary", { credentials: "include" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body && typeof body.error === "string") ? body.error : `Failed to load dashboard secondary (${res.status})`;
    throw new Error(msg);
  }
  return res.json();
}

export function DashboardClientShell() {
  const cache = useDashboardData();
  const [critical, setCritical] = useState<CriticalData | null>(() => cache?.critical ?? null);
  const [secondary, setSecondary] = useState<SecondaryData | null>(() => cache?.secondary ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromCache = cache?.critical ?? null;
    if (fromCache) {
      setCritical(fromCache);
      if (cache?.secondary) setSecondary(cache.secondary);
      return;
    }
    let cancelled = false;
    fetchCritical()
      .then((data) => {
        if (!cancelled) {
          setCritical(data);
          cache?.setDashboardData({ critical: data });
        }
        return fetchSecondary();
      })
      .then((data) => {
        if (!cancelled) {
          setSecondary(data);
          cache?.setDashboardData({ secondary: data });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!cache || !critical) return;
    if (cache.critical && cache.secondary) {
      setCritical(cache.critical);
      setSecondary(cache.secondary);
    }
  }, [cache?.critical, cache?.secondary]);

  useEffect(() => {
    if (!critical || !cache) return;
    const t = setTimeout(() => cache.preloadDashboard().catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, [!!critical]);

  if (error) {
    return (
      <main className="container page py-12">
        <p className="text-[var(--text-muted)]">{error === "Unauthorized" ? "Je bent niet ingelogd." : error}</p>
        {error === "Unauthorized" && <Link href="/login" className="text-[var(--accent-focus)] underline mt-2 inline-block">Naar login</Link>}
      </main>
    );
  }

  if (!critical) {
    return (
      <main className="container page page-wide dashboard-page relative z-10 pb-10">
        <DashboardSkeleton />
      </main>
    );
  }

  const dateStr = critical.dateStr as string;
  const isMinimalUI = critical.isMinimalUI as boolean;
  const energyPct = critical.energyPct as number;
  const focusPct = critical.focusPct as number;
  const loadPct = critical.loadPct as number;
  const budgetRemainingCents = critical.budgetRemainingCents as number | null;
  const currency = critical.currency as string;
  const xp = critical.xp as { total_xp: number; level: number };
  const economy = critical.economy as { discipline_points: number; focus_credits: number; momentum_boosters: number };
  const actionsCount = critical.actionsCount as number;
  const topQuickActions = critical.topQuickActions as { key: string; label: string; href: string }[];
  const missionLabel = critical.missionLabel as string;
  const singleGoalLabel = critical.singleGoalLabel as string | null;
  const missionSubtext = critical.missionSubtext as string;
  const autoSuggestions = (critical.autoSuggestions ?? []) as { text: string; type: string }[];
  const emptyMissionMessage = critical.emptyMissionMessage as string;
  const emptyMissionHref = critical.emptyMissionHref as string;
  const dailyQuoteText = critical.dailyQuoteText as string | null;
  const dailyQuoteAuthor = critical.dailyQuoteAuthor as string | null;
  const streakAtRisk = critical.streakAtRisk as boolean;
  const todaysTasks = critical.todaysTasks as { id: string; title: string; carryOverCount: number }[];
  const timeWindow = critical.timeWindow as string;
  const isTimeWindowActive = critical.isTimeWindowActive as boolean;
  const energyBudget = critical.energyBudget as Record<string, unknown>;
  const state = critical.state as { energy?: number; focus?: number; sensory_load?: number; sleep_hours?: number; social_load?: number } | null;
  const yesterdayState = critical.yesterdayState as { energy?: number; focus?: number; sensory_load?: number; sleep_hours?: number; social_load?: number } | null;
  const mode = critical.mode as AppMode;
  const carryOverCount = critical.carryOverCount as number;
  const copyVariant = critical.copyVariant as CopyVariant | undefined;

  const accountabilitySettings = critical.accountabilitySettings as { enabled: boolean; streakFreezeTokens: number } | undefined;
  const confrontationSummary = secondary?.confrontationSummary;
  const identity = secondary?.identity;
  const identityEngine = secondary?.identityEngine;
  const momentum = secondary?.momentum;
  const insightState = secondary?.insightState;
  const todayEngine = secondary?.todayEngine;
  const xpForecast = secondary?.xpForecast;
  const heatmapDays = secondary?.heatmapDays as { date: string; status: HeatmapDay }[] | undefined;
  const weekSummary = secondary?.weekSummary as WeekSummary | null | undefined;
  const lastWeekReport = secondary?.lastWeekReport as RealityReport | null | undefined;
  const strategy = secondary?.strategy;
  const quotesResult = secondary?.quotesResult as (Quote | null)[] | undefined;
  const quoteDay = (secondary?.quoteDay ?? 1) as number;
  const learningStreak = (secondary?.learningStreak ?? critical.learningStreak) as number;
  const weeklyLearningMinutes = (secondary?.weeklyLearningMinutes ?? 0) as number;
  const weeklyLearningTarget = (secondary?.weeklyLearningTarget ?? 60) as number;
  const insight = secondary?.insight as string | undefined;
  const patternSuggestion = secondary?.patternSuggestion as string | null | undefined;

  const secState = (secondary?.state ?? state) as typeof state;
  const secYesterdayState = (secondary?.yesterdayState ?? yesterdayState) as typeof yesterdayState;
  const secEnergyBudget = (secondary?.energyBudget ?? energyBudget) as Record<string, unknown>;
  const progressionRank = secondary?.progressionRank as Record<string, unknown> | null | undefined;
  const primeWindow = secondary?.primeWindow as { start: string; end: string; active: boolean } | null | undefined;
  const weeklyBudgetOutcome = secondary?.weeklyBudgetOutcome as { message: string; recoveryAvailable: boolean } | null | undefined;

  return (
    <main
      className={`relative min-h-screen overflow-hidden ${!isMinimalUI ? hudStyles.cinematicBackdrop : ""} ${isMinimalUI ? "minimal-ui" : ""}`}
      data-minimal={isMinimalUI ? "true" : undefined}
    >
      {!isMinimalUI && (
        <>
          <div className={hudStyles.spaceMist} aria-hidden />
          <div className={hudStyles.starLayerFar} aria-hidden />
          <div className={hudStyles.starLayerNear} aria-hidden />
          <div className={hudStyles.backgroundAtmosphere} aria-hidden />
          <div className={hudStyles.colorBlend} aria-hidden />
          <div className={hudStyles.spaceNoise} aria-hidden />
        </>
      )}
      <div className={`${!isMinimalUI ? "container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10" : ""}`}>
        {!isMinimalUI && (
          <>
            <EnergyOverBudgetBanner remaining={(energyBudget.remaining as number) ?? 0} dateStr={dateStr} />
            <LateDayNoTaskBanner completedTodayCount={(energyBudget.completedTaskCount as number) ?? 0} dateStr={dateStr} />
          </>
        )}
        {!isMinimalUI && (
          <div className="space-y-3">
            <OnboardingBanner />
              <div className="dashboard-top-strip">
              <div className="dashboard-top-strip-track">
                <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
                {budgetRemainingCents != null && <BudgetBadge budgetRemainingCents={budgetRemainingCents} currency={currency} />}
                <EconomyBadge disciplinePoints={economy.discipline_points} focusCredits={economy.focus_credits} momentumBoosters={economy.momentum_boosters} compact />
                <DashboardActionsTrigger count={actionsCount}>
                  {topQuickActions.length === 0 ? (
                    <p className="text-sm text-[var(--text-muted)]">Geen open acties. Check je missies of strategy.</p>
                  ) : (
                    topQuickActions.map((action) => (
                      <Link key={action.key} href={action.href} className="block rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]" onClick={() => { /* sheet closes via default link nav */ }}>
                        {action.label}
                      </Link>
                    ))
                  )}
                </DashboardActionsTrigger>
                <DashboardQuickBudgetLog />
              </div>
            </div>
            <Divider1px />
            <SciFiPanel className={`dashboard-bridge-frame ${hudStyles.focusPrimary}`} bodyClassName="dashboard-bridge-body" variant="command">
              <CornerNode corner="top-left" />
              <CornerNode corner="top-right" />
              <span className="dashboard-bridge-label" aria-hidden>Command</span>
              <CommanderHomeHero
                energyPct={energyPct}
                focusPct={focusPct}
                loadPct={loadPct}
                missionHref={todaysTasks.length > 0 ? "/tasks" : "/assistant"}
                missionLabel={missionLabel}
                singleGoalLabel={singleGoalLabel}
                missionSubtext={missionSubtext}
                exportDate={dateStr}
                streakAtRisk={streakAtRisk}
                dailyQuoteText={dailyQuoteText}
                dailyQuoteAuthor={dailyQuoteAuthor}
                autoSuggestions={autoSuggestions}
              />
            </SciFiPanel>
          </div>
        )}

        {isMinimalUI && (
          <>
            <header className="flex flex-col gap-0 relative pt-14 overflow-visible">
              <div className="relative z-10 -mt-72">
                <HQHeader energyPct={energyPct} focusPct={focusPct} loadPct={loadPct} copyVariant={copyVariant} />
              </div>
            </header>
            <BrainStatusCard
              date={dateStr}
              initial={{ energy: state?.energy ?? null, focus: state?.focus ?? null, sensory_load: state?.sensory_load ?? null, sleep_hours: state?.sleep_hours ?? null, social_load: state?.social_load ?? null, mental_battery: (state as { mental_battery?: number | null })?.mental_battery ?? null, is_rest_day: (state as { is_rest_day?: boolean | null })?.is_rest_day ?? null }}
              yesterday={{ energy: yesterdayState?.energy ?? null, focus: yesterdayState?.focus ?? null, sensory_load: yesterdayState?.sensory_load ?? null, sleep_hours: yesterdayState?.sleep_hours ?? null, social_load: yesterdayState?.social_load ?? null, mental_battery: (yesterdayState as { mental_battery?: number | null })?.mental_battery ?? null }}
              brainMode={energyBudget.brainMode as BrainMode}
              suggestedTaskCount={(energyBudget.suggestedTaskCount as number) ?? 3}
            />
            <ConfrontationBanner />
            <ConsequenceBanner
              energyDepleted={(energyBudget.consequence as { energyDepleted?: boolean } | undefined)?.energyDepleted}
              recoveryOnly={(energyBudget.consequence as { recoveryOnly?: boolean } | undefined)?.recoveryOnly}
              zeroCompletionPenalty={(state as { zero_completion_penalty_applied?: boolean } | null)?.zero_completion_penalty_applied}
              burnout={critical.burnout as boolean | undefined}
            />
            {(energyBudget.activeStartedCount as number) != null && (energyBudget.maxSlots as number) != null && (energyBudget.activeStartedCount as number) > (energyBudget.maxSlots as number) && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/95">
                Je hebt meer missies gestart dan je focus-slots ({Number(energyBudget.activeStartedCount)} &gt; {Number(energyBudget.maxSlots)}). Druk loopt op — voltooi of sluit er een.
              </div>
            )}
            {secondary && <WeeklyMirrorBanner summary={(confrontationSummary ?? null) as ConfrontationSummary | null} />}
            {secondary && (progressionRank != null || primeWindow != null || weeklyBudgetOutcome != null) && (
              <ProgressionPrimeBudgetCard
                progressionRank={(progressionRank ?? null) as import("@/components/dashboard/ProgressionPrimeBudgetCard").ProgressionRankState | null}
                primeWindow={primeWindow ?? null}
                weeklyBudgetOutcome={(weeklyBudgetOutcome ?? null) as import("@/components/dashboard/ProgressionPrimeBudgetCard").WeeklyBudgetOutcome | null}
              />
            )}
            <MinimalIntegrityBanner />
            <BehaviorSuggestionsBanner />
            {(energyBudget.remaining as number) < 20 && (
              <EnergyBudgetBar
                remaining={energyBudget.remaining as number}
                capacity={energyBudget.capacity as number}
                suggestedTaskCount={energyBudget.suggestedTaskCount as number}
                taskUsed={energyBudget.taskUsed as number}
                completedTaskCount={energyBudget.completedTaskCount as number}
                taskPlanned={energyBudget.taskPlanned as number}
                calendarCost={energyBudget.calendarCost as number}
                energy={energyBudget.energy as PoolBudget}
                focus={energyBudget.focus as PoolBudget}
                load={energyBudget.load as PoolBudget}
                insight={energyBudget.insight as string}
                brainMode={energyBudget.brainMode as BrainMode}
                segments={energyBudget.segments as { label: string; value: number; color: string }[]}
              />
            )}
            <ModeBanner mode={mode} />
            <ModeExplanationModal mode={mode} />
            <AvoidanceNotice carryOverCount={carryOverCount} />
            <ActiveMissionCard tasks={todaysTasks} emptyMessage={emptyMissionMessage} emptyHref={emptyMissionHref} timeWindow={timeWindow} isTimeWindowActive={isTimeWindowActive} />
          </>
        )}

        {!isMinimalUI && (
          <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-6">
            <CornerNode corner="top-left" />
            <CornerNode corner="top-right" />
            <div className="dashboard-bento grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <CollapsibleDashboardCard title="Level & voortgang" storageKey="level" defaultExpanded={true} className="lg:col-span-2">
                <section className="glass-card glass-card-3d rounded-none border-0 p-0">
                  <div className="grid gap-0 md:grid-cols-2">
                    {identity && identityEngine ? (
                      <>
                        <IdentityBlock
                          level={(identity as { level: number }).level}
                          rank={(identity as { rank: string }).rank}
                          streak={(identity as { streak: { current: number } }).streak?.current ?? 0}
                          xpToNextLevel={(identity as { xp_to_next_level: number }).xp_to_next_level}
                          nextUnlock={((identity as { next_unlock?: { level: number; rank: string; xpNeeded: number } | null }).next_unlock) ?? { level: 0, rank: "-", xpNeeded: 0 }}
                          archetype={(identityEngine as { archetype: Archetype }).archetype}
                          evolutionPhase={(identityEngine as { evolutionPhase: EvolutionPhase }).evolutionPhase}
                          reputation={(identityEngine as { reputation: ReputationScore }).reputation}
                          embedded
                        />
                        <MomentumScore
                          score={((insightState as { momentum?: { score: number } })?.momentum?.score ?? (momentum as { score: number })?.score) ?? 0}
                          band={(((insightState as { momentum?: { band: string } })?.momentum?.band ?? (momentum as { band: string })?.band) ?? "medium") as MomentumBand}
                          embedded
                          className="border-t border-[var(--card-border)] md:border-t-0 md:border-l"
                        />
                      </>
                    ) : (
                      <>
                        <div className="glass-card min-h-[140px] animate-pulse rounded-[22px]" aria-hidden />
                        <div className="glass-card min-h-[100px] animate-pulse rounded-[22px] border-t border-[var(--card-border)] md:border-t-0 md:border-l" aria-hidden />
                      </>
                    )}
                  </div>
                </section>
              </CollapsibleDashboardCard>
              <CollapsibleDashboardCard title="Active missions" storageKey="active-missions" defaultExpanded={true} className="lg:col-span-2">
                <div className="dashboard-mission-hero p-4 md:p-6">
                  <ActiveMissionCard tasks={todaysTasks} emptyMessage={emptyMissionMessage} emptyHref={emptyMissionHref} timeWindow={timeWindow} isTimeWindowActive={isTimeWindowActive} />
                </div>
              </CollapsibleDashboardCard>
              <div className="flex flex-col gap-4">
                <CollapsibleDashboardCard title="Vandaag door de app bepaald" storageKey="today-engine" defaultExpanded={true}>
                  {todayEngine != null && xpForecast !== undefined ? (
                    <div className="p-4 md:p-6">
                      <TodayEngineCard
                        bucketed={(todayEngine as { bucketed: BucketedToday }).bucketed}
                        streakAtRisk={(todayEngine as { streakAtRisk: boolean }).streakAtRisk}
                        date={(todayEngine as { date: string }).date}
                        forecasts={xpForecast as XPForecastItem[]}
                      />
                    </div>
                  ) : (
                    <div className="glass-card min-h-[160px] animate-pulse rounded-[22px] m-4" aria-hidden />
                  )}
                </CollapsibleDashboardCard>
              </div>
              <div className="flex flex-col gap-4">
                <DashboardUpdatesCard />
                <CollapsibleDashboardCard title="Systeem modus" subtitle="Brain status & hoe voel je je vandaag" storageKey="systeem-modus" defaultExpanded={true}>
                  <div className="p-4 md:p-6 space-y-6">
                    <BrainStatusCard
                  date={dateStr}
                  initial={{ energy: secState?.energy ?? null, focus: secState?.focus ?? null, sensory_load: secState?.sensory_load ?? null, sleep_hours: secState?.sleep_hours ?? null, social_load: secState?.social_load ?? null, mental_battery: (secState as { mental_battery?: number | null })?.mental_battery ?? null }}
                  yesterday={{ energy: secYesterdayState?.energy ?? null, focus: secYesterdayState?.focus ?? null, sensory_load: secYesterdayState?.sensory_load ?? null, sleep_hours: secYesterdayState?.sleep_hours ?? null, social_load: secYesterdayState?.social_load ?? null, mental_battery: (secYesterdayState as { mental_battery?: number | null })?.mental_battery ?? null }}
                  brainMode={secEnergyBudget.brainMode as BrainMode}
                  suggestedTaskCount={(secEnergyBudget.suggestedTaskCount as number) ?? 3}
                />
                    <DangerousModulesCard embedded />
                  </div>
                </CollapsibleDashboardCard>
                {(!isMinimalUI || (secEnergyBudget.remaining as number) < 20) && (
                  <EnergyBudgetBar
                    remaining={secEnergyBudget.remaining as number}
                    capacity={secEnergyBudget.capacity as number}
                    suggestedTaskCount={secEnergyBudget.suggestedTaskCount as number}
                    taskUsed={secEnergyBudget.taskUsed as number}
                    completedTaskCount={secEnergyBudget.completedTaskCount as number}
                    taskPlanned={secEnergyBudget.taskPlanned as number}
                    calendarCost={secEnergyBudget.calendarCost as number}
                    energy={secEnergyBudget.energy as PoolBudget}
                    focus={secEnergyBudget.focus as PoolBudget}
                    load={secEnergyBudget.load as PoolBudget}
                    insight={secEnergyBudget.insight as string}
                    brainMode={secEnergyBudget.brainMode as BrainMode}
                    segments={secEnergyBudget.segments as { label: string; value: number; color: string }[]}
                  />
                )}
                <DashboardContextCard
                  prev={{
                    quote: secondary && quotesResult ? quotesResult[0] : null,
                    day: secondary ? Math.max(1, quoteDay - 1) : Math.max(1, Math.min(365, (typeof critical.dateStr === "string" ? getDayOfYearFromDateString(critical.dateStr) : 1) - 1)),
                  }}
                  current={{
                    quote: (secondary && quotesResult ? quotesResult[1] : null) ?? (critical.dailyQuoteText ? { id: 0, quote_text: critical.dailyQuoteText as string, author_name: (critical.dailyQuoteAuthor as string) ?? "", era: "", topic: null, created_at: "" } : null),
                    day: secondary ? quoteDay : (typeof critical.dateStr === "string" ? getDayOfYearFromDateString(critical.dateStr) : 1),
                  }}
                  next={{
                    quote: secondary && quotesResult ? quotesResult[2] : null,
                    day: secondary ? Math.min(365, quoteDay + 1) : Math.min(365, (typeof critical.dateStr === "string" ? getDayOfYearFromDateString(critical.dateStr) : 1) + 1),
                  }}
                  mode={mode}
                  identityStatement={(strategy as { identity_statement?: string } | null)?.identity_statement ?? null}
                />
                <ModeExplanationModal mode={mode} />
                {mode === "driven" && <FocusBlock />}
              </div>
            </div>
          </SciFiPanel>
        )}
      </div>
    </main>
  );
}

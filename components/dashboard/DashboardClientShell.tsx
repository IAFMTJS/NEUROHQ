"use client";

import { useEffect, useState, useMemo, useCallback, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Modal } from "@/components/Modal";
import { trackEvent } from "@/app/actions/analytics-events";
import { applyBudgetOptimizationLock } from "@/app/actions/budget-intelligence";
import { getPendingDailyState } from "@/lib/client-pending-writes";
import { usePendingBudgetSnapshot } from "@/lib/client-pending-budget";
import { useHQStore } from "@/lib/hq-store";
import { BrainStatusCard } from "@/components/hq";
import { OverdriveBanner } from "@/components/dashboard/OverdriveBanner";
import { DashboardContextCard } from "@/components/dashboard/DashboardContextCard";
import { DashboardMainMissionTeaser } from "@/components/dashboard/DashboardMainMissionTeaser";
import { SystemOverviewCard } from "@/components/dashboard/SystemOverviewCard";
import { CommanderHomeHero } from "@/components/commander";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { useDashboardData, fetchAll, type DashboardCritical, type DashboardSecondary } from "@/components/providers/DashboardDataProvider";
import type { BrainMode } from "@/lib/brain-mode";
import type { PoolBudget } from "@/app/actions/energy";
import type { AppMode } from "@/lib/app-mode";
import type { Archetype, EvolutionPhase, ReputationScore } from "@/lib/identity-engine";
import type { MomentumBand } from "@/lib/momentum";
import type { BucketedToday } from "@/lib/today-engine";
import type { XPForecastItem } from "@/app/actions/dcic/xp-forecast";
import type { Quote } from "@/types/database.types";
import { getDayOfYearFromDateString } from "@/lib/utils/timezone";
import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { deriveBrainUI } from "@/lib/brain-ui";
import { DCICStatusCard } from "@/components/dcic/DCICStatusCard";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { toastDashboardFirstMission } from "@/lib/ui/dashboard-first-mission-toast";
import type { MoodLabel } from "@/lib/mood-intervention-config";
import { QuestCampaignDock } from "@/components/quests/QuestCampaignDock";

const DCIC_SUGGESTION_TOAST_KEY = "neurohq-dcic-suggestion-education-toast-v1";

/* Below-fold: ssr: false = load after hydration. */
const cardPlaceholder = (_className: string) => null;
const IdentityBlock = dynamic(() => import("@/components/dashboard/IdentityBlock").then((m) => ({ default: m.IdentityBlock })), { ssr: false, loading: () => cardPlaceholder("glass-card min-h-[140px] animate-pulse rounded-[22px]") });
const MomentumScore = dynamic(() => import("@/components/dashboard/MomentumScore").then((m) => ({ default: m.MomentumScore })), { ssr: false, loading: () => cardPlaceholder("glass-card min-h-[100px] animate-pulse rounded-[22px]") });
const TodayEngineCard = dynamic(() => import("@/components/dashboard/TodayEngineCard").then((m) => ({ default: m.TodayEngineCard })), { ssr: false, loading: () => cardPlaceholder("glass-card min-h-[160px] animate-pulse rounded-[22px]") });
const EnergyBudgetBar = dynamic(() => import("@/components/EnergyBudgetBar").then((m) => ({ default: m.EnergyBudgetBar })), { loading: () => cardPlaceholder("h-3 w-full animate-pulse rounded-full bg-white/10") });
const FocusBlock = dynamic(() => import("@/components/FocusBlock").then((m) => ({ default: m.FocusBlock })), { ssr: false, loading: () => cardPlaceholder("min-h-[80px] animate-pulse rounded-xl bg-white/5") });
const DangerousModulesCard = dynamic(() => import("@/components/dashboard/DangerousModulesCard").then((m) => ({ default: m.DangerousModulesCard })), { ssr: false, loading: () => cardPlaceholder("min-h-[120px] animate-pulse rounded-xl bg-white/5") });

export function DashboardClientShell() {
  const cache = useDashboardData();
  const pendingBudget = usePendingBudgetSnapshot();
  const todayDailyState = useHQStore((s) => s.todayDailyState);
  const todayEnergyBudget = useHQStore((s) => s.todayEnergyBudget);
  const budgetSnapshot = useHQStore((s) => s.budgetSnapshot);
  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const setTodayDailyState = useHQStore((s) => s.setTodayDailyState);
  const setTodayMode = useHQStore((s) => s.setTodayMode);
  const setTodayEnergyBudget = useHQStore((s) => s.setTodayEnergyBudget);
  const [critical, setCritical] = useState<DashboardCritical | null>(() => cache?.critical ?? null);
  const [secondary, setSecondary] = useState<DashboardSecondary | null>(() => cache?.secondary ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDailyForHero, setPendingDailyForHero] = useState<ReturnType<typeof getPendingDailyState>>(null);
  const [trackedNextActionShown, setTrackedNextActionShown] = useState(false);
  const [nextBestDismissed, setNextBestDismissed] = useState(false);
  const [budgetGuardrailOpen, setBudgetGuardrailOpen] = useState(false);
  const [budgetGuardrailPending, startBudgetGuardrailTransition] = useTransition();
  const [budgetGuardrailStatus, setBudgetGuardrailStatus] = useState<string | null>(null);
  const { gameState, status: dcicStatus } = useDCICGameState();
  const dcicMode = gameState?.mode?.current ?? "focus";
  const dcicModeVars = useMemo<CSSProperties>(() => {
    if (dcicMode === "war") {
      return {
        "--mode-rgb": "220, 38, 38",
        "--mode-rgb-deep": "127, 29, 29",
      } as CSSProperties;
    }
    if (dcicMode === "recovery") {
      return {
        "--mode-rgb": "34, 197, 94",
        "--mode-rgb-deep": "22, 101, 52",
      } as CSSProperties;
    }
    if (dcicMode === "overdrive") {
      return {
        "--mode-rgb": "168, 85, 247",
        "--mode-rgb-deep": "91, 33, 182",
      } as CSSProperties;
    }
    return {
      "--mode-rgb": "0, 212, 255",
      "--mode-rgb-deep": "0, 136, 255",
    } as CSSProperties;
  }, [dcicMode]);

  useEffect(() => {
    if (dcicStatus !== "ready" || !gameState?.mode?.suggested) return;
    try {
      if (typeof window === "undefined" || localStorage.getItem(DCIC_SUGGESTION_TOAST_KEY)) return;
      localStorage.setItem(DCIC_SUGGESTION_TOAST_KEY, "1");
      const s = gameState.mode.suggested;
      neuroToast.info(
        s === "war"
          ? "Tip: vandaag suggereert je brain status War-modus (hoge capaciteit). Je kunt dit in je missie-flow activeren — niet verplicht."
          : "Tip: vandaag suggereert je brain status Recovery (bescherming eerst). Tik op ? bij Commander status voor uitleg.",
        { duration: 12_000 }
      );
    } catch {
      // ignore storage
    }
  }, [dcicStatus, gameState?.mode?.suggested]);

  useEffect(() => {
    const fromCache = cache?.critical ?? null;
    if (fromCache) {
      setCritical(fromCache);
      if (cache?.secondary) setSecondary(cache.secondary);
      return;
    }
    // Don't double-fetch: if provider is already loading, show skeleton and wait for its result
    if (cache?.loadingCritical) return;

    // Use provider's preload so there is only one in-flight request; provider updates cache and we sync via effect below
    if (cache?.preloadDashboard) {
      cache.preloadDashboard().catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Load failed");
      });
      return;
    }

    let cancelled = false;
    fetchAll()
      .then(({ critical: c, secondary: s }) => {
        if (!cancelled) {
          setCritical(c);
          setSecondary(s);
          cache?.setDashboardData({ critical: c, secondary: s });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Load failed");
      });
    return () => { cancelled = true; };
  }, [cache?.critical, cache?.loadingCritical, cache?.secondary, cache?.preloadDashboard]);

  useEffect(() => {
    if (!cache) return;
    if (cache.critical) setCritical(cache.critical);
    if (cache.secondary) setSecondary(cache.secondary);
  }, [cache?.critical, cache?.secondary]);

  useEffect(() => {
    if (!critical || !cache) return;
    const t = setTimeout(() => cache.preloadDashboard().catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, [!!critical]);

  useEffect(() => {
    const d = critical?.dateStr;
    if (!d) return;
    setPendingDailyForHero(getPendingDailyState(d));
    const onSaved = () => setPendingDailyForHero(getPendingDailyState(d));
    const onLocalDailyStateUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ date?: string }>).detail;
      if (!detail?.date || detail.date !== d) return;
      setPendingDailyForHero(getPendingDailyState(d));
    };
    window.addEventListener("neurohq-daily-state-saved", onSaved);
    window.addEventListener("neurohq-daily-state-local-updated", onLocalDailyStateUpdated as EventListener);
    return () => {
      window.removeEventListener("neurohq-daily-state-saved", onSaved);
      window.removeEventListener("neurohq-daily-state-local-updated", onLocalDailyStateUpdated as EventListener);
    };
  }, [critical?.dateStr]);

  useEffect(() => {
    if (!critical) return;
    setTodayDate(critical.dateStr);
    setTodayMode(critical.mode);
    if (critical.state) {
      setTodayDailyState(critical.state as Record<string, unknown>);
    }
    if (critical.energyBudget) {
      setTodayEnergyBudget(critical.energyBudget as Record<string, unknown>);
    }
  }, [critical, setTodayDailyState, setTodayDate, setTodayEnergyBudget, setTodayMode]);

  const heroState = useMemo(() => {
    if (
      pendingDailyForHero &&
      pendingDailyForHero.energy != null &&
      pendingDailyForHero.focus != null &&
      pendingDailyForHero.sensory_load != null
    ) {
      return {
        energy: pendingDailyForHero.energy,
        focus: pendingDailyForHero.focus,
        sensory_load: pendingDailyForHero.sensory_load,
      };
    }
    if (todayDailyState) {
      const state = todayDailyState as {
        energy?: number | null;
        focus?: number | null;
        sensory_load?: number | null;
      } | null;
      if (state && state.energy != null && state.focus != null && state.sensory_load != null) {
        return {
          energy: state.energy,
          focus: state.focus,
          sensory_load: state.sensory_load,
        };
      }
    }
    const raw = critical?.state as {
      energy?: number | null;
      focus?: number | null;
      sensory_load?: number | null;
    } | null;
    if (raw && raw.energy != null && raw.focus != null && raw.sensory_load != null) {
      return {
        energy: raw.energy,
        focus: raw.focus,
        sensory_load: raw.sensory_load,
      };
    }
    return null;
  }, [critical?.state, pendingDailyForHero, todayDailyState]);

  if (error) {
    return (
      <main className="container page py-12">
        <p className="text-[var(--text-muted)]">{error === "Unauthorized" ? "Je bent niet ingelogd." : error}</p>
        {error === "Unauthorized" && <Link href="/login" className="text-[var(--accent-focus)] underline mt-2 inline-block">Naar login</Link>}
      </main>
    );
  }

  const isCriticalLoading = !critical && !error;

  const fallbackDateStr = (() => {
    const stored = useHQStore.getState().todayDate;
    if (typeof stored === "string" && /^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;
    return "1970-01-01";
  })();

  const effectiveCritical: DashboardCritical = critical ?? {
    dateStr: fallbackDateStr,
    energyPct: 50,
    focusPct: 50,
    loadPct: 50,
    budgetRemainingCents: null,
    currency: "€",
    xp: { total_xp: 0, level: 0 },
    economy: { discipline_points: 0, focus_credits: 0, momentum_boosters: 0 },
    actionsCount: 0,
    topQuickActions: [],
    missionLabel: "Klaar om te starten",
    singleGoalLabel: null,
    emptyMissionMessage: "Geen taken geladen.",
    emptyMissionHref: "/tasks",
    dailyQuoteText: null,
    dailyQuoteAuthor: null,
    streakAtRisk: false,
    todaysTasks: [],
    timeWindow: "",
    isTimeWindowActive: false,
    energyBudget: {},
    state: null,
    yesterdayState: null,
    mode: "normal" as AppMode,
    carryOverCount: 0,
    copyVariant: undefined,
    accountabilitySettings: undefined,
    learningStreak: 0,
    burnout: false,
  };

  const {
    dateStr,
    energyPct,
    focusPct,
    loadPct,
    budgetRemainingCents,
    currency,
    xp,
    economy,
    missionLabel,
    singleGoalLabel,
    emptyMissionMessage,
    emptyMissionHref,
    dailyQuoteText,
    dailyQuoteAuthor,
    streakAtRisk,
    todaysTasks: todaysTasksFromSnapshot,
    timeWindow,
    isTimeWindowActive,
    energyBudget,
    state,
    yesterdayState,
    mode,
    carryOverCount,
    accountabilitySettings,
    burnout = false,
  } = effectiveCritical;

  // Prefer HQ store for today's tasks whenever the store has data for this date (from bootstrap
  // or from add/move). This ensures added/moved missions show on all cards without full refresh.
  const EMPTY_TASKS: {
    id: string;
    title: string | null;
    carry_over_count?: number;
    completed?: boolean | null;
    completed_at?: string | null;
  }[] = [];
  const storeTasksForToday = useHQStore((s) => (dateStr ? (s.tasksByDate?.[dateStr] as typeof EMPTY_TASKS) : undefined));
  const hasStoreDataForToday = storeTasksForToday !== undefined;
  const activeStoreTasksForToday = (storeTasksForToday ?? EMPTY_TASKS).filter(
    (t) => t.completed !== true && !t.completed_at
  );
  const todaysTasks =
    hasStoreDataForToday
      ? activeStoreTasksForToday.map((t) => ({
          id: t.id,
          title: t.title ?? "Task",
          carryOverCount: (t as { carry_over_count?: number }).carry_over_count ?? 0,
        }))
      : (todaysTasksFromSnapshot ?? []);

  const identity = secondary?.identity;
  const identityEngine = secondary?.identityEngine;
  const momentum = secondary?.momentum;
  const insightState = secondary?.insightState;
  const todayEngine = secondary?.todayEngine;
  const xpForecast = secondary?.xpForecast;
  const strategy = secondary?.strategy;
  const quotesResult = secondary?.quotesResult as (Quote | null)[] | undefined;
  const quoteDay = (secondary?.quoteDay ?? 1) as number;

  const effectiveEnergyBudget = (todayEnergyBudget ?? energyBudget) as Record<string, unknown>;

  const secState = (secondary?.state ?? state) as typeof state;
  const secYesterdayState = (secondary?.yesterdayState ?? yesterdayState) as typeof yesterdayState;
  const secEnergyBudget = (secondary?.energyBudget ?? effectiveEnergyBudget) as Record<string, unknown>;

  const heroEnergyPct = heroState ? Math.round((heroState.energy / 10) * 100) : energyPct;
  const heroFocusPct = heroState ? Math.round((heroState.focus / 10) * 100) : focusPct;
  const heroLoadPct = heroState ? Math.round((heroState.sensory_load / 10) * 100) : loadPct;

  const snapshotBudgetRemainingCents =
    typeof budgetSnapshot?.budgetRemainingCents === "number"
      ? (budgetSnapshot.budgetRemainingCents as number)
      : null;
  const snapshotCurrency =
    typeof budgetSnapshot?.settings === "object" &&
    budgetSnapshot?.settings &&
    typeof (budgetSnapshot.settings as { currency?: unknown }).currency === "string"
      ? ((budgetSnapshot.settings as { currency: string }).currency)
      : null;
  const badgeBudgetRemainingCents =
    pendingBudget?.budgetRemainingCents ?? snapshotBudgetRemainingCents ?? budgetRemainingCents;
  const badgeCurrency = pendingBudget?.currency ?? snapshotCurrency ?? currency;
  const hasBrainCheckIn =
    (state?.energy != null && state?.focus != null) ||
    (secState?.energy != null && secState?.focus != null);
  const hasMissionsToday = (todaysTasks?.length ?? 0) > 0;
  const firstMissionToday = todaysTasks[0] ?? null;
  const openFirstMissionToast = useCallback(() => {
    if (!firstMissionToday) return;
    toastDashboardFirstMission({ id: firstMissionToday.id, title: firstMissionToday.title });
  }, [firstMissionToday?.id, firstMissionToday?.title]);
  const brainUI = deriveBrainUI({
    hasBrainCheckIn,
    hasMissionsToday,
    brainMode: (effectiveEnergyBudget.brainMode as BrainMode | undefined) ?? null,
  });
  const nextBestAction = critical?.unifiedDecision
    ? {
        title: critical.unifiedDecision.title,
        description: critical.unifiedDecision.description,
        href: critical.unifiedDecision.href,
        cta: critical.unifiedDecision.cta,
        confidence: critical.unifiedDecision.confidence,
        horizon: critical.unifiedDecision.horizon,
        reasonCodes: critical.unifiedDecision.reasonCodes,
      }
    : brainUI.nextAction;
  const nextDecisionType = critical?.unifiedDecision?.decisionType ?? "legacy_next_action";
  const nextDecisionId = critical?.unifiedDecision?.decisionId ?? `legacy-${dateStr}`;
  const nextActionDecisionMeta = critical?.unifiedDecision ?? null;

  useEffect(() => {
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(`neurohq-next-best-dismissed-${dateStr}`) === "1") {
        setNextBestDismissed(true);
      }
    } catch {
      // ignore
    }
  }, [dateStr]);

  useEffect(() => {
    if (trackedNextActionShown) return;
    if (!nextBestAction?.title) return;
    setTrackedNextActionShown(true);
    void trackEvent("CTA_shown", {
      context: "dashboard_next_best_action",
      title: nextBestAction.title,
      href: nextBestAction.href,
    });
    void trackEvent("decision_exposed", {
      decisionId: nextDecisionId,
      decisionType: nextDecisionType,
      surface: "dashboard",
      href: nextBestAction.href,
      decisionSource: nextActionDecisionMeta?.source ?? "legacy",
      decisionConfidence: nextActionDecisionMeta?.confidence ?? "unknown",
      decisionHorizon: nextActionDecisionMeta?.horizon ?? "unknown",
      decisionReasonCodes: nextActionDecisionMeta?.reasonCodes ?? [],
      decisionEngineVersion: nextActionDecisionMeta?.engineVersion ?? "legacy",
      decisionRankingMode: nextActionDecisionMeta?.rankingMode ?? "legacy",
      decisionModelVersion: nextActionDecisionMeta?.modelVersion ?? "legacy",
      decisionCandidateCount: nextActionDecisionMeta?.candidateCount ?? 0,
      decisionSelectedScore: nextActionDecisionMeta?.selectedScore ?? -1,
      decisionCandidates: nextActionDecisionMeta?.candidateSnapshot ?? [],
      decisionFeatureSnapshot: nextActionDecisionMeta?.featureSnapshot ?? {},
    });
  }, [
    nextActionDecisionMeta?.confidence,
    nextActionDecisionMeta?.horizon,
    nextActionDecisionMeta?.reasonCodes,
    nextActionDecisionMeta?.source,
    nextBestAction?.href,
    nextBestAction?.title,
    nextDecisionId,
    nextDecisionType,
    trackedNextActionShown,
  ]);

  useEffect(() => {
    if (!critical) return;
    void trackEvent("card_viewed", {
      context: "dashboard_brain_status",
      date: critical.dateStr,
      hasBrainState: critical.state != null,
    });
  }, [critical?.dateStr]);

  useEffect(() => {
    if (!secondary?.todayEngine) return;
    void trackEvent("card_viewed", {
      context: "dashboard_today_engine",
      date: dateStr,
      streakAtRisk: Boolean((secondary.todayEngine as { streakAtRisk?: boolean }).streakAtRisk),
    });
  }, [dateStr, secondary?.todayEngine]);

  /* Hub shell: frosted plane lives on #app-shell (.hq-app-shell); this wrapper is layout only */
  return (
    <div className="relative min-h-0 w-full min-w-0 overflow-x-hidden">
      <div
        className="container page page-wide dashboard-cinematic relative z-10 pb-10"
        style={dcicModeVars}
        data-mode={dcicMode}
      >
            <div className="space-y-3 px-1 pt-2 md:pt-3">
              {dcicMode === "overdrive" && gameState?.mode && (
                <OverdriveBanner
                  lockedUntil={gameState.mode.lockedUntil}
                  overdriveSessionStart={gameState.mode.overdriveSessionStart}
                  autoTriggered={gameState.mode.overdriveAutoTriggered === true}
                  triggerReason={gameState.mode.overdriveTriggerReason ?? null}
                />
              )}
              <DashboardCommandDeckFrame
                deckTitle={
                  <>
                    <span className="block">Dashboard</span>
                    <span className="mt-1 block text-[11px] font-normal leading-snug tracking-normal text-[var(--text-muted)] [text-shadow:none] md:text-xs">
                      System overview
                    </span>
                  </>
                }
                outerClassName="idle-breathing"
                innerClassName="gap-3 [-webkit-overflow-scrolling:touch]"
              >
                <div
                  className="dashboard-command-bridge relative mx-auto w-full max-w-lg"
                  data-tutorial="dashboard-command-bridge"
                >
                  <div className="relative z-0 w-full">
                    <CommanderHomeHero
                      bridgeLayout
                      hideBuiltInTitle
                      energyPct={heroEnergyPct}
                      focusPct={heroFocusPct}
                      loadPct={heroLoadPct}
                      missionHref={firstMissionToday ? "/tasks" : emptyMissionHref}
                      missionLabel={missionLabel}
                      missionCtaAction={firstMissionToday ? openFirstMissionToast : null}
                      exportDate={dateStr}
                      streakAtRisk={streakAtRisk}
                      dailyQuoteText={dailyQuoteText}
                      dailyQuoteAuthor={dailyQuoteAuthor}
                      mainMissionSlot={
                        <DashboardMainMissionTeaser
                          summary={singleGoalLabel ?? firstMissionToday?.title ?? null}
                          emptyMessage={emptyMissionMessage}
                          href={firstMissionToday ? "/tasks" : emptyMissionHref}
                        />
                      }
                      pedestalStats={{
                        totalXP: typeof xp.total_xp === "number" ? xp.total_xp : 0,
                        budgetRemainingCents: badgeBudgetRemainingCents ?? 0,
                        currency: badgeCurrency,
                        energyPct: heroEnergyPct,
                        focusPct: heroFocusPct,
                        loadPct: heroLoadPct,
                      }}
                    />
                  </div>
                  <div className="pointer-events-none absolute right-0 top-[5%] z-30 sm:top-[8%]">
                    <div className="bridge-system-overview-rail pointer-events-auto -translate-x-1 sm:-translate-x-2">
                      <SystemOverviewCard
                        compact
                        sections={[
                      {
                        id: "level",
                        icon: "🧭",
                        title: "Level & voortgang",
                        subtitle: "Identiteit, momentum en progressie",
                        content: (
                          <section className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {identity && identityEngine ? (
                                <>
                                  <IdentityBlock
                                    level={(identity as { level: number }).level}
                                    rank={(identity as { rank: string }).rank}
                                    streak={(identity as { streak: { current: number } }).streak?.current ?? 0}
                                    xpToNextLevel={(identity as { xp_to_next_level: number }).xp_to_next_level}
                                    nextUnlock={((identity as { next_unlock?: { level: number; rank: string; xpNeeded: number } | null }).next_unlock) ?? { level: 0, rank: "-", xpNeeded: 0 }}
                                    archetype={(identityEngine as { archetype: Archetype })?.archetype ?? "operator"}
                                    evolutionPhase={(identityEngine as { evolutionPhase: EvolutionPhase })?.evolutionPhase ?? "initiate"}
                                    reputation={(identityEngine as { reputation?: ReputationScore })?.reputation ?? { discipline: 0, consistency: 0, impact: 0 }}
                                    embedded
                                  />
                                  <MomentumScore
                                    score={((insightState as { momentum?: { score: number } })?.momentum?.score ?? (momentum as { score: number })?.score) ?? 0}
                                    band={(((insightState as { momentum?: { band: string } })?.momentum?.band ?? (momentum as { band: string })?.band) ?? "medium") as MomentumBand}
                                    embedded
                                  />
                                </>
                              ) : (
                                <>
                                  <div className="glass-card min-h-[140px] animate-pulse rounded-[22px]" aria-hidden />
                                  <div className="glass-card min-h-[100px] animate-pulse rounded-[22px]" aria-hidden />
                                </>
                              )}
                            </div>
                          </section>
                        ),
                      },
                      {
                        id: "dcic",
                        icon: "🛰️",
                        title: "Commander status (DCIC)",
                        subtitle: "Mode en command-situatie",
                        content: (
                          <div className="space-y-4">
                            <DCICStatusCard
                              gameState={gameState}
                              status={dcicStatus}
                              brainStateMissing={critical ? critical.state == null : false}
                            />
                          </div>
                        ),
                      },
                      {
                        id: "today",
                        icon: "📌",
                        title: "Vandaag door de app bepaald",
                        subtitle: "Buckets, risico en XP-impact",
                        content: todayEngine != null && xpForecast !== undefined ? (
                          <TodayEngineCard
                            bucketed={(todayEngine as { bucketed: BucketedToday }).bucketed}
                            streakAtRisk={(todayEngine as { streakAtRisk: boolean }).streakAtRisk}
                            date={(todayEngine as { date: string }).date}
                            forecasts={xpForecast as XPForecastItem[]}
                            activeTasks={todaysTasks}
                            emptyMissionMessage={emptyMissionMessage}
                            emptyMissionHref={emptyMissionHref}
                            timeWindow={timeWindow}
                            isTimeWindowActive={isTimeWindowActive}
                          />
                        ) : (
                          <div className="glass-card min-h-[160px] animate-pulse rounded-[22px]" aria-hidden />
                        ),
                      },
                      {
                        id: "system",
                        icon: "🧠",
                        title: "Systeem modus",
                        subtitle: "Brain status & hoe voel je je vandaag",
                        content: (
                          <div className="space-y-6">
                            <BrainStatusCard
                              date={dateStr}
                              initial={{ energy: secState?.energy ?? null, focus: secState?.focus ?? null, sensory_load: secState?.sensory_load ?? null, sleep_hours: secState?.sleep_hours ?? null, social_load: secState?.social_load ?? null, physical_health: (secState as { physical_health?: number | null })?.physical_health ?? null, mental_battery: (secState as { mental_battery?: number | null })?.mental_battery ?? null }}
                              yesterday={{ energy: secYesterdayState?.energy ?? null, focus: secYesterdayState?.focus ?? null, sensory_load: secYesterdayState?.sensory_load ?? null, sleep_hours: secYesterdayState?.sleep_hours ?? null, social_load: secYesterdayState?.social_load ?? null, physical_health: (secYesterdayState as { physical_health?: number | null })?.physical_health ?? null, mental_battery: (secYesterdayState as { mental_battery?: number | null })?.mental_battery ?? null }}
                              brainMode={secEnergyBudget.brainMode as BrainMode}
                              suggestedTaskCount={(secEnergyBudget.suggestedTaskCount as number) ?? 3}
                              moodLabel={((secState as { mood_label?: string | null } | null)?.mood_label as MoodLabel | null) ?? null}
                            />
                            <DangerousModulesCard embedded />
                            <div data-tutorial="dashboard-energy-bar">
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
                            </div>
                            <div data-tutorial="dashboard-context-card">
                              <DashboardContextCard
                                prev={{
                                  quote: secondary && quotesResult ? quotesResult[0] : null,
                                  day: secondary ? Math.max(1, quoteDay - 1) : Math.max(1, Math.min(365, getDayOfYearFromDateString(dateStr) - 1)),
                                }}
                                current={{
                                  quote: (secondary && quotesResult ? quotesResult[1] : null) ?? (dailyQuoteText ? { id: 0, quote_text: dailyQuoteText, author_name: dailyQuoteAuthor ?? "", era: "", topic: null, created_at: "" } : null),
                                  day: secondary ? quoteDay : getDayOfYearFromDateString(dateStr),
                                }}
                                next={{
                                  quote: secondary && quotesResult ? quotesResult[2] : null,
                                  day: secondary ? Math.min(365, quoteDay + 1) : Math.min(365, getDayOfYearFromDateString(dateStr) + 1),
                                }}
                                mode={mode}
                                identityStatement={(strategy as { identity_statement?: string } | null)?.identity_statement ?? null}
                              />
                            </div>
                            {mode === "driven" && <FocusBlock />}
                          </div>
                        ),
                      },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </DashboardCommandDeckFrame>
            </div>

        <Modal
          open={budgetGuardrailOpen}
          onClose={() => setBudgetGuardrailOpen(false)}
          title="Budget guardrail"
          subtitle="Zet eerst een echte guardrail, ga daarna door naar de juiste Budget-cards."
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/35 p-3">
              <p className="text-xs text-[var(--text-muted)]">
                Kies eerst je interventie (24u of 72u lock). Daarna kun je direct door naar lock/nooduitgave of entries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={budgetGuardrailPending}
                onClick={() =>
                  startBudgetGuardrailTransition(async () => {
                    try {
                      const result = await applyBudgetOptimizationLock(1);
                      setBudgetGuardrailStatus(`24u focus-lock actief tot ${result.lockUntil}.`);
                      neuroToast.success("24u focus-lock geactiveerd.");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Kon 24u lock niet activeren.";
                      setBudgetGuardrailStatus(msg);
                      neuroToast.error(msg);
                    }
                  })
                }
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-60"
              >
                {budgetGuardrailPending ? "Bezig..." : "Activeer 24u guardrail"}
              </button>
              <button
                type="button"
                disabled={budgetGuardrailPending}
                onClick={() =>
                  startBudgetGuardrailTransition(async () => {
                    try {
                      const result = await applyBudgetOptimizationLock(3);
                      setBudgetGuardrailStatus(`72u reset-lock actief tot ${result.lockUntil}.`);
                      neuroToast.success("72u reset-lock geactiveerd.");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Kon 72u lock niet activeren.";
                      setBudgetGuardrailStatus(msg);
                      neuroToast.error(msg);
                    }
                  })
                }
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-60"
              >
                {budgetGuardrailPending ? "Bezig..." : "Activeer 72u guardrail"}
              </button>
            </div>
            {budgetGuardrailStatus && (
              <p className="text-xs text-[var(--text-muted)]">{budgetGuardrailStatus}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/budget?tab=execute#entries-frozen"
                onClick={() => setBudgetGuardrailOpen(false)}
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Open Execute → Entries & frozen
              </Link>
              <Link
                href="/budget?tab=lock#budget-lock-control"
                onClick={() => setBudgetGuardrailOpen(false)}
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Open no-spend lock
              </Link>
              <Link
                href="/budget?tab=lock#budget-lock-emergency"
                onClick={() => setBudgetGuardrailOpen(false)}
                className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Open nooduitgave
              </Link>
            </div>
          </div>
        </Modal>
      </div>
      <QuestCampaignDock />
    </div>
  );
}

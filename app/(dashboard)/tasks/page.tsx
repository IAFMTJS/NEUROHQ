import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import {
  getBacklogTasks,
  getCompletedTodayTasks,
  getFutureTasks,
  getRoutineTasksWithSuggestions,
  getSubtasksForTaskIds,
  getTasksForDate,
  getTodaysTasks,
  type TaskListMode,
} from "@/app/actions/tasks";
import { buildBlockedReasonsForTasks } from "@/lib/mission-block-reasons";
import { getMode } from "@/app/actions/mode";
import {
  getDecisionBlocks,
  getEmotionalStateCorrelations,
  getMetaInsights30,
  getRecoveryCampaignNeeded,
  getResistanceIndex,
} from "@/app/actions/missions-performance";
import { getThirtyDayMirror } from "@/app/actions/thirty-day-mirror";
import { getSmartSuggestion } from "@/app/actions/dcic/smart-suggestion";
import { getEnergyCapToday } from "@/app/actions/dcic/energy-cap";
import { getEnergyBudget } from "@/app/actions/energy";
import { getAnalyticsEventsSummaryLast7 } from "@/app/actions/analytics-events";
import { todayDateString, yesterdayDate } from "@/lib/utils/timezone";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getXP, getXPIdentity } from "@/app/actions/xp";
import { getIdentityEngine } from "@/app/actions/identity-engine";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { XPBadge } from "@/components/XPBadge";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { Divider1px } from "@/components/hud-test/Divider1px";
import hudStyles from "@/components/hud-test/hud.module.css";
import { MissionsProvider, TasksTabsShell, TodayMissionsGridFromStore } from "@/components/missions";
import { TasksHeaderChrome } from "@/components/missions/TasksHeaderChrome";
import type { TasksTabId } from "@/components/missions/TasksTabsShell";
import { TasksDailyBootstrap } from "@/components/missions/TasksDailyBootstrap";
import { TasksCalendarAsync } from "./TasksCalendarAsync";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { GrowthMissionsRibbon } from "@/components/growth/GrowthMissionsRibbon";

/** Tasks page must always run on the server so latest data is rendered after refresh. */
export const dynamic = "force-dynamic";

const ModeBanner = nextDynamic(
  () => import("@/components/ModeBanner").then((m) => ({ default: m.ModeBanner })),
  { loading: () => <div className="min-h-[44px]" aria-hidden /> }
);
const EnergyCapBar = nextDynamic(
  () => import("@/components/missions/EnergyCapBar").then((m) => ({ default: m.EnergyCapBar })),
  { loading: () => <div className="h-10 animate-pulse rounded-lg bg-white/5" aria-hidden /> }
);
const SmartSuggestionBanner = nextDynamic(
  () => import("@/components/missions/SmartSuggestionBanner").then((m) => ({ default: m.SmartSuggestionBanner })),
  { loading: () => null }
);
const YesterdayTasksSection = nextDynamic(
  () => import("@/components/YesterdayTasksSection").then((m) => ({ default: m.YesterdayTasksSection })),
  { loading: () => <div className="min-h-[40px] min-w-[160px] animate-pulse rounded-full bg-white/5" aria-hidden /> }
);
const CommanderMissionCard = nextDynamic(
  () => import("@/components/commander").then((m) => ({ default: m.CommanderMissionCard })),
  { loading: () => <div className="min-h-[72px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
/** Imported directly (not dynamic) to avoid HMR breaking server-action refs (Turbopack "module factory not available"). */
import { TaskList } from "@/components/TaskList";
const BacklogAndToekomstTriggers = nextDynamic(
  () => import("@/components/missions/BacklogAndToekomstTriggers").then((m) => ({ default: m.BacklogAndToekomstTriggers })),
  { loading: () => null }
);
const ConsequenceBanner = nextDynamic(
  () => import("@/components/ConsequenceBanner").then((m) => ({ default: m.ConsequenceBanner })),
  { loading: () => null }
);

async function ResistanceIndexBannerAsync() {
  return getResistanceIndex();
}

async function RecoveryCampaignBannerAsync() {
  return getRecoveryCampaignNeeded();
}

async function EmotionalStateCorrelationBannerAsync() {
  return getEmotionalStateCorrelations();
}

async function MetaInsights30BannerAsync() {
  const data = await getMetaInsights30();
  const MetaInsights30Banner = (await import("@/components/missions/MetaInsights30Banner")).MetaInsights30Banner;
  return (
    <MetaInsights30Banner
      biggestSabotagePattern={data.biggestSabotagePattern}
      mostEffectiveType={data.mostEffectiveType}
      comfortzoneScore={data.comfortzoneScore}
      growthPerDomain={data.growthPerDomain}
    />
  );
}

async function ThirtyDayMirrorBannerAsync() {
  const mirror = await getThirtyDayMirror();
  const ThirtyDayMirrorBanner = (await import("@/components/missions/ThirtyDayMirrorBanner")).ThirtyDayMirrorBanner;
  return <ThirtyDayMirrorBanner mirror={mirror} />;
}

async function WeeklyBehaviorSummaryCardAsync() {
  const rows = await getAnalyticsEventsSummaryLast7();
  const getCount = (eventName: string) => rows.find((r) => r.event_name === eventName)?.count ?? 0;
  const started = getCount("mission_started");
  const completed = getCount("mission_completed");
  const skipped = getCount("mission_skipped");
  const aborted = getCount("mission_aborted");
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-4 text-sm" aria-label="Weekly behavior summary">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Weekly behavior summary</h3>
      <ul className="mt-2 space-y-1 text-[var(--text-primary)]">
        <li><span className="text-[var(--text-muted)]">Started: </span>{started}</li>
        <li><span className="text-[var(--text-muted)]">Completed: </span>{completed}</li>
        <li><span className="text-[var(--text-muted)]">Completion rate: </span>{completionRate}%</li>
        <li><span className="text-[var(--text-muted)]">Skipped: </span>{skipped}</li>
        <li><span className="text-[var(--text-muted)]">Aborted: </span>{aborted}</li>
      </ul>
    </section>
  );
}

type Props = {
  searchParams: Promise<{ tab?: string; add?: string; month?: string; day?: string; calView?: string; growth?: string }>;
};

type CalendarView = "today" | "calendar" | "routines" | "overdue";

function isValidDayKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidMonthKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

function isValidCalendarView(value: string | undefined): value is CalendarView {
  return value === "today" || value === "calendar" || value === "routines" || value === "overdue";
}

function makeTasksHref(
  params: { add?: string; month?: string; day?: string | null; calView?: CalendarView },
  activeTab: TasksTabId,
  overrides: { tab?: TasksTabId; day?: string | null; month?: string; calView?: CalendarView }
) {
  const search = new URLSearchParams();
  const nextTab = overrides.tab ?? activeTab;
  const nextMonth = overrides.month ?? params.month;
  const nextDay = overrides.day ?? params.day ?? undefined;
  const nextCalView = overrides.calView ?? params.calView ?? "calendar";
  search.set("tab", nextTab);
  if (params.add) search.set("add", params.add);
  if (nextMonth) search.set("month", nextMonth);
  if (nextDay) search.set("day", nextDay);
  search.set("calView", nextCalView);
  const query = search.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

async function TasksHeaderMetaAsync({ dateStr, yesterdayStr }: { dateStr: string; yesterdayStr: string }) {
  const [xp, yesterdayTasksRaw] = await Promise.all([
    getXP(),
    getTasksForDate(yesterdayStr),
  ]);
  const yesterdayTasks = (yesterdayTasksRaw ?? []).map((t) => ({
    id: (t as { id: string }).id,
    title: (t as { title: string | null }).title ?? null,
    completed: !!(t as { completed?: boolean }).completed,
  }));

  return (
    <div className="mascot-follow-row flex flex-wrap items-center justify-end gap-2">
      <YesterdayTasksSection yesterdayTasks={yesterdayTasks} todayStr={dateStr} />
      <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
      <div className="glow-pill inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full bg-[var(--dc-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--dc-text-main)]" title="Vandaag" aria-label="Vandaag">
        <span
          className="h-2 w-2 shrink-0 rounded-full bg-[var(--dc-accent-primary)] shadow-[0_0_8px_rgba(var(--mode-rgb),0.6)]"
          aria-hidden
        />
        <span className="truncate">Today</span>
      </div>
    </div>
  );
}

async function MissionsSectionAsync({
  dateStr,
  backlog,
  growthFromGrowthPage = false,
}: {
  dateStr: string;
  backlog: Awaited<ReturnType<typeof getBacklogTasks>>;
  growthFromGrowthPage?: boolean;
}) {
  const [
    mode,
    futureTasks,
    completedToday,
    smartSuggestion,
    energyCap,
    energyBudget,
    decisionBlocks,
    identity,
    identityEngine,
    tasksNormalResult,
    resistanceIndex,
    recoveryCampaign,
    emotionalCorrelation,
    growthSnap,
  ] = await Promise.all([
    getMode(dateStr),
    getFutureTasks(dateStr),
    getCompletedTodayTasks(dateStr),
    getSmartSuggestion(dateStr),
    getEnergyCapToday(dateStr),
    getEnergyBudget(dateStr),
    getDecisionBlocks(dateStr),
    getXPIdentity(),
    getIdentityEngine(),
    getTodaysTasks(dateStr, "normal"),
    ResistanceIndexBannerAsync(),
    RecoveryCampaignBannerAsync(),
    EmotionalStateCorrelationBannerAsync(),
    getGrowthEngineSnapshot(),
  ]);

  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks: tasksNormal, carryOverCount } = tasksNormalResult;
  const umsOrder = new Map(decisionBlocks.tasksSortedByUMS.map((t, i) => [t.id, i]));
  const tasks = [...tasksNormal].sort((a, b) => (umsOrder.get(a.id) ?? 999) - (umsOrder.get(b.id) ?? 999));
  const blockedReasonByTaskId = buildBlockedReasonsForTasks(tasks as import("@/types/database.types").Task[], {
    taskMode,
    recoveryOnly: !!decisionBlocks.recoveryOnly,
  });

  const subtaskRows = await getSubtasksForTaskIds(tasks.map((t) => t.id));
  const subtasksByParent: Record<string, typeof subtaskRows> = {};
  for (const s of subtaskRows) {
    const pid = s.parent_task_id;
    if (!subtasksByParent[pid]) subtasksByParent[pid] = [];
    subtasksByParent[pid].push(s);
  }

  const firstUnblockedIndex = decisionBlocks.tasksSortedByUMS.findIndex((t) => !blockedReasonByTaskId[t.id]);
  const missionCardsFromUMS = decisionBlocks.tasksSortedByUMS.slice(0, 8).map((t, i) => {
    const blocked = !!blockedReasonByTaskId[t.id];
    const isActive =
      !blocked && firstUnblockedIndex !== -1 && i === firstUnblockedIndex;
    return {
      id: t.id,
      title: t.title ?? "Task",
      subtitle: blocked
        ? "Geblokkeerd"
        : isActive
          ? "Aanbevolen"
          : `UMS ${Math.round(t.umsBreakdown.ums * 100)}%`,
      description: (t as { notes?: string | null }).notes ?? null,
      state: (blocked ? "locked" : isActive ? "active" : "locked") as "active" | "locked",
      progressPct: 0,
      href: blocked ? undefined : "/tasks",
    };
  });
  const missionCardsCompleted = (completedToday as { id: string; title: string | null }[]).slice(0, 4).map((t) => ({
    id: t.id,
    title: t.title ?? "Done",
    subtitle: "Completed",
    state: "completed" as const,
    progressPct: 100,
    href: undefined as string | undefined,
  }));
  const { getMissionDifficultyRank } = await import("@/lib/mission-difficulty-rank");
  const strategicByTaskId: Record<
    string,
    {
      domain?: string | null;
      alignmentImpactPct?: number;
      expectedXP?: number;
      disciplineImpact?: number;
      roi?: number;
      pressureEffect?: string;
      strategicValue?: number;
      psychologyLabel?: string | null;
      energyMatch?: number;
      difficultyRank?: "S" | "A" | "B" | "C" | "D";
    }
  > = {};
  for (const t of decisionBlocks.tasksSortedByUMS) {
    const impact = (t as { impact?: number | null }).impact ?? 2;
    strategicByTaskId[t.id] = {
      domain: t.domain ?? null,
      alignmentImpactPct: Math.round((t.umsBreakdown.strategyAlignment - 0.5) * 100),
      expectedXP: Math.max(10, Math.min(100, impact * 35)) || 50,
      disciplineImpact: t.discipline_weight ?? 0.5,
      roi: Math.round(t.umsBreakdown.roi * 100),
      pressureEffect: decisionBlocks.pressureZone === "risk" ? "Hoog — deadline druk" : decisionBlocks.pressureZone === "healthy" ? "Matig" : "Laag",
      strategicValue: t.strategic_value ?? t.umsBreakdown.strategyAlignment,
      psychologyLabel: t.psychology_label ?? null,
      energyMatch: t.umsBreakdown.energyMatch,
      difficultyRank: getMissionDifficultyRank(t.umsBreakdown.ums),
    };
  }

  const missionCardsBase =
    missionCardsFromUMS.length > 0
      ? [...missionCardsFromUMS, ...missionCardsCompleted]
      : [
          ...tasks.slice(0, 8).map((t, i) => ({
            id: (t as { id: string }).id,
            title: (t as { title: string }).title ?? "Task",
            subtitle: i === 0 ? "Active" : undefined,
            description: (t as { notes?: string | null }).notes ?? null,
            state: (i === 0 ? "active" : "locked") as "active" | "locked",
            progressPct: 0,
            href: "/tasks",
          })),
          ...missionCardsCompleted,
        ];

  const seenMissionIds = new Set<string>();
  const missionCards = missionCardsBase.filter((card) => {
    if (!card.id || seenMissionIds.has(card.id)) return false;
    seenMissionIds.add(card.id);
    return true;
  });

  return (
    <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      <GrowthMissionsRibbon snap={growthSnap} fromGrowthPage={growthFromGrowthPage} />
      <ModeBanner mode={mode} />
      <EnergyCapBar used={energyCap.used} cap={energyCap.cap} remaining={energyCap.remaining} planned={energyCap.planned} />
      <ConsequenceBanner
        energyDepleted={(energyBudget as { consequence?: { energyDepleted?: boolean } }).consequence?.energyDepleted}
        recoveryOnly={decisionBlocks.recoveryOnly}
        recoveryProtocol={decisionBlocks.recoveryProtocol}
        daysSinceLastCompletion={decisionBlocks.daysSinceLastCompletion}
      />
      <section className="space-y-2" aria-label="Command center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Your next move</p>
        <div className="rounded-2xl border border-[var(--accent-focus)]/40 bg-[var(--bg-surface)]/35 p-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {decisionBlocks.topRecommendation?.title ?? "Selecteer je volgende missie"}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {decisionBlocks.topRecommendation
              ? `Must-do omdat deze missie vandaag de beste match heeft op strategie, energie en impact (UMS ${Math.round(
                  decisionBlocks.topRecommendation.umsBreakdown.ums * 100
                )}%).`
              : "Geen harde must-do gevonden, start met een korte missie om momentum op te bouwen."}
          </p>
          {(decisionBlocks.alignmentFix.length > 0 || decisionBlocks.recovery.length > 0) && (
            <ul className="mt-3 space-y-1 text-xs text-[var(--text-secondary)]">
              {decisionBlocks.alignmentFix.slice(0, 2).map((task) => (
                <li key={`align-${task.id}`}>Alignment suggestie: {(task.title ?? "Taak")}</li>
              ))}
              {decisionBlocks.recovery.slice(0, 1).map((task) => (
                <li key={`recovery-${task.id}`}>Recovery suggestie: {(task.title ?? "Taak")}</li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Link
              href="/tasks#tasks-list"
              className="inline-flex items-center justify-center rounded-full bg-[var(--accent-focus)] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white hover:opacity-90"
            >
              Start
            </Link>
          </div>
        </div>
      </section>
      <details className="tasks-war-hide rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Diagnostics</summary>
        <div className="mt-3 space-y-3">
          {resistanceIndex.message && <p className="text-sm text-[var(--text-primary)]">{resistanceIndex.message}</p>}
          {recoveryCampaign.needed && (
            <p className="text-sm text-[var(--text-primary)]">
              Recovery-campagne actief: {recoveryCampaign.daysInactive} dagen zonder completion.
            </p>
          )}
          {emotionalCorrelation.message && <p className="text-sm text-[var(--text-primary)]">{emotionalCorrelation.message}</p>}
          {!resistanceIndex.message && !recoveryCampaign.needed && !emotionalCorrelation.message && (
            <p className="text-sm text-[var(--text-muted)]">
              Nog geen diagnostische signalen beschikbaar. Voltooi en log enkele missies om patroonanalyse te activeren.
            </p>
          )}
        </div>
      </details>
      {smartSuggestion.text && !decisionBlocks.topRecommendation ? (
        <SmartSuggestionBanner text={smartSuggestion.text} type={smartSuggestion.type} />
      ) : null}
      <div data-tutorial="tasks-today" className="tasks-war-hide">
      <TodayMissionsGridFromStore dateStr={dateStr}>
        {missionCards.length > 0 && tasks.length === 0 && (
          <section className="mission-grid">
            {missionCards.map((m) => (
              <CommanderMissionCard
                key={m.id}
                id={m.id}
                title={m.title}
                subtitle={m.subtitle}
                description={"description" in m ? (m as { description?: string | null }).description : null}
                state={m.state}
                progressPct={m.progressPct}
                href={m.href}
              />
            ))}
          </section>
        )}
      </TodayMissionsGridFromStore>
      <div data-tutorial="tasks-list" id="tasks-list">
      <TaskList
        date={dateStr}
        tasks={tasks as import("@/types/database.types").Task[]}
        completedToday={completedToday as import("@/types/database.types").Task[]}
        mode={taskMode}
        carryOverCount={carryOverCount}
        subtasksByParent={subtasksByParent}
        suggestedTaskCount={energyBudget.suggestedTaskCount}
        brainMode={energyBudget.brainMode}
        strategicByTaskId={strategicByTaskId}
        strategyMapping={decisionBlocks.strategyMapping}
        recommendedTaskIds={[
          ...(decisionBlocks.topRecommendation?.id ? [decisionBlocks.topRecommendation.id] : []),
          ...(decisionBlocks.alignmentFix?.map((t) => t.id) ?? []),
        ]}
        identityLevel={identity.level}
        identityReputation={identityEngine.reputation ?? null}
        blockedReasonByTaskId={blockedReasonByTaskId}
      />
      </div>
      </div>
      <details className="tasks-war-hide rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Meta (30d), Data-spiegel (30d), Weekly behavior summary
        </summary>
        <div className="mt-3 space-y-3">
          <Suspense fallback={null}>
            <MetaInsights30BannerAsync />
          </Suspense>
          <Suspense fallback={null}>
            <ThirtyDayMirrorBannerAsync />
          </Suspense>
          <Suspense fallback={null}>
            <WeeklyBehaviorSummaryCardAsync />
          </Suspense>
        </div>
      </details>
      <div className="tasks-war-hide">
        <BacklogAndToekomstTriggers backlog={backlog} futureTasks={futureTasks} todayDate={dateStr} />
      </div>
    </SciFiPanel>
  );
}

async function CalendarSectionAsync({
  dateStr,
  monthParam,
  selectedCalendarDay,
  calendarView,
  backlog,
}: {
  dateStr: string;
  monthParam: string;
  selectedCalendarDay: string;
  calendarView: CalendarView;
  backlog: Awaited<ReturnType<typeof getBacklogTasks>>;
}) {
  return (
    <TasksCalendarAsync
      dateStr={dateStr}
      monthParam={monthParam}
      selectedCalendarDay={selectedCalendarDay}
      calendarView={calendarView}
      backlog={(backlog ?? []) as { id: string; title: string | null; due_date: string | null }[]}
    />
  );
}

async function RoutineSectionAsync({ dateStr }: { dateStr: string }) {
  const { routineTasks, suggestedDays, suggestedPlans } = await getRoutineTasksWithSuggestions(dateStr);
  const RoutineTaskList = (await import("@/components/missions/RoutineTaskList")).RoutineTaskList;
  return (
    <RoutineTaskList
      routineTasks={routineTasks}
      suggestedDays={suggestedDays}
      suggestedPlans={suggestedPlans}
      dateStr={dateStr}
    />
  );
}

export default async function TasksPage({ searchParams }: Props) {
  const dateStr = todayDateString();
  const yesterdayStr = yesterdayDate(dateStr);
  const params = await searchParams;
  const growthFromGrowthPage = params.growth === "1";
  const tabParam = params.tab;
  const activeTab: TasksTabId =
    tabParam === "routine" ? "routine" : tabParam === "calendar" ? "calendar" : "missions";
  const calendarView: CalendarView = isValidCalendarView(params.calView) ? params.calView : "calendar";
  const monthParam = isValidMonthKey(params.month) ? params.month : dateStr.slice(0, 7);
  const dayParam = isValidDayKey(params.day) ? params.day : null;
  const selectedCalendarDay = dayParam ?? dateStr;
  const [prefs, backlog] = await Promise.all([
    getUserPreferencesOrDefaults(),
    getBacklogTasks(dateStr),
  ]);

  const missionsHref = makeTasksHref(
    { add: params.add, month: monthParam, day: dayParam, calView: calendarView },
    activeTab,
    { tab: "missions" }
  );
  const calendarHref = makeTasksHref(
    { add: params.add, month: monthParam, day: dayParam, calView: calendarView },
    activeTab,
    { tab: "calendar" }
  );
  const routineHref = makeTasksHref(
    { add: params.add, month: monthParam, day: dayParam, calView: calendarView },
    activeTab,
    { tab: "routine" }
  );
  const skipCinematicLayers = prefs.light_ui === true;

  const headerSection = (
    <>
      <TasksHeaderChrome dateStr={dateStr} />
      <section className="mascot-hero mascot-hero-top mascot-hero-mission mascot-hero-sharp" data-mascot-page="tasks" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="tasks" className="mascot-img" heroLarge />
        </div>
      </section>
      <Suspense fallback={null}>
        <TasksHeaderMetaAsync dateStr={dateStr} yesterdayStr={yesterdayStr} />
      </Suspense>
      <Divider1px />
    </>
  );

  return (
    <main className={`relative min-h-screen overflow-hidden ${!skipCinematicLayers ? hudStyles.cinematicBackdrop : ""}`}>
      {!skipCinematicLayers && (
        <>
          <div className={hudStyles.spaceMist} aria-hidden />
          <div className={hudStyles.starLayerFar} aria-hidden />
          <div className={hudStyles.starLayerNear} aria-hidden />
          <div className={hudStyles.backgroundAtmosphere} aria-hidden />
          <div className={hudStyles.colorBlend} aria-hidden />
          <div className={hudStyles.spaceNoise} aria-hidden />
        </>
      )}
      <MissionsProvider dateStr={dateStr}>
        <TasksDailyBootstrap dateStr={dateStr} enabled={activeTab === "missions"} />
        <div className="container page page-wide dashboard-cinematic relative z-10">
          <TasksTabsShell initialTab={activeTab} missionsHref={missionsHref} calendarHref={calendarHref} routineHref={routineHref} header={headerSection}>
            {activeTab === "missions" ? (
              <Suspense fallback={null}>
                <MissionsSectionAsync dateStr={dateStr} backlog={backlog} growthFromGrowthPage={growthFromGrowthPage} />
              </Suspense>
            ) : activeTab === "calendar" ? (
              <Suspense fallback={null}>
                <CalendarSectionAsync
                  dateStr={dateStr}
                  monthParam={monthParam}
                  selectedCalendarDay={selectedCalendarDay}
                  calendarView={calendarView}
                  backlog={backlog}
                />
              </Suspense>
            ) : (
              <Suspense fallback={null}>
                <RoutineSectionAsync dateStr={dateStr} />
              </Suspense>
            )}
          </TasksTabsShell>
        </div>
      </MissionsProvider>
    </main>
  );
}

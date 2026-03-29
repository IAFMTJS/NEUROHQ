import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import Link from "next/link";
import {
  getBacklogTasks,
  getCompletedTodayTasks,
  getFutureTasks,
  getRoutineTasksWithSuggestions,
  getSubtasksForTaskIds,
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
import { todayDateString } from "@/lib/utils/timezone";
import { getXPIdentity } from "@/app/actions/xp";
import { getIdentityEngine } from "@/app/actions/identity-engine";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import hudStyles from "@/components/hud-test/hud.module.css";
import { MissionsProvider, TasksTabsShell, TodayMissionsGridFromStore } from "@/components/missions";
import type { TasksTabId } from "@/components/missions/TasksTabsShell";
import { TasksDailyBootstrap } from "@/components/missions/TasksDailyBootstrap";
import { TasksCalendarAsync } from "./TasksCalendarAsync";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { GrowthMissionsRibbon } from "@/components/growth/GrowthMissionsRibbon";
import { profileEngineHref } from "@/lib/profile-routes";
/** Tasks page must always run on the server so latest data is rendered after refresh. */
export const dynamic = "force-dynamic";

const ModeBanner = nextDynamic(
  () => import("@/components/ModeBanner").then((m) => ({ default: m.ModeBanner })),
  { loading: () => <div className="min-h-[44px]" aria-hidden /> }
);
const SmartSuggestionBanner = nextDynamic(
  () => import("@/components/missions/SmartSuggestionBanner").then((m) => ({ default: m.SmartSuggestionBanner })),
  { loading: () => null }
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
  const deleted = getCount("mission_deleted");
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
        <li><span className="text-[var(--text-muted)]">Deleted: </span>{deleted}</li>
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

async function MissionsSectionAsync({
  dateStr,
  backlog,
  growthFromGrowthPage = false,
  simplifiedContent = false,
  commandDeck = false,
}: {
  dateStr: string;
  backlog: Awaited<ReturnType<typeof getBacklogTasks>>;
  growthFromGrowthPage?: boolean;
  simplifiedContent?: boolean;
  /** Outer SciFiPanel omitted — content sits in TasksTabsShell command deck. */
  commandDeck?: boolean;
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
    behaviorProfile,
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
    getBehaviorProfile(),
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
      : tasksNormal.length > 0
        ? [
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
          ]
        : [];

  const seenMissionIds = new Set<string>();
  const missionCards = missionCardsBase.filter((card) => {
    if (!card.id || seenMissionIds.has(card.id)) return false;
    seenMissionIds.add(card.id);
    return true;
  });

  const missionEngineWarnings = {
    energyDepleted: (energyBudget as { consequence?: { energyDepleted?: boolean } }).consequence?.energyDepleted,
    recoveryOnly: decisionBlocks.recoveryOnly,
    recoveryProtocol: decisionBlocks.recoveryProtocol,
    daysSinceLastCompletion: decisionBlocks.daysSinceLastCompletion,
  };

  if (simplifiedContent) {
    return (
      <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
        <SciFiPanel
          flatFrame
          variant="command"
          className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
          bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5 md:p-6"
        >
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <div className="flex shrink-0 justify-end">
            <Link
              href="/dashboard"
              className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
            >
              HQ
            </Link>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-1"
            data-tutorial="tasks-list"
            id="tasks-list"
          >
            <TodayMissionsGridFromStore dateStr={dateStr}>
              {!commandDeck && missionCards.length > 0 && tasks.length === 0 && (
                <section className="mission-grid mb-3">
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
              blockedReasonByTaskId={blockedReasonByTaskId as Record<string, string>}
              neuroSelfReportOptIn={behaviorProfile.neuroSelfReportOptIn}
              missionsHeroLayout
              commandDeckVisuals
              energyCap={{
                used: energyCap.used,
                cap: energyCap.cap,
                remaining: energyCap.remaining,
                planned: energyCap.planned,
              }}
              missionEngineWarnings={missionEngineWarnings}
              missionsContextBelowHero={null}
            />
          </div>
          <p className="shrink-0 pt-1 text-center text-[11px] text-[var(--text-muted)]">
            <Link href="/tasks?tab=calendar" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Calendar, routine &amp; backlog
            </Link>
            {" · "}
            <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Turn off simplified
            </Link>
          </p>
          <p className="pb-0.5 text-center text-xs text-[var(--text-muted)]">All systems active</p>
        </SciFiPanel>
      </div>
    );
  }

  const diagnosticsBlock = (
    <details
      className={
        commandDeck
          ? "tasks-war-hide rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] p-3"
          : "tasks-war-hide rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 p-3"
      }
    >
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
  );

  const smartSuggestionBlock =
    smartSuggestion.text && !decisionBlocks.topRecommendation ? (
      <SmartSuggestionBanner text={smartSuggestion.text} type={smartSuggestion.type} />
    ) : null;
  const smartSuggestionDeck =
    commandDeck && smartSuggestionBlock ? (
      <div className="card-simple !rounded-xl border border-[rgba(var(--mode-rgb),0.1)] p-3">{smartSuggestionBlock}</div>
    ) : (
      smartSuggestionBlock
    );

  const tasksTodayBlock = (
    <div data-tutorial="tasks-today">
      <div className="tasks-war-hide">
        <TodayMissionsGridFromStore dateStr={dateStr}>
          {!commandDeck && missionCards.length > 0 && tasks.length === 0 && (
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
      </div>
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
          neuroSelfReportOptIn={behaviorProfile.neuroSelfReportOptIn}
          missionsHeroLayout
          commandDeckVisuals
          energyCap={{
            used: energyCap.used,
            cap: energyCap.cap,
            remaining: energyCap.remaining,
            planned: energyCap.planned,
          }}
          missionEngineWarnings={missionEngineWarnings}
          missionsContextBelowHero={<ModeBanner mode={mode} flatFrame />}
        />
      </div>
    </div>
  );

  const metaBlock = (
    <details
      className={
        commandDeck
          ? "tasks-war-hide mt-0 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] p-3"
          : "tasks-war-hide mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/35 p-3"
      }
    >
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
  );

  const backlogBlock = commandDeck ? (
    <div className="tasks-war-hide card-simple !rounded-xl border border-[rgba(var(--mode-rgb),0.1)] p-4">
      <BacklogAndToekomstTriggers backlog={backlog} futureTasks={futureTasks} todayDate={dateStr} />
    </div>
  ) : (
    <div className="tasks-war-hide">
      <BacklogAndToekomstTriggers backlog={backlog} futureTasks={futureTasks} todayDate={dateStr} />
    </div>
  );

  /** Command deck: hero-first flow like visual-lab missions concept (ribbon + diagnostics after main stack). */
  const missionsBody = commandDeck ? (
    <>
      {smartSuggestionDeck}
      {tasksTodayBlock}
      {growthSnap ? (
        <div className="card-simple !rounded-xl border border-[rgba(var(--mode-rgb),0.1)] p-3">
          <GrowthMissionsRibbon
            snap={growthSnap}
            fromGrowthPage={growthFromGrowthPage}
            className="mb-0"
          />
        </div>
      ) : null}
      {diagnosticsBlock}
      {metaBlock}
      {backlogBlock}
    </>
  ) : (
    <>
      <GrowthMissionsRibbon snap={growthSnap} fromGrowthPage={growthFromGrowthPage} />
      {diagnosticsBlock}
      {smartSuggestionBlock}
      {tasksTodayBlock}
      {metaBlock}
      {backlogBlock}
    </>
  );

  if (commandDeck) {
    return <div className="space-y-6">{missionsBody}</div>;
  }

  return (
    <SciFiPanel flatFrame variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      {missionsBody}
    </SciFiPanel>
  );
}

async function CalendarSectionAsync({
  dateStr,
  monthParam,
  selectedCalendarDay,
  calendarView,
  backlog,
  simplifiedContent = false,
  commandDeck = false,
}: {
  dateStr: string;
  monthParam: string;
  selectedCalendarDay: string;
  calendarView: CalendarView;
  backlog: Awaited<ReturnType<typeof getBacklogTasks>>;
  simplifiedContent?: boolean;
  commandDeck?: boolean;
}) {
  return (
    <TasksCalendarAsync
      dateStr={dateStr}
      monthParam={monthParam}
      selectedCalendarDay={selectedCalendarDay}
      calendarView={calendarView}
      backlog={(backlog ?? []) as { id: string; title: string | null; due_date: string | null }[]}
      simplifiedContent={simplifiedContent}
      commandDeck={commandDeck}
    />
  );
}

async function RoutineSectionAsync({
  dateStr,
  simplifiedContent = false,
  commandDeck = false,
}: {
  dateStr: string;
  simplifiedContent?: boolean;
  commandDeck?: boolean;
}) {
  const { routineTasks, suggestedDays, suggestedPlans } = await getRoutineTasksWithSuggestions(dateStr);
  const RoutineTaskList = (await import("@/components/missions/RoutineTaskList")).RoutineTaskList;

  if (simplifiedContent) {
    return (
      <div className="flex min-h-0 w-full max-w-none flex-1 flex-col">
        <SciFiPanel
          flatFrame
          variant="command"
          className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
          bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-0 p-0"
        >
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--card-border)]/40 px-4 py-3">
            <h2 className="hq-h2 min-w-0 flex-1 text-[var(--text-primary)]">Routines</h2>
            <Link
              href="/dashboard"
              className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
            >
              HQ
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 [-webkit-overflow-scrolling:touch]">
            <RoutineTaskList
              routineTasks={routineTasks}
              suggestedDays={suggestedDays}
              suggestedPlans={suggestedPlans}
              dateStr={dateStr}
              simplifiedLayout
            />
          </div>
          <p className="shrink-0 border-t border-[var(--card-border)]/40 px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
            <Link href="/tasks?tab=missions" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Missions
            </Link>
            {" · "}
            <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
              Turn off simplified
            </Link>
          </p>
        </SciFiPanel>
      </div>
    );
  }

  return (
    <RoutineTaskList
      routineTasks={routineTasks}
      suggestedDays={suggestedDays}
      suggestedPlans={suggestedPlans}
      dateStr={dateStr}
      commandDeckVisuals={commandDeck && !simplifiedContent}
    />
  );
}

export default async function TasksPage({ searchParams }: Props) {
  const dateStr = todayDateString();
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
  /** Simplified mode: full-height tab column (tabs still show; inner missions may use SciFiPanel). */
  const simplifiedTasksFillLayout = prefs.simplified_content === true;
  /**
   * Frosted command deck around tabs + tab bodies when not in simplified mode.
   * Note: `commandDeckVisuals` on TaskList is independent — see MissionsSectionAsync — so missions
   * still get visual-lab styling when simplified content is ON (only the outer deck shell is off).
   */
  const tasksCommandDeck = !simplifiedTasksFillLayout;

  /**
   * Missions UI matches visual-lab command deck: no separate HQ header, mascot, or meta strip —
   * the deck (TasksTabsShell) is the single chrome surface.
   */
  const headerSection = null;

  return (
    <main
      className={`tasks-page-root relative isolate overflow-x-hidden ${simplifiedTasksFillLayout ? "flex min-h-0 flex-1 flex-col" : "min-h-screen min-h-[100dvh]"}`}
    >
      <MissionsProvider dateStr={dateStr}>
        <TasksDailyBootstrap dateStr={dateStr} enabled={activeTab === "missions"} />
        <div
          className={
            simplifiedTasksFillLayout
              ? "relative z-10 flex min-h-[calc(100svh-7rem)] w-full max-w-none flex-1 flex-col dashboard-cinematic sm:min-h-[calc(100svh-6.5rem)]"
              : "container page page-wide dashboard-cinematic relative z-10 pt-4 sm:pt-5"
          }
        >
          <TasksTabsShell
            initialTab={activeTab}
            missionsHref={missionsHref}
            calendarHref={calendarHref}
            routineHref={routineHref}
            header={headerSection}
            fillViewport={simplifiedTasksFillLayout}
            stickyTabs={simplifiedTasksFillLayout}
            commandDeck={tasksCommandDeck}
          >
            {activeTab === "missions" ? (
              <Suspense fallback={null}>
                <MissionsSectionAsync
                  dateStr={dateStr}
                  backlog={backlog}
                  growthFromGrowthPage={growthFromGrowthPage}
                  simplifiedContent={prefs.simplified_content === true}
                  commandDeck={tasksCommandDeck}
                />
              </Suspense>
            ) : activeTab === "calendar" ? (
              <Suspense fallback={null}>
                <CalendarSectionAsync
                  dateStr={dateStr}
                  monthParam={monthParam}
                  selectedCalendarDay={selectedCalendarDay}
                  calendarView={calendarView}
                  backlog={backlog}
                  simplifiedContent={prefs.simplified_content === true}
                  commandDeck={tasksCommandDeck}
                />
              </Suspense>
            ) : (
              <Suspense fallback={null}>
                <RoutineSectionAsync
                  dateStr={dateStr}
                  simplifiedContent={prefs.simplified_content === true}
                  commandDeck={tasksCommandDeck}
                />
              </Suspense>
            )}
          </TasksTabsShell>
        </div>
      </MissionsProvider>
    </main>
  );
}

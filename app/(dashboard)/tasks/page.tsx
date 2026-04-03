import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import {
  getBacklogTasks,
  getCompletedTodayTasks,
  getRoutineTasksWithSuggestions,
  getSubtasksForTaskIds,
  getTodaysTasks,
} from "@/app/actions/tasks";
import type { TaskListMode } from "@/lib/tasks-actions-shared";
import { getCalendarTabData } from "@/app/actions/calendar-tab-data";
import { buildBlockedReasonsForTasks } from "@/lib/mission-block-reasons";
import { getMode } from "@/app/actions/mode";
import {
  getEmotionalStateCorrelations,
  getRecoveryCampaignNeeded,
  getResistanceIndex,
} from "@/app/actions/missions-performance";
import { loadMissionsPipeline } from "@/lib/missions/load-missions-pipeline";
import { getSmartSuggestion } from "@/app/actions/dcic/smart-suggestion";
import { getEnergyCapToday } from "@/app/actions/dcic/energy-cap";
import { getEnergyBudget } from "@/app/actions/energy";
import { todayDateString } from "@/lib/utils/timezone";
import { getXPIdentity } from "@/app/actions/xp";
import { getIdentityEngine } from "@/app/actions/identity-engine";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { MissionsProvider, TasksTabsShell, TodayMissionsGridFromStore } from "@/components/missions";
import type { TasksTabId } from "@/components/missions/TasksTabsShell";
import { TasksMissionsSnapshotFallback } from "@/components/missions/TasksMissionsSnapshotFallback";
import { RoutineTaskList } from "@/components/missions/RoutineTaskList";
import { TasksRoutineTabFallback } from "@/components/missions/TasksRoutineTabFallback";
import { TasksCalendarTabFallback } from "@/components/missions/TasksCalendarTabFallback";
import { TasksCalendarSection } from "@/components/missions";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { GrowthMissionsRibbon } from "@/components/growth/GrowthMissionsRibbon";
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
/** Imported directly (not dynamic) to avoid HMR breaking server-action refs (Turbopack "module factory not available"). */
import { TaskList } from "@/components/TaskList";
async function ResistanceIndexBannerAsync() {
  return getResistanceIndex();
}

async function RecoveryCampaignBannerAsync() {
  return getRecoveryCampaignNeeded();
}

async function EmotionalStateCorrelationBannerAsync() {
  return getEmotionalStateCorrelations();
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
}: {
  dateStr: string;
  backlog: Awaited<ReturnType<typeof getBacklogTasks>>;
  growthFromGrowthPage?: boolean;
}) {
  const [
    mode,
    completedToday,
    smartSuggestion,
    energyCap,
    energyBudget,
    missionsPipeline,
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
    getCompletedTodayTasks(dateStr),
    getSmartSuggestion(dateStr),
    getEnergyCapToday(dateStr),
    getEnergyBudget(dateStr),
    loadMissionsPipeline(dateStr),
    getXPIdentity(),
    getIdentityEngine(),
    getTodaysTasks(dateStr, "normal"),
    ResistanceIndexBannerAsync(),
    RecoveryCampaignBannerAsync(),
    EmotionalStateCorrelationBannerAsync(),
    getGrowthEngineSnapshot(),
    getBehaviorProfile(),
  ]);

  const decisionBlocks = missionsPipeline.decisionBlocks;

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

  const missionEngineWarnings = {
    energyDepleted: (energyBudget as { consequence?: { energyDepleted?: boolean } }).consequence?.energyDepleted,
    recoveryOnly: decisionBlocks.recoveryOnly,
    recoveryProtocol: decisionBlocks.recoveryProtocol,
    daysSinceLastCompletion: decisionBlocks.daysSinceLastCompletion,
  };

  const diagnosticsBlock = (
    <details className="tasks-war-hide rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] p-3">
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
  const smartSuggestionDeck = smartSuggestionBlock ? (
    <div className="card-simple !rounded-xl border border-[rgba(var(--mode-rgb),0.1)] p-3">{smartSuggestionBlock}</div>
  ) : null;

  const tasksTodayBlock = (
    <div data-tutorial="tasks-today">
      <div className="tasks-war-hide">
        <TodayMissionsGridFromStore dateStr={dateStr} />
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
          energyCap={{
            used: energyCap.used,
            cap: energyCap.cap,
            remaining: energyCap.remaining,
            planned: energyCap.planned,
          }}
          missionEngineWarnings={missionEngineWarnings}
          missionsContextBelowHero={<ModeBanner mode={mode} />}
          missionsBacklogShelf={{ backlog, todayDate: dateStr }}
        />
      </div>
    </div>
  );

  /** Hero-first flow: ribbon + diagnostics after main stack. */
  const missionsBody = (
    <>
      {smartSuggestionDeck}
      {tasksTodayBlock}
      {growthSnap ? (
        <GrowthMissionsRibbon snap={growthSnap} fromGrowthPage={growthFromGrowthPage} />
      ) : null}
      {diagnosticsBlock}
    </>
  );

  return <div className="space-y-6">{missionsBody}</div>;
}

type CalendarDataPromise = ReturnType<typeof getCalendarTabData>;

async function CalendarSectionFromPromise({
  promise,
  dateStr,
  monthParam,
  selectedCalendarDay,
  calendarView,
  backlog,
  simplifiedContent = false,
}: {
  promise: CalendarDataPromise;
  dateStr: string;
  monthParam: string;
  selectedCalendarDay: string;
  calendarView: CalendarView;
  backlog: Awaited<ReturnType<typeof getBacklogTasks>>;
  simplifiedContent?: boolean;
}) {
  const { tasksByDate, upcomingCalendarEvents, hasGoogle } = await promise;
  const overdueTasksForCalendar = (backlog ?? [])
    .slice()
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  return (
    <div className="space-y-4">
      <TasksCalendarSection
        initialMonth={monthParam}
        initialDay={selectedCalendarDay}
        dateStr={dateStr}
        tasksByDate={(tasksByDate ?? {}) as Record<string, unknown[]>}
        upcomingCalendarEvents={upcomingCalendarEvents}
        hasGoogle={hasGoogle}
        initialCalView={calendarView}
        overdueTasks={overdueTasksForCalendar}
        simplifiedLayout={simplifiedContent}
        commandDeckVisuals
      />
    </div>
  );
}

type RoutineDataPromise = ReturnType<typeof getRoutineTasksWithSuggestions>;

/** Awaits a promise started in TasksPage so routine Supabase work overlaps prefs/backlog. */
async function RoutineSectionFromPromise({
  promise,
  dateStr,
}: {
  promise: RoutineDataPromise;
  dateStr: string;
}) {
  const { routineTasks, suggestedDays, suggestedPlans } = await promise;
  return (
    <RoutineTaskList
      routineTasks={routineTasks}
      suggestedDays={suggestedDays}
      suggestedPlans={suggestedPlans}
      dateStr={dateStr}
      commandDeckVisuals
    />
  );
}

export default async function TasksPage({ searchParams }: Props) {
  const dateStr = todayDateString();
  /** Overlap with `searchParams` (same request); tab shell needs all three panels on first paint. */
  const prefsPromise = getUserPreferencesOrDefaults();
  const backlogPromise = getBacklogTasks(dateStr);
  const routineDataPromise = getRoutineTasksWithSuggestions(dateStr);

  const params = await searchParams;
  const growthFromGrowthPage = params.growth === "1";
  const tabParam = params.tab;
  const activeTab: TasksTabId =
    tabParam === "routine" ? "routine" : tabParam === "calendar" ? "calendar" : "missions";
  const calendarView: CalendarView = isValidCalendarView(params.calView) ? params.calView : "calendar";
  const monthParam = isValidMonthKey(params.month) ? params.month : dateStr.slice(0, 7);
  const dayParam = isValidDayKey(params.day) ? params.day : null;
  const selectedCalendarDay = dayParam ?? dateStr;
  /** Overlap calendar Supabase work with prefs/backlog (tab switch is client-side only). */
  const calendarDataPromise = getCalendarTabData(monthParam, dateStr);
  const [prefs, backlog] = await Promise.all([prefsPromise, backlogPromise]);

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
  /** Simplified /tasks: full-height column + scroll contract; same command-deck chrome as standard. */
  const simplifiedTasksFillLayout = prefs.simplified_content === true;

  /**
   * Missions UI matches visual-lab command deck: no separate HQ header, mascot, or meta strip —
   * the deck (TasksTabsShell) is the single chrome surface.
   */
  const headerSection = null;

  const tabsShell = (
    <TasksTabsShell
      initialTab={activeTab}
      missionsHref={missionsHref}
      calendarHref={calendarHref}
      routineHref={routineHref}
      header={headerSection}
      fillViewport={simplifiedTasksFillLayout}
      stickyTabs={simplifiedTasksFillLayout}
      panelMissions={
        <Suspense fallback={<TasksMissionsSnapshotFallback dateStr={dateStr} />}>
          <MissionsSectionAsync dateStr={dateStr} backlog={backlog} growthFromGrowthPage={growthFromGrowthPage} />
        </Suspense>
      }
      panelCalendar={
        <Suspense
          fallback={
            <TasksCalendarTabFallback
              monthParam={monthParam}
              dateStr={dateStr}
              selectedCalendarDay={selectedCalendarDay}
              simplifiedContent={prefs.simplified_content === true}
            />
          }
        >
          <CalendarSectionFromPromise
            promise={calendarDataPromise}
            dateStr={dateStr}
            monthParam={monthParam}
            selectedCalendarDay={selectedCalendarDay}
            calendarView={calendarView}
            backlog={backlog}
            simplifiedContent={prefs.simplified_content === true}
          />
        </Suspense>
      }
      panelRoutine={
        <Suspense fallback={<TasksRoutineTabFallback />}>
          <RoutineSectionFromPromise promise={routineDataPromise} dateStr={dateStr} />
        </Suspense>
      }
    />
  );

  return (
    <main
      className={`tasks-page-root relative isolate overflow-x-hidden ${simplifiedTasksFillLayout ? "flex min-h-0 flex-1 flex-col" : "min-h-screen min-h-[100dvh]"}`}
    >
      <MissionsProvider dateStr={dateStr}>
        <div
          className={
            simplifiedTasksFillLayout
              ? "relative z-10 flex min-h-[calc(100svh-7rem)] w-full max-w-none flex-1 flex-col dashboard-cinematic sm:min-h-[calc(100svh-6.5rem)]"
              : "tasks-page-column container page page-wide relative z-10 pt-4 sm:pt-5"
          }
        >
          <div className="hq-frosted-main-shell">{tabsShell}</div>
        </div>
      </MissionsProvider>
    </main>
  );
}

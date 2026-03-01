import nextDynamic from "next/dynamic";
import { getTodaysTasks, getTasksForDate, getTasksForDateRange, getSubtasksForTaskIds, getBacklogTasks, getFutureTasks, getCompletedTodayTasks, type TaskListMode } from "@/app/actions/tasks";

/** Tasks page must always run on the server so auto-missions see latest daily_state after brain status save. */
export const dynamic = "force-dynamic";
import { getMode } from "@/app/actions/mode";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getDecisionBlocks, getResistanceIndex, getMetaInsights30, getRecoveryCampaignNeeded, getEmotionalStateCorrelations } from "@/app/actions/missions-performance";
import { getThirtyDayMirror } from "@/app/actions/thirty-day-mirror";
import { getSmartSuggestion } from "@/app/actions/dcic/smart-suggestion";
import { getEnergyCapToday } from "@/app/actions/dcic/energy-cap";
import { getEnergyBudget } from "@/app/actions/energy";
import { yesterdayDate } from "@/lib/utils/timezone";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getXP, getXPIdentity } from "@/app/actions/xp";
import { getIdentityEngine } from "@/app/actions/identity-engine";
import { ensureMasterMissionsForToday } from "@/app/actions/master-missions";
import { HQPageHeader } from "@/components/hq";
import { XPBadge } from "@/components/XPBadge";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { Divider1px } from "@/components/hud-test/Divider1px";
import hudStyles from "@/components/hud-test/hud.module.css";
import { TasksTabsShell, TasksCalendarSection } from "@/components/missions";
import { RefreshPageButton } from "@/components/missions/RefreshPageButton";

const ModeBanner = nextDynamic(() => import("@/components/ModeBanner").then((m) => ({ default: m.ModeBanner })), { loading: () => <div className="min-h-[44px]" aria-hidden /> });
const EnergyCapBar = nextDynamic(() => import("@/components/missions/EnergyCapBar").then((m) => ({ default: m.EnergyCapBar })), { loading: () => <div className="h-10 animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const SmartRecommendationHero = nextDynamic(() => import("@/components/missions/SmartRecommendationHero").then((m) => ({ default: m.SmartRecommendationHero })), { loading: () => null });
const DecisionBlocksRow = nextDynamic(() => import("@/components/missions/DecisionBlocksRow").then((m) => ({ default: m.DecisionBlocksRow })), { loading: () => null });
const SmartSuggestionBanner = nextDynamic(() => import("@/components/missions/SmartSuggestionBanner").then((m) => ({ default: m.SmartSuggestionBanner })), { loading: () => null });
const YesterdayTasksSection = nextDynamic(() => import("@/components/YesterdayTasksSection").then((m) => ({ default: m.YesterdayTasksSection })), { loading: () => null });
const CommanderMissionCard = nextDynamic(() => import("@/components/commander").then((m) => ({ default: m.CommanderMissionCard })), { loading: () => <div className="min-h-[72px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const TaskList = nextDynamic(() => import("@/components/TaskList").then((m) => ({ default: m.TaskList })), { loading: () => <div className="card-simple min-h-[200px] animate-pulse rounded-xl bg-white/5 p-4" aria-hidden /> });
const BacklogAndToekomstTriggers = nextDynamic(() => import("@/components/missions/BacklogAndToekomstTriggers").then((m) => ({ default: m.BacklogAndToekomstTriggers })), { loading: () => null });
const AddCalendarEventForm = nextDynamic(() => import("@/components/AddCalendarEventForm").then((m) => ({ default: m.AddCalendarEventForm })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const AgendaOnlyList = nextDynamic(() => import("@/components/AgendaOnlyList").then((m) => ({ default: m.AgendaOnlyList })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const CalendarModal3Trigger = nextDynamic(() => import("@/components/missions").then((m) => ({ default: m.CalendarModal3Trigger })), { loading: () => null });
const ResistanceIndexBanner = nextDynamic(() => import("@/components/missions/ResistanceIndexBanner").then((m) => ({ default: m.ResistanceIndexBanner })), { loading: () => null });
const RecoveryCampaignBanner = nextDynamic(() => import("@/components/missions/RecoveryCampaignBanner").then((m) => ({ default: m.RecoveryCampaignBanner })), { loading: () => null });
const HighROISection = nextDynamic(() => import("@/components/missions/HighROISection").then((m) => ({ default: m.HighROISection })), { loading: () => null });
const MetaInsights30Banner = nextDynamic(() => import("@/components/missions/MetaInsights30Banner").then((m) => ({ default: m.MetaInsights30Banner })), { loading: () => null });
const EmotionalStateCorrelationBanner = nextDynamic(() => import("@/components/missions/EmotionalStateCorrelationBanner").then((m) => ({ default: m.EmotionalStateCorrelationBanner })), { loading: () => null });
const ThirtyDayMirrorBanner = nextDynamic(() => import("@/components/missions/ThirtyDayMirrorBanner").then((m) => ({ default: m.ThirtyDayMirrorBanner })), { loading: () => null });
const ConsequenceBanner = nextDynamic(() => import("@/components/ConsequenceBanner").then((m) => ({ default: m.ConsequenceBanner })), { loading: () => null });

type Props = {
  searchParams: Promise<{ tab?: string; add?: string; month?: string; day?: string; calView?: string }>;
};

type CalendarView = "today" | "calendar" | "routines" | "overdue";

function toDateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toMonthKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function isValidDayKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidMonthKey(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value);
}

function isValidCalendarView(value: string | undefined): value is CalendarView {
  return value === "today" || value === "calendar" || value === "routines" || value === "overdue";
}

export default async function TasksPage({ searchParams }: Props) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterdayDate(dateStr);
  const params = await searchParams;
  const tabParam = params.tab;
  const calendarView: CalendarView = isValidCalendarView(params.calView) ? params.calView : "calendar";
  const monthParam = isValidMonthKey(params.month) ? params.month : dateStr.slice(0, 7);
  const dayParam = isValidDayKey(params.day) ? params.day : null;
  const selectedCalendarDay = dayParam ?? dateStr;
  const [monthYear, monthNumber] = monthParam.split("-").map((part) => parseInt(part, 10));
  const monthStart = new Date(Date.UTC(monthYear, monthNumber - 1, 1, 12));
  const monthEnd = new Date(Date.UTC(monthYear, monthNumber, 0, 12));
  const prevMonthDate = new Date(Date.UTC(monthYear, monthNumber - 2, 1, 12));
  const nextMonthDate = new Date(Date.UTC(monthYear, monthNumber, 1, 12));
  const monthLabel = monthStart.toLocaleDateString("nl-NL", { month: "long", year: "numeric", timeZone: "UTC" });

  const weekStartOffset = monthStart.getUTCDay();
  const weekEndOffset = 6 - monthEnd.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - weekStartOffset);
  const gridEnd = new Date(monthEnd);
  gridEnd.setUTCDate(monthEnd.getUTCDate() + weekEndOffset);

  // Prefetch tasks for prev + current + next month so calendar month/day change doesn't trigger full page load
  const prevMonthStart = new Date(Date.UTC(monthYear, monthNumber - 2, 1, 12));
  const prevMonthEnd = new Date(Date.UTC(monthYear, monthNumber - 1, 0, 12));
  const prevWeekStart = prevMonthStart.getUTCDay();
  const prevGridStart = new Date(prevMonthStart);
  prevGridStart.setUTCDate(prevMonthStart.getUTCDate() - prevWeekStart);
  const nextMonthEnd = new Date(Date.UTC(monthYear, monthNumber + 1, 0, 12));
  const nextWeekEnd = 6 - nextMonthEnd.getUTCDay();
  const nextGridEnd = new Date(nextMonthEnd);
  nextGridEnd.setUTCDate(nextMonthEnd.getUTCDate() + nextWeekEnd);
  const calendarRangeStart = toDateKeyUTC(prevGridStart);
  const calendarRangeEnd = toDateKeyUTC(nextGridEnd);

  const masterMissionsResult = await ensureMasterMissionsForToday();
  const [mode, upcomingCalendarEvents, hasGoogle, backlog, futureTasks, completedToday, yesterdayTasksRaw, smartSuggestion, energyCap, energyBudget, decisionBlocks, resistanceIndex, meta30, recoveryCampaign, emotionalCorrelations, xp, identity, mirror30, identityEngine, tasksByDate] = await Promise.all([
    getMode(dateStr),
    getUpcomingCalendarEvents(dateStr, 180),
    hasGoogleCalendarToken(),
    getBacklogTasks(dateStr),
    getFutureTasks(dateStr),
    getCompletedTodayTasks(dateStr),
    getTasksForDate(yesterdayStr),
    getSmartSuggestion(dateStr),
    getEnergyCapToday(dateStr),
    getEnergyBudget(dateStr),
    getDecisionBlocks(dateStr),
    getResistanceIndex(),
    getMetaInsights30(),
    getRecoveryCampaignNeeded(),
    getEmotionalStateCorrelations(),
    getXP(),
    getXPIdentity(),
    getThirtyDayMirror(),
    getIdentityEngine(),
    getTasksForDateRange(calendarRangeStart, calendarRangeEnd),
  ]);
  const taskMode: TaskListMode = mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks, carryOverCount } = await getTodaysTasks(dateStr, taskMode);
  const subtaskRows = await getSubtasksForTaskIds(tasks.map((t) => t.id));
  const subtasksByParent: Record<string, typeof subtaskRows> = {};
  for (const s of subtaskRows) {
    const pid = s.parent_task_id;
    if (!subtasksByParent[pid]) subtasksByParent[pid] = [];
    subtasksByParent[pid].push(s);
  }
  const yesterdayTasks = (yesterdayTasksRaw ?? []).map((t) => ({
    id: (t as { id: string }).id,
    title: (t as { title: string | null }).title ?? null,
    completed: !!(t as { completed?: boolean }).completed,
  }));

  const modeHint = taskMode === "stabilize"
    ? "Showing top 2 — complete or reschedule to add more."
    : taskMode === "driven"
      ? "Sorted by impact and priority."
      : null;

  const missionCardsFromUMS = decisionBlocks.tasksSortedByUMS.slice(0, 8).map((t, i) => ({
    id: t.id,
    title: t.title ?? "Task",
    subtitle: i === 0 ? "Aanbevolen" : `UMS ${Math.round(t.umsBreakdown.ums * 100)}%`,
    description: (t as { notes?: string | null }).notes ?? null,
    state: (i === 0 ? "active" : "locked") as "active" | "locked",
    progressPct: 0,
    href: "/tasks",
  }));
  const missionCardsCompleted = (completedToday as { id: string; title: string | null }[]).slice(0, 4).map((t) => ({
    id: t.id,
    title: t.title ?? "Done",
    subtitle: "Completed",
    state: "completed" as const,
    progressPct: 100,
    href: undefined as string | undefined,
  }));
  const { getMissionDifficultyRank } = await import("@/lib/mission-difficulty-rank");
  const strategicByTaskId: Record<string, { domain?: string | null; alignmentImpactPct?: number; expectedXP?: number; disciplineImpact?: number; roi?: number; pressureEffect?: string; strategicValue?: number; psychologyLabel?: string | null; energyMatch?: number; difficultyRank?: "S" | "A" | "B" | "C" | "D" }> = {};
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

  const missionCards = missionCardsFromUMS.length > 0
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

  const makeTasksHref = (overrides: { tab?: "missions" | "calendar"; day?: string; month?: string; calView?: CalendarView }) => {
    const search = new URLSearchParams();
    const nextTab = overrides.tab ?? activeTab;
    const nextMonth = overrides.month ?? monthParam;
    const nextDay = overrides.day ?? dayParam ?? undefined;
    const nextCalView = overrides.calView ?? calendarView;
    search.set("tab", nextTab);
    if (params.add) search.set("add", params.add);
    if (nextMonth) search.set("month", nextMonth);
    if (nextDay) search.set("day", nextDay);
    search.set("calView", nextCalView);
    const query = search.toString();
    return query ? `/tasks?${query}` : "/tasks";
  };
  const activeTab: "missions" | "calendar" = tabParam === "calendar" ? "calendar" : "missions";

  const eventCountByDay = new Map<string, number>();
  for (const e of upcomingCalendarEvents as { start_at: string }[]) {
    const key = e.start_at.slice(0, 10);
    eventCountByDay.set(key, (eventCountByDay.get(key) ?? 0) + 1);
  }

  const calendarDays: { dateKey: string; inCurrentMonth: boolean; isToday: boolean; isSelected: boolean; eventCount: number }[] = [];
  for (const cursor = new Date(gridStart); cursor <= gridEnd; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const dateKey = toDateKeyUTC(cursor);
    calendarDays.push({
      dateKey,
      inCurrentMonth: toMonthKeyUTC(cursor) === monthParam,
      isToday: dateKey === dateStr,
      isSelected: dateKey === selectedCalendarDay,
      eventCount: eventCountByDay.get(dateKey) ?? 0,
    });
  }
  const selectedDayEvents = (upcomingCalendarEvents as {
    id: string;
    title: string | null;
    start_at: string;
    end_at: string;
    is_social: boolean;
    source: string | null;
  }[]).filter((event) => event.start_at.slice(0, 10) === selectedCalendarDay);
  const selectedDayTasks = ((tasksByDate ?? {}) as Record<string, unknown[]>)[selectedCalendarDay] ?? [];
  const selectedDayRoutines = selectedDayTasks.filter(
    (task) => !!(task as { recurrence_rule?: string | null }).recurrence_rule
  );
  const overdueTasks = (backlog as { id: string; title: string | null; due_date: string | null }[])
    .slice()
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
  const selectedDayLabel = new Date(`${selectedCalendarDay}T12:00:00Z`).toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const headerSection = (
    <>
      <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
        <CornerNode corner="top-left" />
        <CornerNode corner="top-right" />
        <div className="[&>*+*]:mt-0">
          <HQPageHeader
            title="Missions"
            subtitle={
              <>
                XP-missies · {dateStr} · Performance engine · One focus at a time
                {modeHint && <span className="block mt-1 text-xs">{modeHint}</span>}
              </>
            }
            backHref="/dashboard"
          />
        </div>
      </SciFiPanel>
      {/* Mascot outside panel so no glass/gradient overlay lies on top */}
      <section className="mascot-hero mascot-hero-top mascot-hero-mission mascot-hero-sharp" data-mascot-page="tasks" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="tasks" className="mascot-img" heroLarge />
        </div>
      </section>
      <div className="mascot-follow-row flex flex-wrap items-center justify-end gap-2">
        <YesterdayTasksSection yesterdayTasks={yesterdayTasks} todayStr={dateStr} />
        <XPBadge totalXp={xp.total_xp} level={xp.level} compact href="/xp" />
        <div className="glow-pill inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full bg-[var(--dc-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--dc-text-main)]" title="Vandaag" aria-label="Vandaag">
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-[var(--dc-accent-primary)] shadow-[0_0_8px_rgba(37,99,235,0.6)]"
            aria-hidden
          />
          <span className="truncate">Today</span>
        </div>
      </div>
      <Divider1px />
    </>
  );

  const missionsSection = (
    <>
      <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
        <CornerNode corner="top-left" />
        <CornerNode corner="top-right" />
        <ModeBanner mode={mode} />
      {masterMissionsResult.created === 0 && masterMissionsResult.debug && masterMissionsResult.debug !== "already_enough" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Auto-missies: geen toegevoegd (reden: <code>{masterMissionsResult.debug}</code>)
          {masterMissionsResult.createError && <> — {masterMissionsResult.createError}</>}.
          {masterMissionsResult.debug === "auto_off" && " Zet in Instellingen “Auto-missies” aan."}
          {masterMissionsResult.debug === "no_brain_status" && (
            <>
              {" Zet eerst je brain status op het dashboard (Hoe voel je je vandaag?) om auto-missies te krijgen. Als je die net hebt gezet, "}
              <RefreshPageButton /> om de pagina te verversen.
            </>
          )}
          {(masterMissionsResult.debug === "create_failed" || masterMissionsResult.debug === "no_picks" || masterMissionsResult.debug === "to_create_empty") && " Vernieuw de pagina of probeer later opnieuw."}
        </div>
      )}
      {masterMissionsResult.created > 0 && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {masterMissionsResult.created} auto-missie{masterMissionsResult.created === 1 ? "" : "s"} toegevoegd.
        </div>
      )}
        <EnergyCapBar used={energyCap.used} cap={energyCap.cap} remaining={energyCap.remaining} planned={energyCap.planned} />
        <ConsequenceBanner
          energyDepleted={(energyBudget as { consequence?: { energyDepleted?: boolean } }).consequence?.energyDepleted}
          recoveryOnly={decisionBlocks.recoveryOnly}
          recoveryProtocol={decisionBlocks.recoveryProtocol}
          daysSinceLastCompletion={decisionBlocks.daysSinceLastCompletion}
        />
        <SmartRecommendationHero recommendation={decisionBlocks.topRecommendation} showUMSBreakdown />
        <DecisionBlocksRow
          streakCritical={decisionBlocks.streakCritical}
          highPressure={decisionBlocks.highPressure}
          recovery={decisionBlocks.recovery}
          alignmentFix={decisionBlocks.alignmentFix}
        />
        <ResistanceIndexBanner message={resistanceIndex.message} />
        {recoveryCampaign.needed && (
          <RecoveryCampaignBanner
            daysInactive={recoveryCampaign.daysInactive}
            lastCompletionDate={recoveryCampaign.lastCompletionDate}
          />
        )}
        <HighROISection tasks={decisionBlocks.tasksSortedByUMS} maxItems={3} />
        <EmotionalStateCorrelationBanner message={emotionalCorrelations.message} />
        {smartSuggestion.text && !decisionBlocks.topRecommendation ? (
          <SmartSuggestionBanner text={smartSuggestion.text} type={smartSuggestion.type} />
        ) : null}
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
        />
        <MetaInsights30Banner
          biggestSabotagePattern={meta30.biggestSabotagePattern}
          mostEffectiveType={meta30.mostEffectiveType}
          comfortzoneScore={meta30.comfortzoneScore}
          growthPerDomain={meta30.growthPerDomain}
        />
        <ThirtyDayMirrorBanner mirror={mirror30} />
        <BacklogAndToekomstTriggers backlog={backlog} futureTasks={futureTasks} todayDate={dateStr} />
      </SciFiPanel>
    </>
  );

  const overdueTasksForCalendar = (backlog as { id: string; title: string | null; due_date: string | null }[])
    .slice()
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  const calendarSection = (
    <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-0">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      <TasksCalendarSection
        initialMonth={monthParam}
        initialDay={selectedCalendarDay}
        dateStr={dateStr}
        tasksByDate={(tasksByDate ?? {}) as Record<string, unknown[]>}
        upcomingCalendarEvents={upcomingCalendarEvents as { id: string; title: string | null; start_at: string; end_at: string; is_social: boolean; source: string | null }[]}
        hasGoogle={hasGoogle}
        initialCalView={calendarView}
        overdueTasks={overdueTasksForCalendar}
      />
    </SciFiPanel>
  );

  return (
    <main className={`relative min-h-screen overflow-hidden ${hudStyles.cinematicBackdrop}`}>
      <div className={hudStyles.spaceMist} aria-hidden />
      <div className={hudStyles.starLayerFar} aria-hidden />
      <div className={hudStyles.starLayerNear} aria-hidden />
      <div className={hudStyles.backgroundAtmosphere} aria-hidden />
      <div className={hudStyles.colorBlend} aria-hidden />
      <div className={hudStyles.spaceNoise} aria-hidden />
      <div className="container page page-wide dashboard-cinematic relative z-10">
        <TasksTabsShell initialTab={activeTab} header={headerSection} missions={missionsSection} calendar={calendarSection} />
      </div>
    </main>
  );
}

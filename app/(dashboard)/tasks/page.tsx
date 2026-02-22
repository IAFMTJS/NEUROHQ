import dynamic from "next/dynamic";
import { getTodaysTasks, getTasksForDate, getSubtasksForTaskIds, getBacklogTasks, getCompletedTodayTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getDecisionBlocks, getResistanceIndex, getMetaInsights30, getRecoveryCampaignNeeded, getEmotionalStateCorrelations } from "@/app/actions/missions-performance";
import { getSmartSuggestion } from "@/app/actions/dcic/smart-suggestion";
import { getEnergyCapToday } from "@/app/actions/dcic/energy-cap";
import { getEnergyBudget } from "@/app/actions/energy";
import { yesterdayDate } from "@/lib/utils/timezone";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";

const ModeBanner = dynamic(() => import("@/components/ModeBanner").then((m) => ({ default: m.ModeBanner })), { loading: () => <div className="min-h-[44px]" aria-hidden /> });
const EnergyCapBar = dynamic(() => import("@/components/missions/EnergyCapBar").then((m) => ({ default: m.EnergyCapBar })), { loading: () => <div className="h-10 animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const SmartRecommendationHero = dynamic(() => import("@/components/missions/SmartRecommendationHero").then((m) => ({ default: m.SmartRecommendationHero })), { loading: () => null });
const DecisionBlocksRow = dynamic(() => import("@/components/missions/DecisionBlocksRow").then((m) => ({ default: m.DecisionBlocksRow })), { loading: () => null });
const SmartSuggestionBanner = dynamic(() => import("@/components/missions/SmartSuggestionBanner").then((m) => ({ default: m.SmartSuggestionBanner })), { loading: () => null });
const YesterdayTasksSection = dynamic(() => import("@/components/missions/YesterdayTasksSection").then((m) => ({ default: m.YesterdayTasksSection })), { loading: () => null });
const CommanderMissionCard = dynamic(() => import("@/components/commander").then((m) => ({ default: m.CommanderMissionCard })), { loading: () => <div className="min-h-[72px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const TaskList = dynamic(() => import("@/components/TaskList").then((m) => ({ default: m.TaskList })), { loading: () => <div className="card-simple min-h-[200px] animate-pulse rounded-xl bg-white/5 p-4" aria-hidden /> });
const BacklogList = dynamic(() => import("@/components/BacklogList").then((m) => ({ default: m.BacklogList })), { loading: () => null });
const AddCalendarEventForm = dynamic(() => import("@/components/AddCalendarEventForm").then((m) => ({ default: m.AddCalendarEventForm })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const AgendaOnlyList = dynamic(() => import("@/components/AgendaOnlyList").then((m) => ({ default: m.AgendaOnlyList })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const CalendarModal3Trigger = dynamic(() => import("@/components/missions").then((m) => ({ default: m.CalendarModal3Trigger })), { loading: () => null });
const ResistanceIndexBanner = dynamic(() => import("@/components/missions/ResistanceIndexBanner").then((m) => ({ default: m.ResistanceIndexBanner })), { loading: () => null });
const RecoveryCampaignBanner = dynamic(() => import("@/components/missions/RecoveryCampaignBanner").then((m) => ({ default: m.RecoveryCampaignBanner })), { loading: () => null });
const HighROISection = dynamic(() => import("@/components/missions/HighROISection").then((m) => ({ default: m.HighROISection })), { loading: () => null });
const MetaInsights30Banner = dynamic(() => import("@/components/missions/MetaInsights30Banner").then((m) => ({ default: m.MetaInsights30Banner })), { loading: () => null });
const EmotionalStateCorrelationBanner = dynamic(() => import("@/components/missions/EmotionalStateCorrelationBanner").then((m) => ({ default: m.EmotionalStateCorrelationBanner })), { loading: () => null });

export default async function TasksPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterdayDate(dateStr);
  const [mode, upcomingCalendarEvents, hasGoogle, backlog, completedToday, yesterdayTasksRaw, smartSuggestion, energyCap, energyBudget, decisionBlocks, resistanceIndex, meta30, recoveryCampaign, emotionalCorrelations] = await Promise.all([
    getMode(dateStr),
    getUpcomingCalendarEvents(dateStr, 60),
    hasGoogleCalendarToken(),
    getBacklogTasks(dateStr),
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
  const strategicByTaskId: Record<string, { domain?: string | null; alignmentImpactPct?: number; expectedXP?: number; disciplineImpact?: number; roi?: number; pressureEffect?: string; strategicValue?: number; psychologyLabel?: string | null }> = {};
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
    };
  }

  const missionCards = missionCardsFromUMS.length > 0 ? [...missionCardsFromUMS, ...missionCardsCompleted] : [
    ...tasks.slice(0, 8).map((t, i) => ({
      id: (t as { id: string }).id,
      title: (t as { title: string }).title ?? "Task",
      subtitle: i === 0 ? "Active" : undefined,
      state: (i === 0 ? "active" : "locked") as "active" | "locked",
      progressPct: 0,
      href: "/tasks",
    })),
    ...missionCardsCompleted,
  ];

  return (
    <div className="container page">
      {/* Geen space-y tussen header, mascot en Gisteren – marges bepalen de ruimte */}
      <div className="[&>*+*]:mt-0">
        <HQPageHeader
          title="Missions"
          subtitle={<>{dateStr} · Performance engine · One focus at a time {modeHint && <span className="block mt-1 text-xs">{modeHint}</span>}</>}
          backHref="/dashboard"
        />
        <section className="mascot-hero mascot-hero-top mascot-hero-mission" data-mascot-page="tasks" aria-hidden>
          <img
            src={getMascotSrcForPage("tasks")}
            alt=""
            className="mascot-img"
          />
        </section>
        <div className="mascot-follow-row flex flex-wrap items-center justify-end gap-2">
          <YesterdayTasksSection yesterdayTasks={yesterdayTasks} todayStr={dateStr} />
          <div className="glow-pill inline-flex items-center gap-2 rounded-full bg-[var(--dc-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--dc-text-main)]">
            <span className="h-2 w-2 rounded-full bg-[var(--dc-accent-primary)] shadow-[0_0_8px_rgba(37,99,235,0.6)]" aria-hidden />
            Today
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-6">
      <ModeBanner mode={mode} />
      <EnergyCapBar used={energyCap.used} cap={energyCap.cap} remaining={energyCap.remaining} planned={energyCap.planned} />
      <SmartRecommendationHero recommendation={decisionBlocks.topRecommendation} showUMSBreakdown />
      <DecisionBlocksRow
        streakCritical={decisionBlocks.streakCritical}
        highPressure={decisionBlocks.highPressure}
        recovery={decisionBlocks.recovery}
        alignmentFix={decisionBlocks.alignmentFix}
      />
      <ResistanceIndexBanner message={resistanceIndex.message} />
      {recoveryCampaign.needed && (
        <RecoveryCampaignBanner daysInactive={recoveryCampaign.daysInactive} lastCompletionDate={recoveryCampaign.lastCompletionDate} />
      )}
      <HighROISection tasks={decisionBlocks.tasksSortedByUMS} maxItems={3} />
      <MetaInsights30Banner
        biggestSabotagePattern={meta30.biggestSabotagePattern}
        mostEffectiveType={meta30.mostEffectiveType}
        comfortzoneScore={meta30.comfortzoneScore}
        growthPerDomain={meta30.growthPerDomain}
      />
      <EmotionalStateCorrelationBanner message={emotionalCorrelations.message} />
      {smartSuggestion.text && !decisionBlocks.topRecommendation ? (
        <SmartSuggestionBanner text={smartSuggestion.text} type={smartSuggestion.type} />
      ) : null}
      {missionCards.length > 0 && (
        <section className="mission-grid">
          {missionCards.map((m) => (
            <CommanderMissionCard
              key={m.id}
              id={m.id}
              title={m.title}
              subtitle={m.subtitle}
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
        strategicByTaskId={strategicByTaskId}
        strategyMapping={decisionBlocks.strategyMapping}
      />
      {backlog.length > 0 && (
        <BacklogList backlog={backlog} todayDate={dateStr} />
      )}
      <section className="glass-card overflow-hidden p-0" id="agenda">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Algemene kalender</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Agenda-items voor elke datum. Kies hieronder een datum en voeg een item toe voor vandaag, morgen of een andere dag.</p>
          <div className="mt-2">
            <CalendarModal3Trigger date={dateStr} />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <AddCalendarEventForm date={dateStr} hasGoogleToken={hasGoogle} allowAnyDate />
          <AgendaOnlyList
            upcomingEvents={upcomingCalendarEvents as { id: string; title: string | null; start_at: string; end_at: string; is_social: boolean; source: string | null }[]}
            todayStr={dateStr}
          />
        </div>
      </section>
      </div>
    </div>
  );
}

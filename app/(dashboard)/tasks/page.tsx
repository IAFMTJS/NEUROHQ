import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { getTodaysTasks, getTasksForDate, getSubtasksForTaskIds, getBacklogTasks, getFutureTasks, getCompletedTodayTasks, type TaskListMode } from "@/app/actions/tasks";

/** Tasks page must always run on the server so auto-missions see latest daily_state after brain status save. */
export const dynamic = "force-dynamic";
import { getMode } from "@/app/actions/mode";
import {
  getDecisionBlocks,
  getResistanceIndex,
  getMetaInsights30,
  getRecoveryCampaignNeeded,
  getEmotionalStateCorrelations,
} from "@/app/actions/missions-performance";
import { getThirtyDayMirror } from "@/app/actions/thirty-day-mirror";
import { getSmartSuggestion } from "@/app/actions/dcic/smart-suggestion";
import { getEnergyCapToday } from "@/app/actions/dcic/energy-cap";
import { getEnergyBudget } from "@/app/actions/energy";
import { todayDateString, yesterdayDate } from "@/lib/utils/timezone";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { getXP, getXPIdentity } from "@/app/actions/xp";
import { getIdentityEngine } from "@/app/actions/identity-engine";
import { ensureMasterMissionsForToday, getDailyStateForAllocator } from "@/app/actions/master-missions";
import { ensureReadingMissionForToday } from "@/app/actions/reading-missions";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { HQPageHeader } from "@/components/hq/HQPageHeader";
import { XPBadge } from "@/components/XPBadge";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { Divider1px } from "@/components/hud-test/Divider1px";
import hudStyles from "@/components/hud-test/hud.module.css";
import { TasksTabsShell } from "@/components/missions";
import { TasksCalendarAsync } from "./TasksCalendarAsync";
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
const HighROISection = nextDynamic(() => import("@/components/missions/HighROISection").then((m) => ({ default: m.HighROISection })), { loading: () => null });
const ConsequenceBanner = nextDynamic(() => import("@/components/ConsequenceBanner").then((m) => ({ default: m.ConsequenceBanner })), { loading: () => null });

/** Lazy-loaded analytics banners (stream in after critical content). */
async function ResistanceIndexBannerAsync() {
  const data = await getResistanceIndex();
  const ResistanceIndexBanner = (await import("@/components/missions/ResistanceIndexBanner")).ResistanceIndexBanner;
  return <ResistanceIndexBanner message={data.message} />;
}
async function RecoveryCampaignBannerAsync() {
  const data = await getRecoveryCampaignNeeded();
  if (!data.needed) return null;
  const RecoveryCampaignBanner = (await import("@/components/missions/RecoveryCampaignBanner")).RecoveryCampaignBanner;
  return <RecoveryCampaignBanner daysInactive={data.daysInactive} lastCompletionDate={data.lastCompletionDate} />;
}
async function EmotionalStateCorrelationBannerAsync() {
  const data = await getEmotionalStateCorrelations();
  const EmotionalStateCorrelationBanner = (await import("@/components/missions/EmotionalStateCorrelationBanner")).EmotionalStateCorrelationBanner;
  return <EmotionalStateCorrelationBanner message={data.message} />;
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

type Props = {
  searchParams: Promise<{ tab?: string; add?: string; month?: string; day?: string; calView?: string }>;
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

export default async function TasksPage({ searchParams }: Props) {
  // Use the shared timezone‑aware helper so "today" is consistent across
  // dashboard, missions and auto‑mission generation.
  const dateStr = todayDateString();
  const today = new Date(dateStr + "T12:00:00Z");
  const yesterdayStr = yesterdayDate(dateStr);
  const params = await searchParams;
  const tabParam = params.tab;
  const calendarView: CalendarView = isValidCalendarView(params.calView) ? params.calView : "calendar";
  const monthParam = isValidMonthKey(params.month) ? params.month : dateStr.slice(0, 7);
  const dayParam = isValidDayKey(params.day) ? params.day : null;
  const selectedCalendarDay = dayParam ?? dateStr;
  // Fetch daily_state with service-role so we always see the row if it exists, then pass it in so the allocator doesn't rely on a second read.
  const dailyStateForAllocator = await getDailyStateForAllocator();
  const [masterMissionsResult] = await Promise.all([
    ensureMasterMissionsForToday(dailyStateForAllocator ?? undefined),
    ensureReadingMissionForToday().catch(() => ({ created: false, debug: "error" })),
  ]);
  // Critical path: mission list + hero. Calendar data (3‑month tasks, 180‑day events) streams in via Suspense so page doesn't wait.
  const [mode, prefs, backlog, futureTasks, completedToday, yesterdayTasksRaw, smartSuggestion, energyCap, energyBudget, decisionBlocks, xp, identity, identityEngine] = await Promise.all([
    getMode(dateStr),
    getUserPreferencesOrDefaults(),
    getBacklogTasks(dateStr),
    getFutureTasks(dateStr),
    getCompletedTodayTasks(dateStr),
    getTasksForDate(yesterdayStr),
    getSmartSuggestion(dateStr),
    getEnergyCapToday(dateStr),
    getEnergyBudget(dateStr),
    getDecisionBlocks(dateStr),
    getXP(),
    getXPIdentity(),
    getIdentityEngine(),
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

  // Ensure unique ids so CommanderMissionCard keys are unique.
  const seenMissionIds = new Set<string>();
  const missionCards = missionCardsBase.filter((card) => {
    if (!card.id || seenMissionIds.has(card.id)) return false;
    seenMissionIds.add(card.id);
    return true;
  });

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
              {" Zet eerst je brain status op het dashboard (Hoe voel je je vandaag?) om auto-missies te krijgen. Als je die net hebt gezet, klik "}
              <RefreshPageButton className="font-semibold" /> om de pagina te verversen.
              {masterMissionsResult.serviceRoleAvailable === false && " Zet SUPABASE_SERVICE_ROLE_KEY in je omgeving (Vercel/lokaal) zodat de server daily_state kan lezen."}
              {masterMissionsResult.serviceRoleAvailable === true && " De key staat; als je net brain status hebt gezet, wacht even en vernieuw de pagina (server tijdzone: Europe/Amsterdam)."}
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
        <Suspense fallback={null}>
                    <ResistanceIndexBannerAsync />
                  </Suspense>
<Suspense fallback={null}>
                    <RecoveryCampaignBannerAsync />
                  </Suspense>
        <HighROISection tasks={decisionBlocks.tasksSortedByUMS} maxItems={3} />
        <Suspense fallback={null}>
                    <EmotionalStateCorrelationBannerAsync />
                  </Suspense>
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
<Suspense fallback={null}>
                    <MetaInsights30BannerAsync />
                  </Suspense>
        <Suspense fallback={null}>
                    <ThirtyDayMirrorBannerAsync />
                  </Suspense>
        <BacklogAndToekomstTriggers backlog={backlog} futureTasks={futureTasks} todayDate={dateStr} />
      </SciFiPanel>
    </>
  );

  const calendarSection = (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-xl bg-white/5" aria-hidden />}>
      <TasksCalendarAsync
        dateStr={dateStr}
        monthParam={monthParam}
        selectedCalendarDay={selectedCalendarDay}
        calendarView={calendarView}
        backlog={(backlog ?? []) as { id: string; title: string | null; due_date: string | null }[]}
      />
    </Suspense>
  );

  const skipCinematicLayers = prefs.light_ui === true;

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
      <div className="container page page-wide dashboard-cinematic relative z-10">
        <TasksTabsShell initialTab={activeTab} header={headerSection} missions={missionsSection} calendar={calendarSection} />
      </div>
    </main>
  );
}

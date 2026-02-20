import Link from "next/link";
import { getTodaysTasks, getTasksForDate, getSubtasksForTaskIds, getBacklogTasks, getCompletedTodayTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getSmartSuggestion } from "@/app/actions/dcic/smart-suggestion";
import { getEnergyCapToday } from "@/app/actions/dcic/energy-cap";
import { getEnergyBudget } from "@/app/actions/energy";
import { yesterdayDate } from "@/lib/utils/timezone";
import { getMascotSrcForPage } from "@/lib/mascots";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";
import { BacklogList } from "@/components/BacklogList";
import { AgendaOnlyList } from "@/components/AgendaOnlyList";
import { AddCalendarEventForm } from "@/components/AddCalendarEventForm";
import { YesterdayTasksSection } from "@/components/missions/YesterdayTasksSection";
import { SmartSuggestionBanner } from "@/components/missions/SmartSuggestionBanner";
import { EnergyCapBar } from "@/components/missions/EnergyCapBar";
import { HQPageHeader } from "@/components/hq";
import { CommanderMissionCard } from "@/components/commander";

export default async function TasksPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterdayDate(dateStr);
  const [mode, upcomingCalendarEvents, hasGoogle, backlog, completedToday, yesterdayTasksRaw, smartSuggestion, energyCap, energyBudget] = await Promise.all([
    getMode(dateStr),
    getUpcomingCalendarEvents(dateStr, 60),
    hasGoogleCalendarToken(),
    getBacklogTasks(dateStr),
    getCompletedTodayTasks(dateStr),
    getTasksForDate(yesterdayStr),
    getSmartSuggestion(dateStr),
    getEnergyCapToday(dateStr),
    getEnergyBudget(dateStr),
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

  const missionCards = [
    ...tasks.slice(0, 8).map((t, i) => ({
      id: (t as { id: string }).id,
      title: (t as { title: string }).title ?? "Task",
      subtitle: i === 0 ? "Active" : undefined,
      state: (i === 0 ? "active" : "locked") as "active" | "locked",
      progressPct: 0,
      href: "/tasks",
    })),
    ...(completedToday as { id: string; title: string | null }[]).slice(0, 4).map((t) => ({
      id: t.id,
      title: t.title ?? "Done",
      subtitle: "Completed",
      state: "completed" as const,
      progressPct: 100,
      href: undefined,
    })),
  ];

  return (
    <div className="container page">
      {/* Geen space-y tussen header, mascot en Gisteren – marges bepalen de ruimte */}
      <div className="[&>*+*]:mt-0">
        <HQPageHeader
          title="Missions"
          subtitle={<>{dateStr} · One focus at a time {modeHint && <span className="block mt-1 text-xs">{modeHint}</span>}</>}
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
      {smartSuggestion.text ? (
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
      />
      {backlog.length > 0 && (
        <BacklogList backlog={backlog} todayDate={dateStr} />
      )}
      <section className="glass-card overflow-hidden p-0" id="agenda">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Algemene kalender</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Agenda-items voor elke datum. Kies hieronder een datum en voeg een item toe voor vandaag, morgen of een andere dag.</p>
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

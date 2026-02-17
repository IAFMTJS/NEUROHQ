import Link from "next/link";
import { getTodaysTasks, getTasksForDate, getSubtasksForTaskIds, getBacklogTasks, getCompletedTodayTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getUpcomingCalendarEvents } from "@/app/actions/calendar";
import { yesterdayDate } from "@/lib/utils/timezone";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";
import { BacklogList } from "@/components/BacklogList";
import { AgendaOnlyList } from "@/components/AgendaOnlyList";
import { YesterdayTasksSection } from "@/components/missions/YesterdayTasksSection";
import { HQPageHeader } from "@/components/hq";
import { CommanderMissionCard } from "@/components/commander";

export default async function TasksPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterdayDate(dateStr);
  const [mode, upcomingCalendarEvents, backlog, completedToday, yesterdayTasksRaw] = await Promise.all([
    getMode(dateStr),
    getUpcomingCalendarEvents(dateStr, 60),
    getBacklogTasks(dateStr),
    getCompletedTodayTasks(dateStr),
    getTasksForDate(yesterdayStr),
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
    ...tasks.slice(0, 4).map((t, i) => ({
      id: (t as { id: string }).id,
      title: (t as { title: string }).title ?? "Task",
      subtitle: i === 0 ? "Active" : undefined,
      state: (i === 0 ? "active" : "locked") as "active" | "locked",
      progressPct: 0,
      href: "/tasks",
    })),
    ...(completedToday as { id: string; title: string | null }[]).slice(0, 2).map((t) => ({
      id: t.id,
      title: t.title ?? "Done",
      subtitle: "Completed",
      state: "completed" as const,
      progressPct: 100,
      href: undefined,
    })),
  ];

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="Missions"
        subtitle={<>{dateStr} · One focus at a time {modeHint && <span className="block mt-1 text-xs">{modeHint}</span>}</>}
        backHref="/dashboard"
      />
      <div className="flex flex-wrap items-center justify-end gap-2 -mt-4">
        <YesterdayTasksSection yesterdayTasks={yesterdayTasks} todayStr={dateStr} />
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--dc-border-soft)] bg-[var(--dc-bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--dc-text-main)]">
          <span className="h-2 w-2 rounded-full bg-[var(--dc-accent-primary)]" aria-hidden />
          Today
        </div>
      </div>
      <ModeBanner mode={mode} />
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
      />
      {backlog.length > 0 && (
        <BacklogList backlog={backlog} todayDate={dateStr} />
      )}
      <section className="glass-card overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Agenda</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">All agenda items. Only days with events are shown.</p>
        </div>
        <div className="p-4">
          <AgendaOnlyList
            upcomingEvents={upcomingCalendarEvents as { id: string; title: string | null; start_at: string; end_at: string; is_social: boolean; source: string | null }[]}
            todayStr={dateStr}
          />
        </div>
      </section>
    </div>
  );
}

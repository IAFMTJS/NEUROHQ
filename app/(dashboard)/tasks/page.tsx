import Link from "next/link";
import { getTodaysTasks, getSubtasksForTaskIds, getBacklogTasks, getCompletedTodayTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getUpcomingCalendarEvents } from "@/app/actions/calendar";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";
import { BacklogList } from "@/components/BacklogList";
import { AgendaOnlyList } from "@/components/AgendaOnlyList";

export default async function TasksPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const [mode, upcomingCalendarEvents, backlog, completedToday] = await Promise.all([
    getMode(dateStr),
    getUpcomingCalendarEvents(dateStr, 60),
    getBacklogTasks(dateStr),
    getCompletedTodayTasks(dateStr),
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

  const modeHint = taskMode === "stabilize"
    ? "Showing top 2 — complete or reschedule to add more."
    : taskMode === "driven"
      ? "Sorted by impact and priority."
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="mb-2 inline-block text-sm font-medium text-neuro-muted hover:text-neuro-silver">
          ← HQ
        </Link>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Missions</h1>
            <p className="mt-1 text-sm text-neuro-muted">{dateStr} · One focus at a time</p>
            {modeHint && <p className="mt-1 text-xs text-neuro-muted">{modeHint}</p>}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-neuro-border/80 bg-neuro-surface px-4 py-2 text-sm font-medium text-neuro-silver">
            <span className="h-2 w-2 rounded-full bg-neuro-blue" aria-hidden />
            Today
          </div>
        </div>
      </div>
      <ModeBanner mode={mode} />
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
      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Agenda</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">All agenda items. Only days with events are shown.</p>
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

import Link from "next/link";
import { profileEngineHref } from "@/lib/profile-routes";
import { getTasksForDateRange } from "@/app/actions/tasks";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { TasksCalendarSection } from "@/components/missions";
import hudStyles from "@/components/hud-test/hud.module.css";

function toDateKeyUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type TasksCalendarAsyncProps = {
  dateStr: string;
  monthParam: string;
  selectedCalendarDay: string;
  calendarView: "today" | "calendar" | "routines" | "overdue";
  backlog: { id: string; title: string | null; due_date: string | null }[];
  simplifiedContent?: boolean;
  /** Skip outer SciFiPanel when nested in TasksTabsShell command deck. */
  commandDeck?: boolean;
};

/** Fetches calendar data in a Suspense boundary so the main tasks page doesn't wait on 3‑month task range or 180‑day events. */
export async function TasksCalendarAsync({
  dateStr,
  monthParam,
  selectedCalendarDay,
  calendarView,
  backlog,
  simplifiedContent = false,
  commandDeck = false,
}: TasksCalendarAsyncProps) {
  const [monthYear, monthNumber] = monthParam.split("-").map((p) => parseInt(p, 10));
  const monthStart = new Date(Date.UTC(monthYear, monthNumber - 1, 1, 12));
  const monthEnd = new Date(Date.UTC(monthYear, monthNumber, 0, 12));
  const weekStartOffset = monthStart.getUTCDay();
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - weekStartOffset);
  const nextMonthEnd = new Date(Date.UTC(monthYear, monthNumber + 1, 0, 12));
  const nextWeekEnd = 6 - nextMonthEnd.getUTCDay();
  const nextGridEnd = new Date(nextMonthEnd);
  nextGridEnd.setUTCDate(nextMonthEnd.getUTCDate() + nextWeekEnd);
  const prevMonthStart = new Date(Date.UTC(monthYear, monthNumber - 2, 1, 12));
  const prevWeekStart = prevMonthStart.getUTCDay();
  const prevGridStart = new Date(prevMonthStart);
  prevGridStart.setUTCDate(prevMonthStart.getUTCDate() - prevWeekStart);
  const calendarRangeStart = toDateKeyUTC(prevGridStart);
  const calendarRangeEnd = toDateKeyUTC(nextGridEnd);

  const [tasksByDate, upcomingCalendarEvents, hasGoogle] = await Promise.all([
    getTasksForDateRange(calendarRangeStart, calendarRangeEnd),
    getUpcomingCalendarEvents(dateStr, 180),
    hasGoogleCalendarToken(),
  ]);

  const overdueTasksForCalendar = (backlog ?? [])
    .slice()
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  const section = (
    <TasksCalendarSection
      initialMonth={monthParam}
      initialDay={selectedCalendarDay}
      dateStr={dateStr}
      tasksByDate={(tasksByDate ?? {}) as Record<string, unknown[]>}
      upcomingCalendarEvents={
        upcomingCalendarEvents as {
          id: string;
          title: string | null;
          start_at: string;
          end_at: string;
          is_social: boolean;
          source: string | null;
        }[]
      }
      hasGoogle={hasGoogle}
      initialCalView={calendarView}
      overdueTasks={overdueTasksForCalendar}
      simplifiedLayout={simplifiedContent}
      commandDeckVisuals={commandDeck}
    />
  );

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
            <h2 className="hq-h2 min-w-0 flex-1 text-[var(--text-primary)]">Calendar</h2>
            <Link
              href="/dashboard"
              className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
            >
              HQ
            </Link>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            {section}
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

  if (commandDeck) {
    return <div className="space-y-4">{section}</div>;
  }

  return (
    <SciFiPanel flatFrame variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-0">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      {section}
    </SciFiPanel>
  );
}

import { getTasksForDateRange } from "@/app/actions/tasks";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { todayDateString } from "@/lib/utils/timezone";
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
};

/** Fetches calendar data in a Suspense boundary so the main tasks page doesn't wait on 3‑month task range or 180‑day events. */
export async function TasksCalendarAsync({
  dateStr,
  monthParam,
  selectedCalendarDay,
  calendarView,
  backlog,
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

  return (
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
}

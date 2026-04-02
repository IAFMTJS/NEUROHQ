import { getCalendarTabData } from "@/app/actions/calendar-tab-data";
import { TasksCalendarSection } from "@/components/missions";

type TasksCalendarAsyncProps = {
  dateStr: string;
  monthParam: string;
  selectedCalendarDay: string;
  calendarView: "today" | "calendar" | "routines" | "overdue";
  backlog: { id: string; title: string | null; due_date: string | null }[];
  simplifiedContent?: boolean;
};

/** Fetches calendar data in a Suspense boundary so the main tasks page doesn't wait on 3‑month task range or large event ranges. */
export async function TasksCalendarAsync({
  dateStr,
  monthParam,
  selectedCalendarDay,
  calendarView,
  backlog,
  simplifiedContent = false,
}: TasksCalendarAsyncProps) {
  const { tasksByDate, upcomingCalendarEvents, hasGoogle } = await getCalendarTabData(monthParam, dateStr);

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
      commandDeckVisuals
    />
  );

  return <div className="space-y-4">{section}</div>;
}

"use server";

import { getTasksForDateRange } from "@/app/actions/tasks";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getCalendarTaskRangeForMonth } from "@/lib/calendar-tab-range";

export type CalendarTabEventRow = {
  id: string;
  title: string | null;
  start_at: string;
  end_at: string;
  is_social: boolean;
  source: string | null;
};

/** Payload for /tasks calendar tab + daily snapshot `calendar` slice. */
export type CalendarTabPayload = {
  monthKey: string;
  anchorDate: string;
  rangeStart: string;
  rangeEnd: string;
  tasksByDate: Record<string, unknown[]>;
  upcomingCalendarEvents: CalendarTabEventRow[];
  hasGoogle: boolean;
};

export async function getCalendarTabData(monthParam: string, anchorDate: string): Promise<CalendarTabPayload> {
  const { rangeStart, rangeEnd } = getCalendarTaskRangeForMonth(monthParam);
  const [tasksByDate, upcomingCalendarEvents, hasGoogle] = await Promise.all([
    getTasksForDateRange(rangeStart, rangeEnd),
    getUpcomingCalendarEvents(anchorDate, 60),
    hasGoogleCalendarToken(),
  ]);
  return {
    monthKey: monthParam,
    anchorDate,
    rangeStart,
    rangeEnd,
    tasksByDate: tasksByDate ?? {},
    upcomingCalendarEvents: (upcomingCalendarEvents ?? []) as CalendarTabEventRow[],
    hasGoogle,
  };
}

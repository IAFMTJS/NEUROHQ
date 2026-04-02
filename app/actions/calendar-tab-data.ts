"use server";

import { createClient } from "@/lib/supabase/server";
import { TASK_CALENDAR_RANGE_COLUMNS } from "@/lib/tasks-actions-shared";
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

const CALENDAR_TAB_EVENT_COLUMNS = "id, title, start_at, end_at, is_social, source";

/** ~2 months of agenda rows; matches prior getUpcomingCalendarEvents(anchor, 60). */
const CALENDAR_TAB_EVENT_HORIZON_DAYS = 60;

/**
 * Calendar tab data in one server round-trip: single `getUser` + parallel Supabase queries
 * (was three separate actions each calling `getUser`).
 */
export async function getCalendarTabData(monthParam: string, anchorDate: string): Promise<CalendarTabPayload> {
  const { rangeStart, rangeEnd } = getCalendarTaskRangeForMonth(monthParam);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      monthKey: monthParam,
      anchorDate,
      rangeStart,
      rangeEnd,
      tasksByDate: {},
      upcomingCalendarEvents: [],
      hasGoogle: false,
    };
  }

  const nowIso = new Date().toISOString();
  const eventStart = `${anchorDate}T00:00:00`;
  const eventEndDate = new Date(anchorDate);
  eventEndDate.setDate(eventEndDate.getDate() + CALENDAR_TAB_EVENT_HORIZON_DAYS);
  const eventEndStr = eventEndDate.toISOString().slice(0, 10) + "T00:00:00";

  const [tasksRes, eventsRes, googleRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_CALENDAR_RANGE_COLUMNS)
      .eq("user_id", user.id)
      .gte("due_date", rangeStart)
      .lte("due_date", rangeEnd)
      .is("parent_task_id", null)
      .is("deleted_at", null)
      .or(`snooze_until.is.null,snooze_until.lt.${nowIso}`)
      .order("due_date")
      .order("completed")
      .order("created_at", { ascending: true }),
    supabase
      .from("calendar_events")
      .select(CALENDAR_TAB_EVENT_COLUMNS)
      .eq("user_id", user.id)
      .gte("start_at", eventStart)
      .lt("start_at", eventEndStr)
      .order("start_at", { ascending: true }),
    supabase.from("user_google_tokens").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const byDate: Record<string, unknown[]> = {};
  for (const row of tasksRes.data ?? []) {
    const d = (row as { due_date: string }).due_date;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(row);
  }

  return {
    monthKey: monthParam,
    anchorDate,
    rangeStart,
    rangeEnd,
    tasksByDate: byDate,
    upcomingCalendarEvents: (eventsRes.data ?? []) as CalendarTabEventRow[],
    hasGoogle: !!googleRes.data,
  };
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { getBacklogTasks, getRoutineTasksWithSuggestions, getTasksForDate } from "@/app/actions/tasks";
import { getCalendarTabData } from "@/app/actions/calendar-tab-data";
import { applyPrivateSnapshotCacheHeaders } from "@/lib/server/api-snapshot-headers";
import { applyApiRouteTiming, startApiRouteTimer } from "@/lib/server/api-route-telemetry";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks/bundle
 * Returns a single JSON payload with the core data needed to render `/tasks` from a local-first cache.
 */
export async function GET() {
  const startedAt = startApiRouteTimer();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dateStr = todayDateString();
    const month = dateStr.slice(0, 7);

    const [prefsTasks, backlog, routine, calendar, tasksForDate] = await Promise.all([
      // NOTE: `/tasks` page also needs preferences for simplified mode; keep this bundle page-ready.
      // We intentionally do not pull *all* preferences here, only what the tasks page needs is fine.
      // For now, reuse the existing server action to avoid duplicating logic.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      import("@/app/actions/preferences").then((m) => m.getUserPreferencesOrDefaults()),
      getBacklogTasks(dateStr),
      getRoutineTasksWithSuggestions(dateStr),
      getCalendarTabData(month, dateStr),
      getTasksForDate(dateStr),
    ]);

    const out = {
      dateStr,
      prefs: prefsTasks,
      backlog,
      routine,
      calendar,
      tasksForDate,
    };

    const res = NextResponse.json(out);
    applyPrivateSnapshotCacheHeaders(res);
    applyApiRouteTiming(res, startedAt, "tasks_bundle");
    return res;
  } catch (err) {
    console.error("[API tasks/bundle]", err);
    return NextResponse.json({ error: "Failed to load tasks bundle" }, { status: 500 });
  }
}


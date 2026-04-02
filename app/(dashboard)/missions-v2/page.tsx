import { todayDateString } from "@/lib/utils/timezone";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { MissionsProvider, TasksTabsShell } from "@/components/missions";
import { TasksDailyBootstrap } from "@/components/missions/TasksDailyBootstrap";
import { MissionsV2Client } from "@/components/missions-v2/MissionsV2Client";
import { TasksCalendarAsync } from "@/app/(dashboard)/tasks/TasksCalendarAsync";
import { getBacklogTasks, getRoutineTasksWithSuggestions } from "@/app/actions/tasks";
import type { TasksTabId } from "@/components/missions/TasksTabsShell";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tab?: string; month?: string; day?: string; calView?: string }>;
};

export default async function MissionsV2Page({ searchParams }: Props) {
  const dateStr = todayDateString();
  const params = await searchParams;
  const tabParam = params.tab;
  const activeTab: TasksTabId = tabParam === "routine" ? "routine" : tabParam === "calendar" ? "calendar" : "missions";

  const prefs = await getUserPreferencesOrDefaults();
  const simplifiedFillLayout = prefs.simplified_content === true;

  const headerSection = null;
  const base = "/missions-v2";

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

  const calendarView: CalendarView = isValidCalendarView(params.calView) ? params.calView : "calendar";
  const monthParam = isValidMonthKey(params.month) ? params.month : dateStr.slice(0, 7);
  const dayParam = isValidDayKey(params.day) ? params.day : null;
  const selectedCalendarDay = dayParam ?? dateStr;

  function makeMissionsV2Href(overrides: { tab: TasksTabId; month?: string | null; day?: string | null; calView?: CalendarView }) {
    const search = new URLSearchParams();
    search.set("tab", overrides.tab);
    const nextMonth = overrides.month === undefined ? monthParam : overrides.month ?? undefined;
    const nextDay = overrides.day === undefined ? dayParam ?? undefined : overrides.day ?? undefined;
    const nextCalView = overrides.calView ?? calendarView;
    if (overrides.tab === "calendar") {
      if (nextMonth) search.set("month", nextMonth);
      if (nextDay) search.set("day", nextDay);
      search.set("calView", nextCalView);
    }
    const query = search.toString();
    return query ? `${base}?${query}` : base;
  }

  const missionsHref = makeMissionsV2Href({ tab: "missions" });
  const calendarHref = makeMissionsV2Href({ tab: "calendar" });
  const routineHref = makeMissionsV2Href({ tab: "routine" });

  async function CalendarTabAsync() {
    const backlog = await getBacklogTasks(dateStr);
    return (
      <TasksCalendarAsync
        dateStr={dateStr}
        monthParam={monthParam}
        selectedCalendarDay={selectedCalendarDay}
        calendarView={calendarView}
        backlog={(backlog ?? []) as { id: string; title: string | null; due_date: string | null }[]}
        simplifiedContent={prefs.simplified_content === true}
      />
    );
  }

  async function RoutineTabAsync() {
    const { routineTasks, suggestedDays, suggestedPlans } = await getRoutineTasksWithSuggestions(dateStr);
    const RoutineTaskList = (await import("@/components/missions/RoutineTaskList")).RoutineTaskList;
    return (
      <RoutineTaskList
        routineTasks={routineTasks}
        suggestedDays={suggestedDays}
        suggestedPlans={suggestedPlans}
        dateStr={dateStr}
        commandDeckVisuals
      />
    );
  }

  const tabsShell = (
    <TasksTabsShell
      initialTab={activeTab}
      missionsHref={missionsHref}
      calendarHref={calendarHref}
      routineHref={routineHref}
      header={headerSection}
      fillViewport={simplifiedFillLayout}
      stickyTabs={simplifiedFillLayout}
    >
      {activeTab === "missions" ? <MissionsV2Client dateStr={dateStr} /> : activeTab === "calendar" ? <CalendarTabAsync /> : <RoutineTabAsync />}
    </TasksTabsShell>
  );

  return (
    <main
      className={`tasks-page-root relative isolate overflow-x-hidden ${simplifiedFillLayout ? "flex min-h-0 flex-1 flex-col" : "min-h-screen min-h-[100dvh]"}`}
    >
      <MissionsProvider dateStr={dateStr}>
        <TasksDailyBootstrap dateStr={dateStr} enabled={activeTab === "missions"} />
        <div
          className={
            simplifiedFillLayout
              ? "relative z-10 flex min-h-[calc(100svh-7rem)] w-full max-w-none flex-1 flex-col dashboard-cinematic sm:min-h-[calc(100svh-6.5rem)]"
              : "tasks-page-column container page page-wide relative z-10 pt-4 sm:pt-5"
          }
        >
          <div className="hq-frosted-main-shell">{tabsShell}</div>
        </div>
      </MissionsProvider>
    </main>
  );
}


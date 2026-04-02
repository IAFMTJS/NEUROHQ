import { todayDateString } from "@/lib/utils/timezone";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { MissionsProvider, TasksTabsShell } from "@/components/missions";
import { TasksDailyBootstrap } from "@/components/missions/TasksDailyBootstrap";
import { MissionsV2Client } from "@/components/missions-v2/MissionsV2Client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function MissionsV2Page({ searchParams }: Props) {
  const dateStr = todayDateString();
  const params = await searchParams;
  const tabParam = params.tab;
  const activeTab = tabParam === "routine" ? "routine" : tabParam === "calendar" ? "calendar" : "missions";

  const prefs = await getUserPreferencesOrDefaults();
  const simplifiedFillLayout = prefs.simplified_content === true;

  const headerSection = null;
  const base = "/missions-v2";
  const missionsHref = `${base}?tab=missions`;
  const calendarHref = `${base}?tab=calendar`;
  const routineHref = `${base}?tab=routine`;

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
      {activeTab === "missions" ? (
        <MissionsV2Client dateStr={dateStr} />
      ) : (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-4 text-sm text-[var(--text-muted)]">
          This tab isn’t implemented in Missions V2 yet.
        </div>
      )}
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


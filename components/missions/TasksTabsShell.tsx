import Link from "next/link";

export type TasksTabId = "missions" | "calendar" | "routine";

type Props = {
  initialTab: TasksTabId;
  missionsHref: string;
  calendarHref: string;
  routineHref: string;
  header: React.ReactNode;
  children: React.ReactNode;
};

export function TasksTabsShell({ initialTab, missionsHref, calendarHref, routineHref, header, children }: Props) {
  const tabClass = (tab: TasksTabId) =>
    `dashboard-mini-btn ${
      initialTab === tab ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
    }`;

  return (
    <>
      {header}
      <div className="dashboard-top-strip mt-0">
        <div className="dashboard-top-strip-track">
          <Link
            href={missionsHref}
            className={tabClass("missions")}
            aria-current={initialTab === "missions" ? "page" : undefined}
          >
            Missions
          </Link>
          <Link
            href={calendarHref}
            className={tabClass("calendar")}
            aria-current={initialTab === "calendar" ? "page" : undefined}
          >
            Calendar
          </Link>
          <Link
            href={routineHref}
            className={tabClass("routine")}
            aria-current={initialTab === "routine" ? "page" : undefined}
          >
            Routine
          </Link>
          <span className="dashboard-mini-strip-label">View</span>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        {children}
      </div>
    </>
  );
}


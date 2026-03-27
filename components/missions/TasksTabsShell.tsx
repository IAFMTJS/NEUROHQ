import Link from "next/link";

export type TasksTabId = "missions" | "calendar" | "routine";

type Props = {
  initialTab: TasksTabId;
  missionsHref: string;
  calendarHref: string;
  routineHref: string;
  header: React.ReactNode;
  children: React.ReactNode;
  /** One column fills height; tighter gap (simplified missions). */
  fillViewport?: boolean;
  /** Keep tab row visible while scrolling. */
  stickyTabs?: boolean;
};

export function TasksTabsShell({
  initialTab,
  missionsHref,
  calendarHref,
  routineHref,
  header,
  children,
  fillViewport = false,
  stickyTabs = false,
}: Props) {
  const tabClass = (tab: TasksTabId) =>
    `dashboard-mini-btn ${
      initialTab === tab ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
    }`;

  const tabsWrapperClass = [
    "dashboard-top-strip mt-0",
    fillViewport ? "shrink-0 px-1 sm:px-2" : "",
    stickyTabs
      ? "sticky top-0 z-20 border-b border-[var(--card-border)]/50 bg-[var(--bg-surface)]/85 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg-surface)]/70"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClass = fillViewport
    ? "mt-2 flex min-h-0 flex-1 flex-col gap-0 px-0 sm:px-1"
    : "mt-6 space-y-6";

  const body = (
    <>
      {header}
      <div className={tabsWrapperClass}>
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
      <div className={bodyClass}>
        {children}
      </div>
    </>
  );

  if (fillViewport) {
    return <div className="flex min-h-0 flex-1 flex-col">{body}</div>;
  }

  return body;
}


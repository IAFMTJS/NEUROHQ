import Link from "next/link";

type TabId = "missions" | "calendar";

type Props = {
  initialTab: TabId;
  missionsHref: string;
  calendarHref: string;
  header: React.ReactNode;
  children: React.ReactNode;
};

export function TasksTabsShell({ initialTab, missionsHref, calendarHref, header, children }: Props) {
  const tabClass = (tab: TabId) =>
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
          <span className="dashboard-mini-strip-label">View</span>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        {children}
      </div>
    </>
  );
}


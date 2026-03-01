"use client";

import { useState } from "react";

type TabId = "missions" | "calendar";

type Props = {
  initialTab: TabId;
  header: React.ReactNode;
  missions: React.ReactNode;
  calendar: React.ReactNode;
};

export function TasksTabsShell({ initialTab, header, missions, calendar }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const tabClass = (tab: TabId) =>
    `dashboard-mini-btn ${
      activeTab === tab ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
    }`;

  return (
    <>
      {header}
      <div className="dashboard-top-strip mt-0">
        <div className="dashboard-top-strip-track">
          <button
            type="button"
            className={tabClass("missions")}
            aria-current={activeTab === "missions" ? "page" : undefined}
            onClick={() => setActiveTab("missions")}
          >
            Missions
          </button>
          <button
            type="button"
            className={tabClass("calendar")}
            aria-current={activeTab === "calendar" ? "page" : undefined}
            onClick={() => setActiveTab("calendar")}
          >
            Calendar
          </button>
          <span className="dashboard-mini-strip-label">View</span>
        </div>
      </div>
      <div className="mt-6 space-y-6">
        {activeTab === "missions" && missions}
        {activeTab === "calendar" && calendar}
      </div>
    </>
  );
}


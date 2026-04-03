"use client";

import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";
import type { TasksTabId } from "@/components/missions/tasksTabTypes";

type Props = {
  initialTab: TasksTabId;
  missionsHref: string;
  calendarHref: string;
  routineHref: string;
  header: ReactNode;
  panelMissions: ReactNode;
  panelCalendar: ReactNode;
  panelRoutine: ReactNode;
  fillViewport?: boolean;
  stickyTabs?: boolean;
};

function readTabFromSearch(search: string): TasksTabId {
  const q = new URLSearchParams(search).get("tab");
  if (q === "routine") return "routine";
  if (q === "calendar") return "calendar";
  return "missions";
}

export function TasksTabsShellClient({
  initialTab,
  missionsHref,
  calendarHref,
  routineHref,
  header,
  panelMissions,
  panelCalendar,
  panelRoutine,
  fillViewport = false,
  stickyTabs = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<TasksTabId>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const onPopState = () => {
      setActiveTab(readTabFromSearch(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectTab = useCallback((e: MouseEvent<HTMLAnchorElement>, tab: TasksTabId, href: string) => {
    e.preventDefault();
    setActiveTab(tab);
    window.history.replaceState(window.history.state, "", href);
  }, []);

  const tabStripOuterClass = [
    fillViewport ? "mt-4 shrink-0" : "mt-4",
    stickyTabs
      ? "sticky top-0 z-50 border-b border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.9)] pb-3 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(4,12,22,0.82)]"
      : "",
    "relative pointer-events-auto",
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClass = fillViewport
    ? "mt-4 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
    : "mt-4 space-y-6";

  const deckTitle =
    activeTab === "calendar"
      ? "Calendar · agenda"
      : activeTab === "routine"
        ? "Routine · ritme"
        : "Missies · overzicht";

  const tabStrip = (
    <div className={tabStripOuterClass} role="navigation" aria-label="Tasks tabs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">View</span>
      </div>
      <div className="relative z-[1] flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm pointer-events-auto">
        <a
          id="tasks-tab-missions"
          href={missionsHref}
          className={`${tasksDeckTabClass(activeTab === "missions")} pointer-events-auto`}
          aria-current={activeTab === "missions" ? "page" : undefined}
          onClick={(e) => selectTab(e, "missions", missionsHref)}
        >
          Missions
        </a>
        <a
          id="tasks-tab-calendar"
          href={calendarHref}
          className={`${tasksDeckTabClass(activeTab === "calendar")} pointer-events-auto`}
          aria-current={activeTab === "calendar" ? "page" : undefined}
          onClick={(e) => selectTab(e, "calendar", calendarHref)}
        >
          Calendar
        </a>
        <a
          id="tasks-tab-routine"
          href={routineHref}
          className={`${tasksDeckTabClass(activeTab === "routine")} pointer-events-auto`}
          aria-current={activeTab === "routine" ? "page" : undefined}
          onClick={(e) => selectTab(e, "routine", routineHref)}
        >
          Routine
        </a>
      </div>
    </div>
  );

  const tabBodies = (
    <div className={bodyClass}>
      <section
        id="tasks-tab-panel-missions"
        role="tabpanel"
        aria-labelledby="tasks-tab-missions"
        className={activeTab === "missions" ? undefined : "hidden"}
      >
        {panelMissions}
      </section>
      <section
        id="tasks-tab-panel-calendar"
        role="tabpanel"
        aria-labelledby="tasks-tab-calendar"
        className={activeTab === "calendar" ? undefined : "hidden"}
      >
        {panelCalendar}
      </section>
      <section
        id="tasks-tab-panel-routine"
        role="tabpanel"
        aria-labelledby="tasks-tab-routine"
        className={activeTab === "routine" ? undefined : "hidden"}
      >
        {panelRoutine}
      </section>
    </div>
  );

  const deckInner = (
    <>
      {tabStrip}
      {tabBodies}
    </>
  );

  const body = (
    <>
      {header}
      <DashboardCommandDeckFrame deckTitle={deckTitle} fillViewport={fillViewport}>
        {deckInner}
      </DashboardCommandDeckFrame>
    </>
  );

  if (fillViewport) {
    return <div className="flex min-h-0 flex-1 flex-col">{body}</div>;
  }

  return body;
}

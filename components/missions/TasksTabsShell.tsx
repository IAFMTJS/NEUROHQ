import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardCommandDeckFrame } from "@/components/layout/DashboardCommandDeckFrame";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";

export type TasksTabId = "missions" | "calendar" | "routine";

type Props = {
  initialTab: TasksTabId;
  missionsHref: string;
  calendarHref: string;
  routineHref: string;
  header: ReactNode;
  children: ReactNode;
  /** One column fills height; tighter gap (simplified missions). */
  fillViewport?: boolean;
  /** Keep tab row visible while scrolling. */
  stickyTabs?: boolean;
  /**
   * Strategy / visual-lab style: frosted command card around tab rail + tab bodies.
   * Can combine with fillViewport (simplified /tasks): deck flexes and tab body scrolls.
   */
  commandDeck?: boolean;
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
  commandDeck = false,
}: Props) {
  const tabClass = (tab: TasksTabId) =>
    `dashboard-mini-btn ${
      initialTab === tab ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
    }`;

  const useCommandDeck = commandDeck;

  const tabsWrapperClass = [
    "dashboard-top-strip",
    "mt-0",
    fillViewport ? "shrink-0 px-1 sm:px-2" : "",
    stickyTabs
      ? "sticky top-0 z-20 border-b border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.9)] backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(4,12,22,0.82)]"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClass =
    fillViewport && useCommandDeck
      ? "mt-4 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
      : fillViewport
        ? "mt-2 flex min-h-0 flex-1 flex-col gap-0 px-0 sm:px-1"
        : useCommandDeck
          ? "mt-4 space-y-6"
          : "mt-6 space-y-6";

  const tabStripLegacy = (
    <div className={tabsWrapperClass}>
      <div className="dashboard-top-strip-track" role="navigation" aria-label="Tasks tabs">
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
  );

  const tabStripDeck = (
    <div className={fillViewport ? "mt-4 shrink-0" : "mt-4"} role="navigation" aria-label="Tasks tabs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">View</span>
      </div>
      <div className="flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
        <Link href={missionsHref} className={tasksDeckTabClass(initialTab === "missions")} aria-current={initialTab === "missions" ? "page" : undefined}>
          Missions
        </Link>
        <Link href={calendarHref} className={tasksDeckTabClass(initialTab === "calendar")} aria-current={initialTab === "calendar" ? "page" : undefined}>
          Calendar
        </Link>
        <Link href={routineHref} className={tasksDeckTabClass(initialTab === "routine")} aria-current={initialTab === "routine" ? "page" : undefined}>
          Routine
        </Link>
      </div>
    </div>
  );

  const tabStrip = useCommandDeck ? tabStripDeck : tabStripLegacy;

  const tabBodies = <div className={bodyClass}>{children}</div>;

  const deckTitle =
    initialTab === "calendar" ? "Calendar · agenda" : initialTab === "routine" ? "Routine · ritme" : "Missies · overzicht";

  const deckInner = (
    <>
      {tabStrip}
      {tabBodies}
    </>
  );

  const body = (
    <>
      {header}
      {useCommandDeck ? (
        <DashboardCommandDeckFrame deckTitle={deckTitle} fillViewport={fillViewport}>
          {deckInner}
        </DashboardCommandDeckFrame>
      ) : (
        <>
          {tabStrip}
          {tabBodies}
        </>
      )}
    </>
  );

  if (fillViewport) {
    return <div className="flex min-h-0 flex-1 flex-col">{body}</div>;
  }

  return body;
}


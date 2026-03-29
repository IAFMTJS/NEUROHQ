import Link from "next/link";
import type { ReactNode } from "react";
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
   * Strategy / visual-lab style: frosted command card around tab rail + tab bodies
   * (standard /tasks only; not used with fillViewport).
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

  const useCommandDeck = commandDeck && !fillViewport;

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

  const bodyClass = fillViewport
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
    <div className="mt-4" role="navigation" aria-label="Tasks tabs">
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
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.18)] pb-4">
        <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Command</p>
          <h2 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
            {deckTitle}
          </h2>
        </div>
        <Link
          href="/dashboard"
          className="shrink-0 rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.55)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] shadow-[0_0_18px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)] transition hover:border-[rgba(var(--mode-rgb),0.4)] hover:bg-[rgba(8,26,42,0.65)] hover:text-[var(--text-primary)]"
        >
          ← HQ
        </Link>
      </header>
      {tabStrip}
      {tabBodies}
    </>
  );

  const body = (
    <>
      {header}
      {useCommandDeck ? (
        <div className="tasks-command-deck dashboard-cinematic relative overflow-hidden rounded-2xl">
          <div className="tasks-command-deck-inner flex flex-col gap-0 p-4 md:p-5">{deckInner}</div>
        </div>
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


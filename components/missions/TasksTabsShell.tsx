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
  const tabStripOuterClass = [
    fillViewport ? "mt-4 shrink-0" : "mt-4",
    stickyTabs
      ? "sticky top-0 z-50 border-b border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.9)] pb-3 pt-1 backdrop-blur-md supports-[backdrop-filter]:bg-[rgba(4,12,22,0.82)]"
      : "",
    // Defensive: some decorative layers/overlays can accidentally intercept clicks.
    // Keep tab strip above them and ensure it receives pointer events.
    "relative pointer-events-auto",
  ]
    .filter(Boolean)
    .join(" ");

  const bodyClass = fillViewport
    ? "mt-4 flex min-h-0 flex-1 flex-col gap-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
    : "mt-4 space-y-6";

  const tabStrip = (
    <div className={tabStripOuterClass} role="navigation" aria-label="Tasks tabs">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">View</span>
      </div>
      <div className="relative z-[1] flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.5)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm pointer-events-auto">
        <Link
          href={missionsHref}
          className={`${tasksDeckTabClass(initialTab === "missions")} pointer-events-auto`}
          aria-current={initialTab === "missions" ? "page" : undefined}
        >
          Missions
        </Link>
        <Link
          href={calendarHref}
          className={`${tasksDeckTabClass(initialTab === "calendar")} pointer-events-auto`}
          aria-current={initialTab === "calendar" ? "page" : undefined}
        >
          Calendar
        </Link>
        <Link
          href={routineHref}
          className={`${tasksDeckTabClass(initialTab === "routine")} pointer-events-auto`}
          aria-current={initialTab === "routine" ? "page" : undefined}
        >
          Routine
        </Link>
      </div>
    </div>
  );

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

"use client";

import { usePathname } from "next/navigation";
import { TimezoneSyncBanner } from "@/components/TimezoneSyncBanner";
import { AcceptanceGateLayer } from "@/components/acceptance/AcceptanceGateLayer";
import { PwaStatusChip } from "@/components/PwaStatusChip";
import type { ReactNode } from "react";

function isDashboardHome(pathname: string) {
  const p = (pathname.replace(/\/$/, "") || "/") as string;
  return p === "/dashboard";
}

function isTasksRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/tasks" || p.startsWith("/tasks/");
}

function isProfileRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/profile" || p.startsWith("/profile/");
}

const mainPaddingStyle = {
  paddingLeft: "var(--hq-padding-x)",
  paddingRight: "var(--hq-padding-x)",
  paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--main-padding-top, 40px))",
  paddingBottom:
    "calc(var(--footer-height, 58px) + var(--bottom-nav-arch, 28px) + env(safe-area-inset-bottom) + var(--main-padding-bottom, 16px))",
} as const;

type Props = {
  children: ReactNode;
};

/** Scroll shell: global frost is on `#app-shell`; hub pages (all except `/dashboard`) get `hq-deck-ambient-shell` like Missions. */
export function DashboardMainContent({ children }: Props) {
  const pathname = usePathname();
  const dashboardHome = isDashboardHome(pathname);
  const tasksShell = !dashboardHome && isTasksRoute(pathname);
  const profileShell = !dashboardHome && isProfileRoute(pathname);
  const deckAmbient = !dashboardHome;

  return (
    <main
      id="main-content"
      data-page-surface={dashboardHome ? "dashboard-home" : "flat-glass"}
      data-page-route={tasksShell ? "tasks" : profileShell ? "profile" : undefined}
      className={`scrollbar-hide relative z-10 min-h-0 flex-1 overflow-auto ${
        deckAmbient ? "hq-deck-ambient-shell" : "bg-transparent"
      }`}
      style={mainPaddingStyle}
      tabIndex={-1}
    >
      <TimezoneSyncBanner />
      <PwaStatusChip />
      <AcceptanceGateLayer />
      {children}
      <div className="bottom-nav-page-spacer" aria-hidden />
    </main>
  );
}

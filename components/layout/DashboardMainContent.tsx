"use client";

import { usePathname } from "next/navigation";
import { TimezoneSyncBanner } from "@/components/TimezoneSyncBanner";
import { AcceptanceGateLayer } from "@/components/acceptance/AcceptanceGateLayer";
import { PageMascot } from "@/components/PageMascot";
import type { ReactNode } from "react";

function isDashboardHome(pathname: string) {
  const p = (pathname.replace(/\/$/, "") || "/") as string;
  return p === "/dashboard";
}

function isTasksRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/tasks" || p.startsWith("/tasks/");
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

/** Scroll shell: hub frost is `#app-shell` (flatGlassPageRoot + dashboard container in root layout); `/tasks` adds `tasks-route-shell` on main. */
export function DashboardMainContent({ children }: Props) {
  const pathname = usePathname();
  const dashboardHome = isDashboardHome(pathname);
  const tasksShell = !dashboardHome && isTasksRoute(pathname);

  return (
    <main
      id="main-content"
      data-page-surface={dashboardHome ? "dashboard-home" : "flat-glass"}
      data-page-route={tasksShell ? "tasks" : undefined}
      className={`scrollbar-hide relative z-10 min-h-0 flex-1 overflow-auto ${
        tasksShell ? "tasks-route-shell" : "bg-transparent"
      }`}
      style={mainPaddingStyle}
      tabIndex={-1}
    >
      <TimezoneSyncBanner />
      <AcceptanceGateLayer />
      <PageMascot />
      {children}
      <div className="bottom-nav-page-spacer" aria-hidden />
    </main>
  );
}

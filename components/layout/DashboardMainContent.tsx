"use client";

import { usePathname } from "next/navigation";
import { TimezoneSyncBanner } from "@/components/TimezoneSyncBanner";
import { PlatformEventsBanner } from "@/components/platform/PlatformEventsBanner";
import { AcceptanceGateLayer } from "@/components/acceptance/AcceptanceGateLayer";
import { PwaStatusChip } from "@/components/PwaStatusChip";
import type { ReactNode } from "react";

function isTasksRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/tasks" || p.startsWith("/tasks/");
}

function isProfileRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/profile" || p.startsWith("/profile/");
}

/** Top safe area is on `body` (globals); avoid double-counting here. Horizontal insets keep PWA content off curved edges in landscape. */
const mainPaddingStyle = {
  paddingLeft: "max(var(--hq-padding-x), env(safe-area-inset-left, 0px))",
  paddingRight: "max(var(--hq-padding-x), env(safe-area-inset-right, 0px))",
  paddingTop: "var(--main-padding-top, 40px)",
  paddingBottom:
    "calc(var(--footer-height, 58px) + var(--bottom-nav-arch, 28px) + env(safe-area-inset-bottom) + var(--main-padding-bottom, 16px))",
} as const;

type Props = {
  children: ReactNode;
};

/** Scroll shell: global frost is on `#app-shell`; main uses `hq-deck-ambient-shell` on every route (flat-glass ambient). */
export function DashboardMainContent({ children }: Props) {
  const pathname = usePathname();
  const tasksShell = isTasksRoute(pathname);
  const profileShell = isProfileRoute(pathname);

  return (
    <main
      id="main-content"
      data-page-surface="flat-glass"
      data-page-route={tasksShell ? "tasks" : profileShell ? "profile" : undefined}
      className="scrollbar-hide hq-deck-ambient-shell relative z-10 min-h-0 flex-1 overflow-auto"
      style={mainPaddingStyle}
      tabIndex={-1}
    >
      <TimezoneSyncBanner />
      <PlatformEventsBanner />
      <PwaStatusChip />
      <AcceptanceGateLayer />
      {children}
      <div className="bottom-nav-page-spacer" aria-hidden />
    </main>
  );
}

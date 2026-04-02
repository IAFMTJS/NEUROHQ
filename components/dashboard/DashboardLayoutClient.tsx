"use client";

import { useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePriorityNavClick } from "@/lib/navigation/use-priority-nav-click";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ThemeHydrate } from "@/components/providers/ThemeHydrate";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { BootstrapProvider } from "@/components/providers/BootstrapProvider";
import { ActiveTimeTracker } from "@/components/ActiveTimeTracker";
import { NewDayRefresh } from "@/components/NewDayRefresh";
import { RoutePrefetcher } from "@/components/RoutePrefetcher";
import { OfflineQueueSync } from "@/components/OfflineQueueSync";
import { HQStorePersistOnHide } from "@/components/HQStorePersistOnHide";
import { DailySnapshotHQMirror } from "@/components/DailySnapshotHQMirror";
import { PendingXpToast } from "@/components/PendingXpToast";
import { HelpFloatingIcon } from "@/components/HelpFloatingIcon";
import { PushAutoPrompt } from "@/components/notifications/PushAutoPrompt";
import { PushClickTracker } from "@/components/notifications/PushClickTracker";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import type { DashboardSnapshot } from "@/types/daily-snapshot";
import { updateLastActiveDate } from "@/app/actions/behavior";
import { useHQStore } from "@/lib/hq-store";
import { usePeriodicBootstrapRefresh } from "@/lib/daily-bootstrap";
import { useDCICGameState } from "@/lib/dcic/game-state-client";
import { AlertsBell } from "@/components/alerts/AlertsBell";
import { PERIODIC_SNAPSHOT_REFRESH_MINUTES } from "@/lib/client-refresh";
import { MoodInterventionHost } from "@/components/mood/MoodInterventionHost";

const LAST_ACTIVE_STORAGE_KEY = "neurohq-last-active-date";

type Props = {
  children: React.ReactNode;
  initialDashboardSnapshot?: DashboardSnapshot | null;
};

/** Wraps server-rendered <main> with providers and shell. Children = the <main> element from the server layout. */
function isTasksRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/tasks" || p.startsWith("/tasks/");
}

function isProfileRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/profile" || p.startsWith("/profile/");
}

export function DashboardLayoutClient({
  children,
  initialDashboardSnapshot: initialDashboardSnapshotProp,
}: Props) {
  const pathname = usePathname();
  const onPriorityNavClick = usePriorityNavClick();
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const dashboardHomeRoute = normalizedPath === "/dashboard";
  const deckChrome = !dashboardHomeRoute;
  const tasksRoute = isTasksRoute(pathname);
  const profileRoute = isProfileRoute(pathname);
  const deckChromeRoute = tasksRoute || profileRoute;
  const dailySnapshot = useDailySnapshot();
  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const hqMode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const { gameState: dcicGameState } = useDCICGameState();
  const mode = dcicGameState?.mode?.current ?? hqMode;

  // Mirror DCIC mode on <html> so :root-level tokens (--spotlight, --mode-rgb, cinematic
  // layers) apply to html/body for the whole app shell — same as war/recovery.
  // useLayoutEffect runs before paint so the first painted frame matches the active mode.
  useLayoutEffect(() => {
    try {
      const el = document.documentElement;
      el.dataset.mode = mode;
      if (tasksRoute) el.setAttribute("data-shell-route", "tasks");
      else if (profileRoute) el.setAttribute("data-shell-route", "profile");
      else el.removeAttribute("data-shell-route");
      if (typeof document !== "undefined" && document.body) {
        document.body.dataset.mode = mode;
      }
    } catch {
      // best-effort; ignore DOM/SSR issues
    }
  }, [mode, tasksRoute, profileRoute]);

  // Hydrate HQ store from DailySnapshot (single source of truth); no duplicate /api/bootstrap/today fetch.
  useEffect(() => {
    if (dailySnapshot?.date) {
      setTodayDate(dailySnapshot.date);
    }
  }, [dailySnapshot?.date, setTodayDate]);

  /** Keeps HQ store + persisted DailySnapshot aligned with `/api/bootstrap/today` between full preloads. */
  usePeriodicBootstrapRefresh(PERIODIC_SNAPSHOT_REFRESH_MINUTES);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.localStorage.getItem(LAST_ACTIVE_STORAGE_KEY) === today) return;
      window.localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, today);
    } catch {
      // Ignore storage failures and still try the server update once.
    }

    // Update last active date on app start (behavior tracking).
    // Throttle: at most one POST per calendar day per device (`LAST_ACTIVE_STORAGE_KEY` in localStorage).
    updateLastActiveDate().catch((err) => {
      console.error("Failed to update last active date:", err);
      try {
        window.localStorage.removeItem(LAST_ACTIVE_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures.
      }
    });
  }, []);

  const initialDashboardSnapshot =
    initialDashboardSnapshotProp ?? dailySnapshot?.dashboard ?? null;

  return (
    <AppStateProvider>
      <BootstrapProvider>
        <OnboardingProvider>
        <DashboardDataProvider
          initialCritical={initialDashboardSnapshot?.critical}
          initialSecondary={initialDashboardSnapshot?.secondary}
        >
          <>
            <HQStorePersistOnHide />
            <DailySnapshotHQMirror />
            <OfflineQueueSync />
            <PendingXpToast />
            <MoodInterventionHost />
            <PushAutoPrompt />
            <PushClickTracker />
            <div
              className="relative flex min-h-screen max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-transparent"
              data-ui="dark-commander"
              data-mode={mode}
              data-deck-chrome={deckChrome ? "true" : undefined}
              data-route-tasks={tasksRoute ? "true" : undefined}
              data-route-profile={profileRoute ? "true" : undefined}
            >
              <ThemeHydrate />
              <ActiveTimeTracker />
              <NewDayRefresh />
              <RoutePrefetcher />
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <KeyboardShortcuts />
              <HelpFloatingIcon />
              <AlertsBell />
              <Link
                href="/settings"
                onClick={(e) => onPriorityNavClick("/settings", e)}
                className={
                  deckChromeRoute
                    ? "fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[calc(env(safe-area-inset-top,0px)+1.25rem)] z-[70] rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(6,18,30,0.55)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-primary)] shadow-[0_0_20px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md hover:border-[rgba(var(--mode-rgb),0.38)] hover:bg-[rgba(8,26,42,0.65)]"
                    : "fixed right-[max(0.75rem,env(safe-area-inset-right))] top-[calc(env(safe-area-inset-top,0px)+1.25rem)] z-[70] rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-2.5 py-1.5 text-sm font-semibold text-[var(--text-primary)] backdrop-blur hover:bg-[var(--bg-hover)]"
                }
                aria-label="Open settings"
                title="Settings"
              >
                ⚙
              </Link>
              <div className="relative z-10 mx-auto flex min-h-0 max-h-[100dvh] w-full max-w-[100vw] flex-1 flex-col overflow-hidden bg-transparent md:min-h-[640px]">
                {children}
              </div>
              <div className="bottom-nav-underlay" aria-hidden />
              <BottomNavigation />
            </div>
          </>
        </DashboardDataProvider>
        </OnboardingProvider>
      </BootstrapProvider>
    </AppStateProvider>
  );
}


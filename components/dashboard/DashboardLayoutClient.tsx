"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BottomNavigationPortal } from "@/components/ui/BottomNavigationPortal";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ThemeHydrate } from "@/components/providers/ThemeHydrate";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { BootstrapProvider } from "@/components/providers/BootstrapProvider";
import { ActiveTimeTracker } from "@/components/ActiveTimeTracker";
import { NewDayRefresh } from "@/components/NewDayRefresh";
import { DailyDataPackageScheduler } from "@/components/DailyDataPackageScheduler";
import { OfflineQueueSync } from "@/components/OfflineQueueSync";
import { PendingXpToast } from "@/components/PendingXpToast";
import { HelpFloatingIcon } from "@/components/HelpFloatingIcon";
import { PushAutoPrompt } from "@/components/notifications/PushAutoPrompt";
import { PushClickTracker } from "@/components/notifications/PushClickTracker";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import type { DashboardSnapshot } from "@/types/daily-snapshot";
import { useBootstrapToday } from "@/lib/use-bootstrap-today";
import { dashboardFromBootstrapToday } from "@/lib/bootstrap-today-mappers";
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

function isStrategyRoute(pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return p === "/strategy" || p.startsWith("/strategy/");
}

export function DashboardLayoutClient({
  children,
  initialDashboardSnapshot: initialDashboardSnapshotProp,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  /** Same dock + card treatment as Missions on every hub route (incl. HQ home). */
  const tasksRoute = isTasksRoute(pathname);
  const profileRoute = isProfileRoute(pathname);
  const dailySnapshot = useDailySnapshot();
  const bootstrapQuery = useBootstrapToday(dailySnapshot?.date ?? null);
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

  // Calendar day in store: prefer TanStack bootstrap payload (updates after tab refocus) over frozen snapshot.
  useEffect(() => {
    const d =
      (typeof bootstrapQuery.data?.date === "string" && bootstrapQuery.data.date.trim()) ||
      dailySnapshot?.date;
    if (d) setTodayDate(d);
  }, [bootstrapQuery.data?.date, dailySnapshot?.date, setTodayDate]);

  useEffect(() => {
    void import("@/lib/audio/ui-audio-context").then((m) => m.ensureUiAudioUnlockListeners());
  }, []);

  /** Keeps HQ store aligned with `/api/bootstrap/today` between navigations. */
  usePeriodicBootstrapRefresh(PERIODIC_SNAPSHOT_REFRESH_MINUTES);

  /**
   * Profile and Strategy are mostly RSC trees; they do not get new server HTML from bootstrap merge alone.
   * After a browser tab switch, refetch the current route so content matches what a full reload would show.
   */
  const lastHubRefreshAtRef = useRef(0);
  useEffect(() => {
    if (!isProfileRoute(pathname) && !isStrategyRoute(pathname)) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const run = () => {
      if (document.visibilityState !== "visible") return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        debounce = null;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        const now = Date.now();
        if (now - lastHubRefreshAtRef.current < 25_000) return;
        lastHubRefreshAtRef.current = now;
        router.refresh();
      }, 450);
    };
    document.addEventListener("visibilitychange", run);
    return () => {
      document.removeEventListener("visibilitychange", run);
      if (debounce) clearTimeout(debounce);
    };
  }, [pathname, router]);

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

  const initialDashboardSnapshot = useMemo((): DashboardSnapshot | null => {
    return (
      initialDashboardSnapshotProp ??
      dashboardFromBootstrapToday(bootstrapQuery.data) ??
      dailySnapshot?.dashboard ??
      null
    );
  }, [
    initialDashboardSnapshotProp,
    bootstrapQuery.data,
    dailySnapshot?.dashboard,
  ]);

  return (
    <AppStateProvider>
      <BootstrapProvider>
        <OnboardingProvider>
        <DashboardDataProvider
          initialCritical={initialDashboardSnapshot?.critical}
          initialSecondary={initialDashboardSnapshot?.secondary}
        >
          <>
            <OfflineQueueSync />
            <PendingXpToast />
            <MoodInterventionHost />
            <PushAutoPrompt />
            <PushClickTracker />
            <div
              className="relative flex min-h-screen max-h-[100dvh] w-full min-w-0 max-w-full flex-col overflow-x-hidden bg-transparent"
              data-ui="dark-commander"
              data-mode={mode}
              data-deck-chrome="true"
              data-route-tasks={tasksRoute ? "true" : undefined}
              data-route-profile={profileRoute ? "true" : undefined}
            >
              <ThemeHydrate />
              <ActiveTimeTracker />
              <DailyDataPackageScheduler />
              <NewDayRefresh />
              <a href="#main-content" className="skip-link">
                Skip to main content
              </a>
              <KeyboardShortcuts />
              <HelpFloatingIcon />
              <AlertsBell />
              <div className="relative z-10 mx-auto flex min-h-0 max-h-[100dvh] w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-transparent md:min-h-[640px]">
                {children}
              </div>
              <BottomNavigationPortal />
            </div>
          </>
        </DashboardDataProvider>
        </OnboardingProvider>
      </BootstrapProvider>
    </AppStateProvider>
  );
}


"use client";

import { useEffect } from "react";
import Link from "next/link";
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

const LAST_ACTIVE_STORAGE_KEY = "neurohq-last-active-date";

type Props = {
  children: React.ReactNode;
  initialDashboardSnapshot?: DashboardSnapshot | null;
};

/** Wraps server-rendered <main> with providers and shell. Children = the <main> element from the server layout. */
export function DashboardLayoutClient({
  children,
  initialDashboardSnapshot: initialDashboardSnapshotProp,
}: Props) {
  const dailySnapshot = useDailySnapshot();
  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const hqMode = useHQStore((s) => s.gameState?.mode?.current ?? "focus");
  const { gameState: dcicGameState } = useDCICGameState();
  const mode = dcicGameState?.mode?.current ?? hqMode;

  // Important: some cinematic CSS (e.g. `body::before`) reads CSS variables that we
  // only set via `[data-mode="war"|"recovery"]` selectors. To make sure those vars
  // are visible to the `body` pseudo-element, mirror `data-mode` on <html>.
  useEffect(() => {
    try {
      document.documentElement.dataset.mode = mode;
    } catch {
      // best-effort; ignore DOM/SSR issues
    }
  }, [mode]);

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
            <OfflineQueueSync />
            <PendingXpToast />
            <PushAutoPrompt />
            <PushClickTracker />
            <div
              className="relative flex min-h-screen max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-transparent"
              data-ui="dark-commander"
              data-mode={mode}
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
                className="fixed right-3 top-3 z-[70] rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-2.5 py-1.5 text-sm font-semibold text-[var(--text-primary)] backdrop-blur hover:bg-[var(--bg-hover)]"
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


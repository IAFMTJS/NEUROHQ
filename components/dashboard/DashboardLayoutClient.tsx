"use client";

import { useEffect } from "react";
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
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import type { DashboardSnapshot } from "@/types/daily-snapshot";
import { updateLastActiveDate } from "@/app/actions/behavior";
import { useHQStore } from "@/lib/hq-store";

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

  // Hydrate HQ store from DailySnapshot (single source of truth); no duplicate /api/bootstrap/today fetch.
  useEffect(() => {
    if (dailySnapshot?.date) {
      setTodayDate(dailySnapshot.date);
    }
  }, [dailySnapshot?.date, setTodayDate]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (window.localStorage.getItem(LAST_ACTIVE_STORAGE_KEY) === today) return;
      window.localStorage.setItem(LAST_ACTIVE_STORAGE_KEY, today);
    } catch {
      // Ignore storage failures and still try the server update once.
    }

    // Update last active date on app start (behavior tracking).
    // This is throttled per device/day to avoid repeated background POSTs.
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
        <DashboardDataProvider
          initialCritical={initialDashboardSnapshot?.critical}
          initialSecondary={initialDashboardSnapshot?.secondary}
        >
          <>
            <HQStorePersistOnHide />
            <OfflineQueueSync />
            <PendingXpToast />
            <PushAutoPrompt />
            <div
              className="relative flex min-h-screen max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-transparent"
              data-ui="dark-commander"
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
              <div className="relative z-10 mx-auto flex min-h-0 max-h-[100dvh] w-full max-w-[100vw] flex-1 flex-col overflow-hidden bg-transparent md:min-h-[640px]">
                {children}
              </div>
              <BottomNavigation />
            </div>
          </>
        </DashboardDataProvider>
      </BootstrapProvider>
    </AppStateProvider>
  );
}


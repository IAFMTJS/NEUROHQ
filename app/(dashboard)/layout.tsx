"use client";

import { useEffect } from "react";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { PageMascot } from "@/components/PageMascot";
import { ThemeHydrate } from "@/components/providers/ThemeHydrate";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { BootstrapProvider } from "@/components/providers/BootstrapProvider";
import { ActiveTimeTracker } from "@/components/ActiveTimeTracker";
import { NewDayRefresh } from "@/components/NewDayRefresh";
import { RoutePrefetcher } from "@/components/RoutePrefetcher";
import { OfflineQueueSync } from "@/components/OfflineQueueSync";
import { PendingXpToast } from "@/components/PendingXpToast";
import { HelpFloatingIcon } from "@/components/HelpFloatingIcon";
import { PushAutoPrompt } from "@/components/notifications/PushAutoPrompt";
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { updateLastActiveDate } from "@/app/actions/behavior";

const LAST_ACTIVE_STORAGE_KEY = "neurohq-last-active-date";

/** Auth enforced by proxy. Cinematic UI: main, BottomNavigation (no system status bar). */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <AppStateProvider>
      <BootstrapProvider>
        <DashboardDataProvider>
        <>
          <OfflineQueueSync />
          <PendingXpToast />
          <PushAutoPrompt />
          <div className="relative flex min-h-screen max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-transparent" data-ui="dark-commander">
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
              <main
                id="main-content"
                className="scrollbar-hide relative z-10 min-h-0 flex-1 overflow-auto bg-transparent"
                style={{
                  paddingLeft: "var(--hq-padding-x)",
                  paddingRight: "var(--hq-padding-x)",
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + var(--main-padding-top, 40px))",
                  paddingBottom: "calc(var(--footer-height, 60px) + env(safe-area-inset-bottom) + var(--main-padding-bottom, 16px))",
                }}
                tabIndex={-1}
              >
                <PageMascot />
                {children}
              </main>
            </div>
            <BottomNavigation />
          </div>
        </>
        </DashboardDataProvider>
      </BootstrapProvider>
    </AppStateProvider>
  );
}

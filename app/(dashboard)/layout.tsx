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
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { updateLastActiveDate } from "@/app/actions/behavior";

/** Auth enforced by proxy. Cinematic UI: main, BottomNavigation (no system status bar). */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Update last active date on app start (behavior tracking)
    updateLastActiveDate().catch((err) => {
      console.error("Failed to update last active date:", err);
      // Silently fail - this is not critical
    });
  }, []);

  return (
    <AppStateProvider>
      <BootstrapProvider>
        <DashboardDataProvider>
        <>
          <OfflineQueueSync />
          <PendingXpToast />
          <div className="relative flex min-h-screen max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-x-hidden bg-transparent" data-ui="dark-commander">
            <ThemeHydrate />
            <ActiveTimeTracker />
            <NewDayRefresh />
            <RoutePrefetcher />
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <KeyboardShortcuts />
            <div className="relative z-10 mx-auto flex min-h-0 max-h-[100dvh] w-full max-w-[100vw] flex-1 flex-col overflow-hidden bg-transparent md:min-h-[640px]">
              <main
                id="main-content"
                className="scrollbar-hide relative z-10 min-h-0 flex-1 overflow-auto bg-transparent"
                style={{
                  paddingLeft: "var(--hq-padding-x)",
                  paddingRight: "var(--hq-padding-x)",
                  paddingTop: "calc(env(safe-area-inset-top, 0px) + 40px)",
                  paddingBottom: "calc(var(--footer-height, 60px) + env(safe-area-inset-bottom) + 16px)",
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

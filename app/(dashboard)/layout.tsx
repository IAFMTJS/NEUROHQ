import BottomNavigation from "@/components/ui/BottomNavigation";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { PageMascot } from "@/components/PageMascot";
import { ThemeHydrate } from "@/components/providers/ThemeHydrate";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ActiveTimeTracker } from "@/components/ActiveTimeTracker";
import { NewDayRefresh } from "@/components/NewDayRefresh";

/** Auth enforced by middleware. Cinematic UI: main, BottomNavigation (no system status bar). */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
    <div className="relative min-h-screen bg-transparent" data-ui="dark-commander">
      <ThemeHydrate />
      <ActiveTimeTracker />
      <NewDayRefresh />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <KeyboardShortcuts />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col bg-transparent md:min-h-[640px]">
        <main
          id="main-content"
          className="relative z-10 flex-1 overflow-auto bg-transparent"
          style={{
            paddingLeft: "var(--hq-padding-x)",
            paddingRight: "var(--hq-padding-x)",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 40px)",
            paddingBottom: "calc(var(--footer-height, 70px) + env(safe-area-inset-bottom) + 16px)",
          }}
          tabIndex={-1}
        >
          <PageMascot />
          {children}
        </main>
      </div>
      <BottomNavigation />
    </div>
    </AppStateProvider>
  );
}

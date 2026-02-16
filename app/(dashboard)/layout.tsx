import BottomNavigation from "@/components/ui/BottomNavigation";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { ThemeHydrate } from "@/components/providers/ThemeHydrate";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ActiveTimeTracker } from "@/components/ActiveTimeTracker";
import { NewDayRefresh } from "@/components/NewDayRefresh";

/** Auth enforced by middleware. Single BottomNavigation (visual-system v2). */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
    <div className="relative min-h-screen">
      <div className="hq-bg-layer" aria-hidden />
      <div className="hq-vignette" aria-hidden />
      <ThemeHydrate />
      <ActiveTimeTracker />
      <NewDayRefresh />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col md:min-h-[640px]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <KeyboardShortcuts />
        <main
          id="main-content"
          className="main-with-footer relative z-10 flex-1 overflow-auto"
          style={{
            paddingLeft: "var(--hq-padding-x)",
            paddingRight: "var(--hq-padding-x)",
            paddingTop: "var(--space-card)",
            paddingBottom: "var(--space-card)",
          }}
          tabIndex={-1}
        >
          {children}
        </main>
        <BottomNavigation />
      </div>
    </div>
    </AppStateProvider>
  );
}

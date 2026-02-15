import { BottomNav } from "@/components/DashboardNav";
import { QuickAdd } from "@/components/QuickAdd";
import { HQBackground } from "@/components/hq/HQBackground";
import { ThemeHydrate } from "@/components/providers/ThemeHydrate";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ActiveTimeTracker } from "@/components/ActiveTimeTracker";
import { NewDayRefresh } from "@/components/NewDayRefresh";

/** Auth enforced by middleware; layout is sync so nav shows shell + loading immediately. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppStateProvider>
    <div className="relative min-h-screen">
      <ThemeHydrate />
      <ActiveTimeTracker />
      <NewDayRefresh />
      <div className="hq-bg-layer" aria-hidden />
      <HQBackground />
      <div className="hq-vignette" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col md:min-h-[640px]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <QuickAdd />
        <main
          id="main-content"
          className="main-with-footer relative z-10 flex-1 overflow-auto px-5 py-2"
          style={{ paddingLeft: "var(--hq-padding-x)", paddingRight: "var(--hq-padding-x)" }}
          tabIndex={-1}
        >
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
    </AppStateProvider>
  );
}

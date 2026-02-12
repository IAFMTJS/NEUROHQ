import { BottomNav } from "@/components/DashboardNav";
import { HQBackground } from "@/components/hq/HQBackground";

/** Auth enforced by middleware; layout is sync so nav shows shell + loading immediately. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen">
      <div className="hq-bg-layer" aria-hidden />
      <HQBackground />
      <div className="hq-vignette" aria-hidden />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[420px] flex-col md:min-h-[640px]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
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
  );
}

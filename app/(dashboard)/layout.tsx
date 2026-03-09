import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { PageMascot } from "@/components/PageMascot";

/** Auth enforced by proxy. Server renders <main> so client layout hydration matches (no Suspense vs main mismatch). */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayoutClient>
      <main
        id="main-content"
        className="scrollbar-hide relative z-10 min-h-0 flex-1 overflow-auto bg-transparent"
        style={{
          paddingLeft: "var(--hq-padding-x)",
          paddingRight: "var(--hq-padding-x)",
          paddingTop:
            "calc(env(safe-area-inset-top, 0px) + var(--main-padding-top, 40px))",
          paddingBottom:
            "calc(var(--footer-height, 60px) + env(safe-area-inset-bottom) + var(--main-padding-bottom, 16px))",
        }}
        tabIndex={-1}
      >
        <PageMascot />
        {children}
      </main>
    </DashboardLayoutClient>
  );
}

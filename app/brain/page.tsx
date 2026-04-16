import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getXPIdentity } from "@/app/actions/xp";
import { DailyBrainClient } from "@/components/brain/DailyBrainClient";
import { BottomNavigationPortal } from "@/components/ui/BottomNavigationPortal";

export const dynamic = "force-dynamic";

const mainPaddingStyle = {
  paddingLeft: "max(var(--hq-padding-x), env(safe-area-inset-left, 0px))",
  paddingRight: "max(var(--hq-padding-x), env(safe-area-inset-right, 0px))",
  paddingTop: "var(--main-padding-top, 40px)",
  paddingBottom:
    "calc(var(--footer-height, 58px) + var(--bottom-nav-arch, 28px) + env(safe-area-inset-bottom) + var(--main-padding-bottom, 16px))",
} as const;

export default async function BrainStandalonePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const identity = await getXPIdentity(user.id);

  return (
    <>
      <main
        id="main-content"
        data-page-surface="flat-glass"
        className="scrollbar-hide hq-deck-ambient-shell relative z-10 min-h-screen overflow-auto"
        style={mainPaddingStyle}
        tabIndex={-1}
      >
        <div className="container page page-wide dashboard-cinematic relative z-10 pb-10">
          <div className="hq-frosted-main-shell space-y-4">
            <section className="card-simple p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">NeuroHQ</p>
              <h1 className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">Daily Brain</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Snelle standalone brain-training module met lokale gameplay en minimale XP sync.
              </p>
            </section>
            <DailyBrainClient userId={user.id} initialTotalXp={identity.total_xp} />
          </div>
        </div>
        <div className="bottom-nav-page-spacer" aria-hidden>
          <div className="bottom-nav-page-spacer-plate" />
        </div>
      </main>
      <BottomNavigationPortal />
    </>
  );
}

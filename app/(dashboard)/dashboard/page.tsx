import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";
import { GrowthDashboardStrip } from "@/components/growth/GrowthDashboardStrip";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { CornerNode } from "@/components/hud-test/CornerNode";

/** Force dynamic: dashboard uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use layout's DashboardDataProvider (initial from daily snapshot). No duplicate
  // provider so first paint uses snapshot and stays instant for the whole day.
  return (
    <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10">
      <div className="hq-frosted-main-shell">
        <VisualLabCommandDeck>
          <CornerNode corner="top-left" />
          <CornerNode corner="top-right" />
          <div className="space-y-4">
            <Suspense fallback={null}>
              <GrowthDashboardStrip />
            </Suspense>
            <DashboardClientShell />
          </div>
        </VisualLabCommandDeck>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";
import { GrowthDashboardStrip } from "@/components/growth/GrowthDashboardStrip";

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
  // One surface: bridge chrome lives in `DashboardClientShell` (missions-style deck), not a nested gradient shell.
  return (
    <div className="container page page-wide dashboard-page dashboard-cinematic relative z-10 pb-10">
      <div className="hq-frosted-main-shell">
        <div className="space-y-4">
          <Suspense fallback={null}>
            <GrowthDashboardStrip />
          </Suspense>
          <DashboardClientShell />
        </div>
      </div>
    </div>
  );
}

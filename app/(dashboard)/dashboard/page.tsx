import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";
import { GrowthDashboardStrip } from "@/components/growth/GrowthDashboardStrip";
import { SimplifiedPageShell } from "@/components/layout/SimplifiedPageShell";
import { SIMPLIFIED_VIEWPORT_WRAPPER } from "@/lib/simplified-page-layout";

/** Force dynamic: dashboard uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prefs = await getUserPreferencesOrDefaults();
  const simplified = prefs.simplified_content === true;

  // Use layout's DashboardDataProvider (initial from daily snapshot). No duplicate
  // provider so first paint uses snapshot and stays instant for the whole day.
  if (simplified) {
    return (
      <main className="flex min-h-0 flex-1 flex-col">
        <div className={SIMPLIFIED_VIEWPORT_WRAPPER}>
          <SimplifiedPageShell
            title="HQ"
            footerLinks={[
              { href: "/tasks", label: "Missions" },
              { href: "/budget", label: "Budget" },
              { href: "/learning", label: "Growth" },
            ]}
          >
            <div className="space-y-4">
              <Suspense fallback={null}>
                <GrowthDashboardStrip />
              </Suspense>
              <DashboardClientShell />
            </div>
          </SimplifiedPageShell>
        </div>
      </main>
    );
  }

  return (
    <main className="container page page-wide dashboard-page relative z-10 pb-10">
      <Suspense fallback={null}>
        <GrowthDashboardStrip />
      </Suspense>
      <DashboardClientShell />
    </main>
  );
}

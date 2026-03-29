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
  return (
    <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">
      <Suspense fallback={null}>
        <GrowthDashboardStrip />
      </Suspense>
      <DashboardClientShell />
    </div>
  );
}

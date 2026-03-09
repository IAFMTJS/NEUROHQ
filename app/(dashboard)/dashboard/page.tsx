import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { getDashboardCriticalPayload } from "@/app/actions/dashboard-data";
import { DashboardShellSkeleton } from "@/components/Skeleton";

/** Force dynamic: dashboard uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";
/** Stream dashboard: mount the real shell with critical data, then hydrate secondary data on the client. */
async function DashboardCriticalAndShell() {
  const critical = await getDashboardCriticalPayload();
  if (!critical) redirect("/login");
  return (
    <DashboardDataProvider
      initialCritical={critical}
    >
      <DashboardClientShell />
    </DashboardDataProvider>
  );
}

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    return (
      <Suspense
        fallback={
          <main className="container page page-wide dashboard-page relative z-10 pb-10">
            <DashboardShellSkeleton />
          </main>
        }
      >
        <DashboardCriticalAndShell />
      </Suspense>
    );
  } catch (err) {
    console.error("[DashboardPage]", err);
    throw new Error(
      "Dashboard kon niet laden. Vernieuw de pagina of log opnieuw in. Zie Vercel Logs voor [DashboardPage] of [getDashboardPayload]."
    );
  }
}

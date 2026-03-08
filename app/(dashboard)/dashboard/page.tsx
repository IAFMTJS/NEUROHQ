import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { getDashboardPayload } from "@/app/actions/dashboard-data";
import { DashboardSkeleton } from "@/components/Skeleton";

/** Force dynamic: dashboard uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";
/** Stream dashboard: show shell immediately after auth, then stream content when payload is ready. */
async function DashboardPayloadAndShell() {
  const payload = await getDashboardPayload();
  if (!payload) redirect("/login");
  return (
    <DashboardDataProvider
      initialCritical={payload.critical}
      initialSecondary={payload.secondary}
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
            <DashboardSkeleton />
          </main>
        }
      >
        <DashboardPayloadAndShell />
      </Suspense>
    );
  } catch (err) {
    console.error("[DashboardPage]", err);
    throw new Error(
      "Dashboard kon niet laden. Vernieuw de pagina of log opnieuw in. Zie Vercel Logs voor [DashboardPage] of [getDashboardPayload]."
    );
  }
}

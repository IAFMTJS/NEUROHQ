import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClientShell } from "@/components/dashboard/DashboardClientShell";
import { DashboardDataProvider } from "@/components/providers/DashboardDataProvider";
import { DashboardShellSkeleton } from "@/components/Skeleton";

/** Force dynamic: dashboard uses cookies (auth) and live data. */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Render the full visual shell immediately. DashboardDataProvider + client shell
  // will hydrate from IndexedDB (last-known snapshot) and then fetch fresh data
  // from /api/dashboard/data in the background.
  return (
    <main className="container page page-wide dashboard-page relative z-10 pb-10">
      <DashboardDataProvider>
        <DashboardClientShell />
      </DashboardDataProvider>
    </main>
  );
}

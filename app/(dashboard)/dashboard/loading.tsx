import { DashboardShellSkeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function DashboardLoading() {
  return (
    <LoadingScene
      title="XP Command Deck is loading"
      subtitle="Booting dashboard, missions, economy and analytics. Visual shell is ready; data syncs from Supabase."
    >
      <div className="container page page-wide dashboard-page relative z-10 pb-10">
        <DashboardShellSkeleton />
      </div>
    </LoadingScene>
  );
}

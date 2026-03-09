import { DashboardShellSkeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="container page page-wide dashboard-page relative z-10 pb-10">
      <DashboardShellSkeleton />
    </main>
  );
}

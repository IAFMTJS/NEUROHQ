import { DashboardPageSkeleton } from "@/components/Skeleton";

export default function ReportLoading() {
  return (
    <main className="container page page-wide relative z-10 pb-10">
      <DashboardPageSkeleton />
    </main>
  );
}

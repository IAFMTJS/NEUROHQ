import { DashboardShellSkeleton } from "@/components/Skeleton";

/** Pre-render dashboard shell during route transition — avoids blank screen (psychological UX). */
export default function DashboardLoading() {
  return (
    <main className="container page page-wide dashboard-page relative z-10 pb-10">
      <DashboardShellSkeleton />
    </main>
  );
}

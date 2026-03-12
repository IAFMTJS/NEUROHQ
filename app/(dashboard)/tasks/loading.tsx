import { TasksPageSkeleton } from "@/components/Skeleton";

/** Pre-render tasks shell during route transition — avoids blank screen. */
export default function TasksLoading() {
  return (
    <main className="container page page-wide relative z-10 pb-10">
      <TasksPageSkeleton />
    </main>
  );
}

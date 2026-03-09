import { Skeleton } from "@/components/Skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-4 md:p-5">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-44 w-full rounded-[24px]" />
      <div className="flex flex-wrap justify-end gap-2">
        <Skeleton className="h-10 w-44 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <div className="dashboard-top-strip mt-0">
        <div className="dashboard-top-strip-track">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
      <div className="rounded-[24px] border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-4 md:p-5">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}

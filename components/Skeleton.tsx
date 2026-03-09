export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-neutral-700/60 ${className}`}
      aria-hidden
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-1 h-4 w-24" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="space-y-4">
      <div className="dashboard-top-strip">
        <div className="dashboard-top-strip-track">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-12 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-px w-full rounded-none" />
      <div className="rounded-[28px] border border-[var(--card-border)] bg-[var(--bg-surface)]/40 p-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-4 h-10 w-56" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
        <Skeleton className="mt-6 h-14 w-44 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="min-h-[180px] rounded-[22px]" />
        <Skeleton className="min-h-[180px] rounded-[22px]" />
        <Skeleton className="min-h-[220px] rounded-[22px]" />
        <Skeleton className="min-h-[220px] rounded-[22px]" />
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--bg-surface)]/60 border border-[var(--card-border)]/40 ${className}`}
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
      <div className="rounded-[28px] border border-[var(--glass-border-soft)] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95)_0%,_rgba(3,7,18,0.98)_55%,_rgba(3,7,18,1)_100%)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          Command Center
        </p>
        <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
          Loading your day…
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xl">
          Energy, focus, missions and budget will appear in a moment. You can already orient yourself in the bridge.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-surface)]/70 p-4">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-1 h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-surface)]/70 p-4">
          <Skeleton className="mb-3 h-4 w-32" />
          <Skeleton className="mb-2 h-5 w-36" />
          <Skeleton className="mb-1 h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
        <div className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-surface)]/70 p-4">
          <Skeleton className="mb-3 h-4 w-24" />
          <Skeleton className="mb-2 h-5 w-32" />
          <Skeleton className="mb-1 h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <div className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-surface)]/70 p-4">
          <Skeleton className="mb-3 h-4 w-28" />
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-1 h-3 w-full" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </div>
    </div>
  );
}

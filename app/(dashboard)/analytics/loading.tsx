import { Skeleton } from "@/components/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-[var(--hq-card-radius-sharp)]" />
      <Skeleton className="h-48 w-full rounded-[var(--hq-card-radius-sharp)]" />
      <Skeleton className="h-24 w-full rounded-[var(--hq-card-radius-sharp)]" />
    </div>
  );
}

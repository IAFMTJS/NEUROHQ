import { Skeleton } from "@/components/Skeleton";

export default function BudgetLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="rounded-xl overflow-hidden border border-[var(--card-border)]">
        <Skeleton className="h-12 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-3/4" />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-[var(--card-border)]">
        <Skeleton className="h-12 w-full" />
        <div className="p-4">
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden border border-[var(--card-border)]">
        <Skeleton className="h-12 w-full" />
        <div className="p-4 space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-2/3" />
        </div>
      </div>
    </div>
  );
}

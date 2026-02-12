import { Skeleton } from "@/components/Skeleton";

export default function StrategyLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-1 h-4 w-48" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

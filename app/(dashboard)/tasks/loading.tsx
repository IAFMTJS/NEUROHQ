import { Skeleton } from "@/components/Skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-1 h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

import { Skeleton } from "@/components/Skeleton";

export default function LearningLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

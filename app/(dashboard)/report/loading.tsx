import { Skeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function ReportLoading() {
  return (
    <LoadingScene
      title="Reality report is loading"
      subtitle="Compiling your week’s choices, alignment and mood. The report shell appears first so it feels instant."
    >
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-40" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </LoadingScene>
  );
}

import { Skeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function XPLoading() {
  return (
    <LoadingScene
      title="XP Command Center is loading"
      subtitle="Pulling your XP graph, heatmap and commander profile from orbit. The interface arrives first; numbers follow milliseconds later."
    >
      <div className="container page space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-48" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </LoadingScene>
  );
}

import { Skeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function MakerAnalyticsLoading() {
  return (
    <LoadingScene
      title="Maker analytics is loading"
      subtitle="Booting advanced funnels and deep-dive charts for Commander mode."
    >
      <div className="container page page-wide space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </LoadingScene>
  );
}

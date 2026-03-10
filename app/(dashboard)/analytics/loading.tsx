import { Skeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function AnalyticsLoading() {
  return (
    <LoadingScene
      title="Analytics cockpit is loading"
      subtitle="Warming up behavior graphs and XP timelines. Visual frame is active immediately; charts snap in when ready."
    >
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-32 w-full rounded-[var(--hq-card-radius-sharp)]" />
        <Skeleton className="h-48 w-full rounded-[var(--hq-card-radius-sharp)]" />
        <Skeleton className="h-24 w-full rounded-[var(--hq-card-radius-sharp)]" />
      </div>
    </LoadingScene>
  );
}

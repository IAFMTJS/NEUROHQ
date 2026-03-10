import { Skeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function SettingsLoading() {
  return (
    <LoadingScene
      title="Settings console is loading"
      subtitle="Restoring your light UI, notifications and advanced knobs. The console frame appears immediately, then syncs preferences."
    >
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </LoadingScene>
  );
}

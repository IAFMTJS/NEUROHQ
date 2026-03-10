import { Skeleton } from "@/components/Skeleton";
import { LoadingScene } from "@/components/LoadingScene";

export default function LearningLoading() {
  return (
    <LoadingScene
      title="Learning hangar is loading"
      subtitle="Staging reading sessions and reflections. The hangar visuals show up instantly; logs and books follow."
    >
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="mt-1 h-4 w-56" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </LoadingScene>
  );
}

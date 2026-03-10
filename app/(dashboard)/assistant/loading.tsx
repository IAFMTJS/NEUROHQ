import { LoadingScene } from "@/components/LoadingScene";

export default function AssistantLoading() {
  return (
    <LoadingScene
      title="Assistant console is loading"
      subtitle="Syncing conversations, context and brain maps. The console wakes up instantly; history fills in right after."
    />
  );
}

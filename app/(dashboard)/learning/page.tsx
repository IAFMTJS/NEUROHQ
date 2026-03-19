import { HQPageHeader } from "@/components/hq";
import { getLearningState } from "@/app/actions/learning-state";
import { LearningContentClient } from "@/components/growth/LearningContentClient";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ toward?: string }> };

function LearningShell() {
  return (
    <>
      <HQPageHeader
        title="Growth"
        subtitle="Mission control for deliberate learning: direction, rhythm, execution, and reflection."
        backHref="/dashboard"
      />
      <div className="flex flex-col gap-4">
        <p className="text-xs text-[var(--text-muted)]">
          Build momentum with one clear directive, a protected weekly rhythm, and short feedback loops.
        </p>
      </div>
    </>
  );
}

export default async function LearningPage({ searchParams }: Props) {
  void searchParams;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const learningState = await getLearningState();

  return (
    <div className="container page space-y-6">
      <LearningShell />
      <LearningContentClient todayStr={todayStr} fallback={learningState} />
    </div>
  );
}

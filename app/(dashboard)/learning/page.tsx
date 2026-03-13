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
        subtitle="Learning Command Board — intent, consistency, streams, and reflection."
        backHref="/dashboard"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--text-muted)]">
          Focus on direction, discipline, and conscious reflection. Analytics live on a separate screen to keep this view calm.
        </p>
        <a
          href="/learning/analytics"
          className="inline-flex items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
        >
          Open analytics
        </a>
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

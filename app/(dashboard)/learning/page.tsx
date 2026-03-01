import { HQPageHeader } from "@/components/hq";
import { getLearningState } from "@/app/actions/learning-state";
import { GrowthIntentCard } from "@/components/growth/GrowthIntentCard";
import { GrowthConsistencyCard } from "@/components/growth/GrowthConsistencyCard";
import { GrowthStreamsList } from "@/components/growth/GrowthStreamsList";
import { GrowthReflectionCard } from "@/components/growth/GrowthReflectionCard";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  const params = await searchParams;
  const today = new Date();
  void params; // keep Next.js signature stable if query params are used elsewhere
  const todayStr = today.toISOString().slice(0, 10);
  const learningState = await getLearningState();
  const currentBook = learningState.streams.find((s) => s.type === "book") ?? null;

  return (
    <div className="container page space-y-6">
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
      <div className="space-y-6">
        <GrowthIntentCard
          focus={learningState.focus}
          currentBookTitle={currentBook?.title ?? null}
        />
        <GrowthConsistencyCard
          consistency={learningState.consistency}
          today={todayStr}
        />
        <GrowthStreamsList streams={learningState.streams} />
        <GrowthReflectionCard
          reflection={learningState.reflection}
          today={todayStr}
        />
      </div>
    </div>
  );
}

"use client";

import type { LearningState } from "@/app/actions/learning-state";
import { GrowthIntentCard } from "@/components/growth/GrowthIntentCard";
import { GrowthConsistencyCard } from "@/components/growth/GrowthConsistencyCard";
import { GrowthStreamsList } from "@/components/growth/GrowthStreamsList";
import { GrowthReflectionCard } from "@/components/growth/GrowthReflectionCard";
import { MonthlyBookCard } from "@/components/growth/MonthlyBookCard";
import { AddLearningStreamCard } from "@/components/growth/AddLearningStreamCard";
import { useHQStore } from "@/lib/hq-store";
import { XPBadge } from "@/components/XPBadge";

type Props = {
  todayStr: string;
  fallback: LearningState;
};

export function LearningContentClient({ todayStr, fallback }: Props) {
  const learning: LearningState = fallback;
  const gameState = useHQStore((s) => s.gameState);

  const level = gameState?.level ?? null;
  const totalXp = gameState?.currentXP ?? null;
  const streak = gameState?.streak.current ?? null;
  const mode = gameState?.mode.current ?? "focus";

  const currentBook = learning.streams.find((s) => s.type === "book") ?? null;

  return (
    <div className="space-y-6" data-tutorial="growth-content">
      {level != null && totalXp != null && (
        <section className="card-simple flex items-center justify-between gap-3 px-4 py-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Core engine status
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Level {level} · {streak ?? 0} day streak · Mode:{" "}
              <span className="font-semibold">
                {mode === "war" ? "WAR" : mode === "recovery" ? "RECOVERY" : "FOCUS"}
              </span>
            </p>
          </div>
          <XPBadge totalXp={totalXp} level={level} compact href="/xp" />
        </section>
      )}
      <GrowthIntentCard
        focus={learning.focus}
        currentBookTitle={currentBook?.title ?? null}
      />
      <MonthlyBookCard
        currentBookTitle={currentBook?.title ?? null}
        totalPages={currentBook?.pagesTotal ?? null}
      />
      <AddLearningStreamCard />
      <GrowthConsistencyCard
        consistency={learning.consistency}
        today={todayStr}
      />
      <GrowthStreamsList streams={learning.streams} />
      <GrowthReflectionCard
        reflection={learning.reflection}
        today={todayStr}
      />
    </div>
  );
}


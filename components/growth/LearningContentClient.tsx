"use client";

import type { LearningState } from "@/app/actions/learning-state";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { GrowthIntentCard } from "@/components/growth/GrowthIntentCard";
import { GrowthConsistencyCard } from "@/components/growth/GrowthConsistencyCard";
import { GrowthStreamsList } from "@/components/growth/GrowthStreamsList";
import { GrowthReflectionCard } from "@/components/growth/GrowthReflectionCard";
import { MonthlyBookCard } from "@/components/growth/MonthlyBookCard";
import { AddLearningStreamCard } from "@/components/growth/AddLearningStreamCard";

type Props = {
  todayStr: string;
  fallback: LearningState;
};

export function LearningContentClient({ todayStr, fallback }: Props) {
  const snapshot = useDailySnapshot();
  const snap = snapshot?.learning && snapshot.learning.today === todayStr ? snapshot.learning : null;

  const learning: LearningState = snap
    ? {
        focus: snap.focus as LearningState["focus"],
        streams: snap.streams as LearningState["streams"],
        consistency: snap.consistency as LearningState["consistency"],
        reflection: {
          lastEntryDate: snap.reflection.lastEntryDate,
          reflectionRequired: snap.reflection.reflectionRequired,
          lastUnderstood: fallback.reflection.lastUnderstood ?? null,
          lastDifficult: fallback.reflection.lastDifficult ?? null,
          lastAdjust: fallback.reflection.lastAdjust ?? null,
        },
      }
    : fallback;

  const currentBook = learning.streams.find((s) => s.type === "book") ?? null;

  return (
    <div className="space-y-6">
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


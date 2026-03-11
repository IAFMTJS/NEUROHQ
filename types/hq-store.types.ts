import type { LearningState } from "@/app/actions/learning-state";

/** Snapshot of learning stats and state for device store / bootstrap API. */
export type LearningSnapshot = {
  weeklyMinutes: number;
  weeklyLearningTarget: number;
  learningStreak: number;
  focus: LearningState["focus"] | null;
  streams: LearningState["streams"];
  consistency: LearningState["consistency"];
  reflection: Pick<LearningState["reflection"], "lastEntryDate" | "reflectionRequired">;
};

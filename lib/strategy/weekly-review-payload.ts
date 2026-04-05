/** Stored in strategy_review.weekly_review_payload (JSON). */

export type StrategyReviewPillarAnswers = {
  q1: number;
  q2: number;
  q3: number;
  open: string;
};

export type StrategyWeeklyReviewPayload = {
  savings: StrategyReviewPillarAnswers;
  learning: StrategyReviewPillarAnswers;
  xp: StrategyReviewPillarAnswers;
  discipline: StrategyReviewPillarAnswers;
};

export const STRATEGY_REVIEW_PILLAR_KEYS = ["savings", "learning", "xp", "discipline"] as const;
export type StrategyReviewPillarKey = (typeof STRATEGY_REVIEW_PILLAR_KEYS)[number];

function isLikert(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

function isPillarBlock(x: unknown): x is StrategyReviewPillarAnswers {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    isLikert(o.q1) &&
    isLikert(o.q2) &&
    isLikert(o.q3) &&
    typeof o.open === "string" &&
    o.open.trim().length >= 2
  );
}

export function parseWeeklyReviewPayload(raw: unknown): StrategyWeeklyReviewPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (
    !isPillarBlock(o.savings) ||
    !isPillarBlock(o.learning) ||
    !isPillarBlock(o.xp) ||
    !isPillarBlock(o.discipline)
  ) {
    return null;
  }
  return {
    savings: o.savings,
    learning: o.learning,
    xp: o.xp,
    discipline: o.discipline,
  };
}

export function isWeeklyReviewPayloadComplete(raw: unknown): boolean {
  return parseWeeklyReviewPayload(raw) !== null;
}

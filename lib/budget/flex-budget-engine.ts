/**
 * Base vs flex: strategy multiplier applies to reward chunks only (penalties full weight).
 */

export const FLEX_LOW_LOCK_CENTS = 2000;
export const FLEX_HIGH_UNLOCK_CENTS = 10000;
/** Default week XP bar for flex reward (tunable per product). */
export const FLEX_XP_WEEK_TARGET = 50;

export type FlexRewardMultiplier = 0.5 | 1 | 1.5;

export function flexRewardMultiplierFromStrategy(strategyScorePct: number): FlexRewardMultiplier {
  if (strategyScorePct > 85) return 1.5;
  if (strategyScorePct < 60) return 0.5;
  return 1;
}

export function rewardChunkCents(chunkCents: number, mult: FlexRewardMultiplier): number {
  return Math.round(chunkCents * mult);
}

export function clampFlexDelta(
  currentCents: number,
  capCents: number,
  rawDeltaCents: number
): number {
  if (rawDeltaCents === 0) return 0;
  if (rawDeltaCents > 0) {
    const headroom = Math.max(0, capCents - currentCents);
    return Math.min(rawDeltaCents, headroom);
  }
  const loss = Math.abs(rawDeltaCents);
  return -Math.min(loss, currentCents);
}

export type FlexLockTier = "critical" | "normal" | "bonus";

export function flexLockTier(flexCents: number): FlexLockTier {
  if (flexCents < FLEX_LOW_LOCK_CENTS) return "critical";
  if (flexCents > FLEX_HIGH_UNLOCK_CENTS) return "bonus";
  return "normal";
}

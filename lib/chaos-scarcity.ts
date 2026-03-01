/**
 * Controlled Chaos: max 2/week, +40% XP, fail Load +15.
 * Scarcity: max 1/day, 24h expiry; difficulty by discipline.
 */

export const CHAOS_XP_MULTIPLIER = 1.4;
export const CHAOS_FAIL_LOAD_PENALTY = 15;
export const CHAOS_MAX_PER_WEEK = 2;
export const SCARCITY_MAX_PER_DAY = 1;

export function mayEmitChaosMission(chaosCompletionsOrOffersThisWeek: number): boolean {
  return chaosCompletionsOrOffersThisWeek < CHAOS_MAX_PER_WEEK;
}

export function mayEmitScarcityMission(scarcityCountToday: number): boolean {
  return scarcityCountToday < SCARCITY_MAX_PER_DAY;
}

/** Scarcity difficulty scale by discipline (0–100): high discipline → harder scarcity. */
export function scarcityDifficultyFromDiscipline(disciplineIndex: number): number {
  return 0.3 + (disciplineIndex / 100) * 0.5;
}

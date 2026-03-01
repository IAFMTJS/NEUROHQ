/**
 * Regret Mechanic: missed high-value mission → Missed Opportunity Index.
 * High index → slight XP decay, suggestion bias toward missed type.
 * 3 completions of same type reset regret for that type. No guilt copy.
 */

const XP_DECAY_PER_INDEX = 0.002; // 0.2% per index point, max ~10% at 50
const MAX_REGRET_INDEX = 50;

export function xpModifierFromRegretIndex(missedOpportunityIndex: number): number {
  const capped = Math.min(MAX_REGRET_INDEX, Math.max(0, missedOpportunityIndex));
  return 1 - capped * XP_DECAY_PER_INDEX;
}

export function shouldSuggestMissedType(missedOpportunityIndex: number): boolean {
  return missedOpportunityIndex >= 15;
}

/** After 3 completions of same type in window, reset count for that type. */
export const REGRET_RESET_COMPLETIONS = 3;

/**
 * Cognitive Investment: constants and pure helpers (no server).
 * Used by app/actions/cognitive-investment.ts and XP flow.
 */

export const INVESTMENT_XP_BONUS = 0.25;

/** XP bonus multiplier for invested mission success (+25%). */
export function getInvestmentXpBonus(): number {
  return INVESTMENT_XP_BONUS;
}

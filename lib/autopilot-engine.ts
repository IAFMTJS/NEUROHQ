/**
 * Autopilot Mode: suggest when high volatility, avoidance, planning fatigue.
 * Refuse max 3× per 30d → next suggestion is forced. Framing: "System stabilization".
 */

export const AUTOPILOT_REFUSAL_LIMIT = 3;
export const AUTOPILOT_REFUSAL_WINDOW_DAYS = 30;

export function shouldSuggestAutopilot(params: {
  volatilityIndex: number;
  avoidanceIndex: number;
  planningFatigueScore: number;
}): boolean {
  const { volatilityIndex, avoidanceIndex, planningFatigueScore } = params;
  return (
    volatilityIndex >= 60 ||
    avoidanceIndex >= 65 ||
    (planningFatigueScore >= 0.6 && (volatilityIndex >= 50 || avoidanceIndex >= 55))
  );
}

export function isAutopilotForced(refusalCountLast30: number): boolean {
  return refusalCountLast30 >= AUTOPILOT_REFUSAL_LIMIT;
}

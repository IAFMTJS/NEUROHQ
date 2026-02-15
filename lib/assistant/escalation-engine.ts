/**
 * NEUROHQ Assistant – escalation engine (updatedState → decision).
 * Deterministic; no AI. See Master Plan sectie 5.
 */

import type { EngineState } from "./types";
import type { EscalationDecision } from "./types";

export function evaluateEscalation(state: EngineState): EscalationDecision {
  let tier: 1 | 2 | 3 = 1;
  let triggerType: string | undefined;

  if (state.crisis) {
    return {
      tier: 1,
      identityAlert: false,
      courageFlag: false,
      triggerType: "crisis_suppress",
    };
  }

  // Dual gate: 30+ days and stability > 70 for tier 2/3
  const escalationUnlocked =
    state.daysActive >= 30 && state.stabilityIndex > 70;

  if (escalationUnlocked && state.energy >= 6) {
    if (
      state.avoidanceTrend > 0.8 &&
      state.identityAlignmentScore < 40
    ) {
      tier = 3;
      triggerType = "avoidance_identity_energy";
    } else if (state.avoidanceTrend > 0.6) {
      tier = 2;
      triggerType = "avoidance_energy";
    }
  }

  const identityAlert = state.identityAlignmentScore < 50;
  const courageFlag = state.courageGapScore > 0.7;

  return {
    tier,
    identityAlert,
    courageFlag,
    triggerType,
  };
}

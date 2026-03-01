/**
 * NEUROHQ Assistant – conversation mode router.
 * Deterministic; no AI. See Master Plan sectie 4.6 & 6.
 */

import type { EngineState } from "./types";
import type { EscalationDecision } from "./types";
import type { CrisisAssessment } from "./types";
import type { ConversationMode } from "./types";

export function determineConversationMode(
  state: EngineState,
  escalationDecision: EscalationDecision,
  crisisAssessment: CrisisAssessment
): ConversationMode {
  if (crisisAssessment.active) return "stabilisation";
  if (state.energy <= 3) return "stabilisation";
  if (escalationDecision.tier === 3) return "pressure";
  if (escalationDecision.tier === 2) {
    if (state.identityAlignmentScore < 50) return "reflective";
    return "diagnostic";
  }
  if (state.energy >= 6) return "strategic";
  return "diagnostic";
}

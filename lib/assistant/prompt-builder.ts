/**
 * NEUROHQ Assistant – prompt builder (state + decision + intent + mode + message → system + user).
 * DEPRECATED: No longer used. Responses are assembled by lib/assistant/response-assembly.ts
 * (structured behavioral engine, no AI/LLM). Kept for reference only.
 */

import type { EngineState } from "./types";
import type { EscalationDecision } from "./types";
import type { Intent } from "./types";
import type { ConversationMode } from "./types";
import type { Signals } from "./types";
import type { CrisisAssessment } from "./types";
import type { AssistantFeatureFlags } from "./types";

const SYSTEM_BASE = `NEUROHQ assistant. Reply in 1–2 sentences only. Never moralize or shame. Evidence-based. Low energy = softer. One concrete action or question. Never: diagnose, label, shame, confront without data.`;

export type BuildPromptInput = {
  state: EngineState;
  decision: EscalationDecision;
  intent: Intent;
  conversationMode: ConversationMode;
  signals: Signals;
  crisisAssessment: CrisisAssessment;
  flags: AssistantFeatureFlags;
  userMessage: string;
};

export function buildSystemPrompt(input: BuildPromptInput): string {
  const {
    state,
    decision,
    intent,
    conversationMode,
    crisisAssessment,
    flags,
  } = input;

  let context = `\nContext: mode=${conversationMode} tier=${decision.tier} intent=${intent}. State: energy=${state.energy} focus=${state.focus} avoidance=${(state.avoidanceTrend * 100).toFixed(0)}% IAS=${state.identityAlignmentScore} stability=${state.stabilityIndex} days=${state.daysActive}. identityAlert=${decision.identityAlert} courageFlag=${decision.courageFlag}.`;
  if (crisisAssessment.active) context += ` CRISIS: support only, no confrontation.`;
  if (decision.tier === 2 || decision.tier === 3) context += ` Escalation: statement→evidence→analysis→correction, one concrete action.`;

  return SYSTEM_BASE + context;
}

export function buildUserPrompt(input: BuildPromptInput): string {
  const { userMessage } = input;
  return userMessage.trim();
}

/**
 * NEUROHQ Assistant – shared types for engine state, decision, and conversation.
 * See docs/NEUROHQ_AI_ASSISTANT_MASTER_PLAN.md
 */

export type Intent =
  | "crisis"
  | "rationalisation"
  | "reflection"
  | "execution_update"
  | "status_update";

export type ConversationMode =
  | "stabilisation"
  | "pressure"
  | "reflective"
  | "diagnostic"
  | "strategic";

export type Signals = {
  reportedEnergy: number | null;
  taskCompleted: boolean;
  externalBlame: boolean;
  avoidanceAdmitted: boolean;
  identityDoubt: boolean;
};

export type CrisisAssessment = {
  active: boolean;
  severity: number;
};

export type EngineState = {
  energy: number;
  focus: number;
  sensoryLoad: number;
  sleepHours: number;
  carryOverLevel: number;
  avoidanceTrend: number;
  identityAlignmentScore: number;
  stabilityIndex: number;
  courageGapScore: number;
  defensiveIdentityProbability: number;
  daysActive: number;
  crisis: boolean;
  progress?: number;
  intensityTier?: number;
};

export type EscalationDecision = {
  tier: 1 | 2 | 3;
  identityAlert: boolean;
  courageFlag: boolean;
  triggerType?: string;
};

export type InterpretationResult = {
  intent: Intent;
  signals: Signals;
  crisisAssessment: CrisisAssessment;
  updatedState: EngineState;
  escalationDecision: EscalationDecision;
  conversationMode: ConversationMode;
};

export type AssistantFeatureFlags = {
  confrontationLevel: string;
  identityIntervention: boolean;
  defensiveIdentityDetection: boolean;
  courageAttribution: boolean;
  energyFactCheck: boolean;
};

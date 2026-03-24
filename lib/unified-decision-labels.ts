import type { UnifiedDecision } from "@/lib/unified-decision-engine";

const DECISION_TYPE_LABELS: Record<UnifiedDecision["decisionType"], string> = {
  check_in: "Brain check-in nodig",
  budget_guardrail: "Budget guardrail",
  streak_rescue: "Streak redden",
  recovery_protocol: "Recovery-protocol",
  reduce_overload: "Overload verlagen",
  create_mission: "Missie aanmaken",
  learning_block: "Learning-blok",
  light_mission: "Lichte missie",
  execute_next_mission: "Volgende missie uitvoeren",
};

export function humanizeDecisionType(decisionType: string): string {
  const typed = decisionType as UnifiedDecision["decisionType"];
  if (typed in DECISION_TYPE_LABELS) return DECISION_TYPE_LABELS[typed];
  return decisionType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeReasonCode(reasonCode: string): string {
  return reasonCode
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

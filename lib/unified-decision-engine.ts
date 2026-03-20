import type { BrainMode } from "@/lib/brain-mode";

export type UnifiedDecisionInput = {
  dateStr: string;
  hasBrainCheckIn: boolean;
  tasksCount: number;
  budgetRemainingCents: number | null;
  energyRemaining: number | null;
  brainMode?: BrainMode | null;
};

export type UnifiedDecision = {
  decisionId: string;
  decisionType: "check_in" | "budget_guardrail" | "create_mission" | "light_mission" | "execute_next_mission";
  source: "brain_mode" | "budget_state" | "mission_state" | "assistant_bridge";
  title: string;
  description: string;
  href: string;
  cta: string;
  surface: "dashboard" | "assistant" | "tasks" | "budget";
};

export function deriveUnifiedDecision(input: UnifiedDecisionInput): UnifiedDecision {
  const baseId = `${input.dateStr}-${input.tasksCount}-${input.hasBrainCheckIn ? "checkin" : "nocheckin"}`;
  if (!input.hasBrainCheckIn) {
    return {
      decisionId: `${baseId}-check_in`,
      decisionType: "check_in",
      source: "assistant_bridge",
      title: "Start met een brain check-in",
      description: "Leg eerst energie, focus en load vast zodat alle modules op dezelfde state sturen.",
      href: "/dashboard",
      cta: "Check-in now",
      surface: "dashboard",
    };
  }
  if (input.budgetRemainingCents != null && input.budgetRemainingCents < 0) {
    return {
      decisionId: `${baseId}-budget_guardrail`,
      decisionType: "budget_guardrail",
      source: "budget_state",
      title: "Stabiliseer je budget eerst",
      description: "Je zit over je veilige uitgavenlijn. Verwerk frozen purchases of annuleer impulsen.",
      href: "/budget",
      cta: "Open budget guardrail",
      surface: "budget",
    };
  }
  if (input.tasksCount === 0) {
    return {
      decisionId: `${baseId}-create_mission`,
      decisionType: "create_mission",
      source: "assistant_bridge",
      title: "Genereer je volgende missie",
      description: "Geen actieve missie vandaag. Laat assistant of tasks een haalbare volgende stap bouwen.",
      href: "/assistant",
      cta: "Create mission",
      surface: "assistant",
    };
  }
  if ((input.energyRemaining ?? 0) < 0 || input.brainMode?.suggestRecovery) {
    return {
      decisionId: `${baseId}-light_mission`,
      decisionType: "light_mission",
      source: "brain_mode",
      title: "Kies een lichte missie",
      description: "Je capaciteit is krap. Pak een lage-frictie missie om momentum te houden.",
      href: "/tasks",
      cta: "Open light missions",
      surface: "tasks",
    };
  }
  return {
    decisionId: `${baseId}-execute_next_mission`,
    decisionType: "execute_next_mission",
    source: "mission_state",
    title: "Voer je volgende missie uit",
    description: "Je state is stabiel. Gebruik je huidige capaciteit voor de hoogste impact-taak.",
    href: "/tasks",
    cta: "Start next mission",
    surface: "tasks",
  };
}

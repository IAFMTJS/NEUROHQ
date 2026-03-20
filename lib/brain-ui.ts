import type { BrainMode } from "@/lib/brain-mode";

export type BrainUIInput = {
  hasBrainCheckIn: boolean;
  hasMissionsToday: boolean;
  brainMode?: BrainMode | null;
};

export type BrainUINextAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type BrainUISlot = {
  slotId: "brain" | "today_engine" | "critical_risk" | "next_action" | "secondary";
  priority: number;
};

export type BrainUIResult = {
  nextAction: BrainUINextAction;
  slots: BrainUISlot[];
};

export function deriveBrainUI(input: BrainUIInput): BrainUIResult {
  const nextAction: BrainUINextAction = !input.hasBrainCheckIn
    ? {
        title: "Save brain status first",
        description: "Set energy, focus and load so the engine can generate better mission guidance.",
        href: "#brain-status-modal",
        cta: "Open check-in",
      }
    : input.hasMissionsToday
      ? {
          title: "Start your next mission",
          description: "One focused start now keeps momentum and improves completion odds.",
          href: "/tasks",
          cta: "Go to missions",
        }
      : {
          title: "Log one quick action",
          description: "No mission queued yet. Add one task or quick budget action to unlock momentum.",
          href: "/tasks?add=today",
          cta: "Add mission",
        };

  const slots: BrainUISlot[] = [
    { slotId: "brain", priority: 100 },
    { slotId: "today_engine", priority: 90 },
    { slotId: "critical_risk", priority: 80 },
    { slotId: "next_action", priority: 70 },
    { slotId: "secondary", priority: 60 },
  ];

  // Recovery days push risk before action.
  if (input.brainMode?.suggestRecovery) {
    slots[2] = { slotId: "critical_risk", priority: 95 };
    slots[3] = { slotId: "next_action", priority: 65 };
  }

  return { nextAction, slots };
}

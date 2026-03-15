/**
 * Tip IDs for first-visit contextual tips. Stored in localStorage (neurohq_tips_seen).
 */
export const TIP_IDS = {
  BRAIN_STATUS: "brain-status-check",
  BUDGET_LOG: "budget-log-expense",
  TASKS_ADD: "tasks-add-first",
  GROWTH_GOAL: "growth-set-goal",
  SETTINGS_PUSH: "settings-push",
} as const;

export type TipId = (typeof TIP_IDS)[keyof typeof TIP_IDS];

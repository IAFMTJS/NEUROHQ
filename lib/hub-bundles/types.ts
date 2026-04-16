import type { ProfileHomeBundle } from "@/lib/profile-home-types";

export type HubBundleDomain = "dashboard" | "tasks" | "budget" | "strategy" | "profileHome";

// For now, keep these payloads minimal and iterate as we migrate pages.
export type DashboardBundle = {
  dateStr: string;
  // Dashboard already has its own cache; this exists for symmetry and optional future use.
  payload: unknown;
};

export type TasksBundle = {
  dateStr: string;
  payload: unknown;
};

export type BudgetBundle = {
  dateStr: string;
  payload: unknown;
};

export type StrategyBundle = {
  dateStr: string;
  payload: unknown;
};

export type HubBundlePayloadByDomain = {
  dashboard: DashboardBundle;
  tasks: TasksBundle;
  budget: BudgetBundle;
  strategy: StrategyBundle;
  profileHome: ProfileHomeBundle;
};

export type HubBundlePayload = HubBundlePayloadByDomain[HubBundleDomain];


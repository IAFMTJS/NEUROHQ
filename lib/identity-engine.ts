/**
 * Identity Engine: archetypes, evolution phases, reputation.
 * "Mensen komen terug voor wie ze aan het worden zijn."
 */

export const ARCHETYPES = [
  "strategist",
  "builder",
  "warrior",
  "monk",
  "creator",
  "operator",
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  strategist: "The Strategist",
  builder: "The Builder",
  warrior: "The Warrior",
  monk: "The Monk",
  creator: "The Creator",
  operator: "The Operator",
};

export const EVOLUTION_PHASES = [
  "initiate",
  "stabilizer",
  "optimizer",
  "architect",
  "master",
] as const;

export type EvolutionPhase = (typeof EVOLUTION_PHASES)[number];

export const EVOLUTION_PHASE_LABELS: Record<EvolutionPhase, string> = {
  initiate: "Initiate",
  stabilizer: "Stabilizer",
  optimizer: "Optimizer",
  architect: "Architect",
  master: "Master",
};

export interface ReputationScore {
  discipline: number;   // 0–100, streak & completion
  consistency: number;  // 0–100, 30-day active pattern
  impact: number;       // 0–100, high-difficulty missions
}

/** Reputation inputs from behaviour (for computation). */
export interface ReputationInputs {
  currentStreak: number;
  longestStreak: number;
  activeDaysLast30: number;
  completionsLast30: number;
  highDifficultyCompletionsLast30: number;
  totalCompletionsLast30: number;
}

/** Compute reputation from behaviour. */
export function computeReputation(inputs: ReputationInputs): ReputationScore {
  const {
    currentStreak,
    longestStreak,
    activeDaysLast30,
    completionsLast30,
    highDifficultyCompletionsLast30,
    totalCompletionsLast30,
  } = inputs;

  // Discipline: streak-driven (10-day streak = strong discipline signal)
  const discipline = Math.min(100, Math.round(
    (currentStreak / 14) * 40 + (longestStreak / 30) * 30 + (completionsLast30 >= 20 ? 30 : (completionsLast30 / 20) * 30)
  ));

  // Consistency: 30-day active days and regularity
  const consistency = Math.min(100, Math.round(
    (activeDaysLast30 / 30) * 50 + (totalCompletionsLast30 >= 15 ? 50 : (totalCompletionsLast30 / 15) * 50)
  ));

  // Impact: high-difficulty completions
  const impactDenom = Math.max(1, totalCompletionsLast30);
  const impact = Math.min(100, Math.round((highDifficultyCompletionsLast30 / impactDenom) * 80 + (highDifficultyCompletionsLast30 >= 5 ? 20 : 0)));

  return {
    discipline: Math.max(0, Math.min(100, discipline)),
    consistency: Math.max(0, Math.min(100, consistency)),
    impact: Math.max(0, Math.min(100, impact)),
  };
}

export type CampaignTheme = "physical_transformation" | "business_scaling" | "mental_stability" | "custom";

export const CAMPAIGN_THEME_LABELS: Record<CampaignTheme, string> = {
  physical_transformation: "Fysieke transformatie",
  business_scaling: "Business scaling",
  mental_stability: "Mentale stabiliteit",
  custom: "Eigen campagne",
};

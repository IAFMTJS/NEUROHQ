export type AvoidancePattern = { tag: string; emotion: string };

export type WeekTheme = "environment_reset" | "self_discipline" | "health_body" | "courage";

export type BehaviorProfile = {
  identityTargets: string[];
  avoidancePatterns: AvoidancePattern[];
  energyPattern: "morning_low" | "stable" | "evening_crash";
  disciplineLevel: "low" | "medium" | "high";
  confrontationMode: "mild" | "standard" | "strong";
  /** Dagen inactiviteit voordat Minimal Integrity aangaat (2–5). */
  minimalIntegrityThresholdDays: 2 | 3 | 4 | 5;
  petType: "none" | "dog" | "cat" | "other";
  petAttachmentLevel: 0 | 1 | 2;
  hobbyCommitment: Record<string, number>;
  /** Optional week theme used for mission selection (Environment Reset, Self‑Discipline, Health & Body, Courage). */
  weekTheme: WeekTheme | null;
};

export const DEFAULT_BEHAVIOR_PROFILE: BehaviorProfile = {
  identityTargets: [],
  avoidancePatterns: [],
  energyPattern: "stable",
  disciplineLevel: "medium",
  confrontationMode: "standard",
   // Standaard: na 3 dagen inactiviteit Minimal Integrity‑hint tonen.
  minimalIntegrityThresholdDays: 3,
  petType: "none",
  petAttachmentLevel: 0,
  hobbyCommitment: {},
  weekTheme: null,
};


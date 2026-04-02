import type { MissionIntent, StrategyDomainTask } from "@/lib/tasks-actions-shared";

export type TaskType = "mental" | "physical" | "mixed" | "recovery";

export type TaskPreset = {
  type: TaskType;
  intensity: number;
  durationMinutes: number;
  baseXp: number;
  domain: StrategyDomainTask;
  missionIntent: MissionIntent;
  hobbyTag?: "fitness" | "music" | "language" | "creative";
};

const PRESETS: Record<string, TaskPreset> = {
  study: {
    type: "mental",
    intensity: 75,
    durationMinutes: 60,
    baseXp: 110,
    domain: "learning",
    missionIntent: "alignment",
  },
  cleaning: {
    type: "physical",
    intensity: 60,
    durationMinutes: 45,
    baseXp: 90,
    domain: "discipline",
    missionIntent: "discipline",
  },
  workout: {
    type: "physical",
    intensity: 85,
    durationMinutes: 60,
    baseXp: 130,
    domain: "health",
    missionIntent: "discipline",
    hobbyTag: "fitness",
  },
  relax: {
    type: "recovery",
    intensity: 20,
    durationMinutes: 30,
    baseXp: 50,
    domain: "health",
    missionIntent: "recovery",
  },
};

function includesAny(lower: string, needles: string[]): boolean {
  return needles.some((needle) => lower.includes(needle));
}

export function classifyTaskPreset(title: string): TaskPreset {
  const lower = title.toLowerCase();
  if (includesAny(lower, ["study", "learn", "stud", "leren"])) return PRESETS.study;
  if (includesAny(lower, ["clean", "opruim", "wash", "poets", "kuis"])) return PRESETS.cleaning;
  if (includesAny(lower, ["gym", "workout", "train", "run", "fitness"])) return PRESETS.workout;
  return PRESETS.relax;
}

export function deriveBaseXpFromIntensityDuration(intensity: number, durationMinutes: number): number {
  const raw = intensity * (durationMinutes / 30);
  return Math.max(20, Math.floor(raw));
}


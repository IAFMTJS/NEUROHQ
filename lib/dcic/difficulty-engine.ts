/**
 * Dark Commander - Behavioural Difficulty Engine
 * Scales difficulty from Level 1 to 100: daily missions, duration, cognitive/discomfort tiers, autopilot.
 * No UI; integrates with XP, level, rank, mission completion, and daily reset.
 */

import type { DifficultyEngine, GeneratedMission } from "./types";
import { rankFromLevel, RANKS } from "@/lib/rank-ladder";

/** Level band: [minLevel, maxLevel] inclusive -> engine params. */
interface LevelBand {
  minLevel: number;
  maxLevel: number;
  dailyMissions: number;
  missionDurationMin: number;
  missionDurationMax: number;
  cognitiveTier: number;
  discomfortTier: number;
}

const LEVEL_BANDS: LevelBand[] = [
  { minLevel: 1, maxLevel: 5, dailyMissions: 3, missionDurationMin: 3, missionDurationMax: 10, cognitiveTier: 1, discomfortTier: 1 },
  { minLevel: 6, maxLevel: 10, dailyMissions: 4, missionDurationMin: 10, missionDurationMax: 15, cognitiveTier: 2, discomfortTier: 1 },
  { minLevel: 11, maxLevel: 20, dailyMissions: 5, missionDurationMin: 15, missionDurationMax: 25, cognitiveTier: 3, discomfortTier: 2 },
  { minLevel: 21, maxLevel: 40, dailyMissions: 6, missionDurationMin: 25, missionDurationMax: 45, cognitiveTier: 4, discomfortTier: 3 },
  { minLevel: 41, maxLevel: 60, dailyMissions: 7, missionDurationMin: 45, missionDurationMax: 60, cognitiveTier: 4, discomfortTier: 4 },
  { minLevel: 61, maxLevel: 80, dailyMissions: 8, missionDurationMin: 60, missionDurationMax: 75, cognitiveTier: 5, discomfortTier: 5 },
  { minLevel: 81, maxLevel: 100, dailyMissions: 9, missionDurationMin: 75, missionDurationMax: 90, cognitiveTier: 6, discomfortTier: 6 },
];

/** Autopilot by rank index (0–4): 0 = user chooses, 1 = suggests, 2 = auto-generates, 3 = mandatory, 4 = structured routines. */
function autopilotLevelFromRank(rank: string): number {
  const idx = RANKS.findIndex((r) => r.name === rank);
  if (idx <= 0) return 0;
  if (idx <= 2) return 1;
  if (idx <= 5) return 2;
  if (idx <= 10) return 3;
  return 4;
}

function getBand(level: number): LevelBand {
  const clamped = Math.max(1, Math.min(100, level));
  const band = LEVEL_BANDS.find((b) => clamped >= b.minLevel && clamped <= b.maxLevel);
  return band ?? LEVEL_BANDS[0];
}

/**
 * Updates the difficulty engine for a given level (and derived rank).
 * Call when user levels up or when building game state.
 */
export function updateDifficulty(level: number, rank: string): DifficultyEngine {
  const band = getBand(level);
  return {
    dailyMissions: band.dailyMissions,
    missionDurationMin: band.missionDurationMin,
    missionDurationMax: band.missionDurationMax,
    cognitiveTier: band.cognitiveTier,
    discomfortTier: band.discomfortTier,
    autopilotLevel: autopilotLevelFromRank(rank),
  };
}

/**
 * Same as updateDifficulty but derives rank from level (for use when only level is available).
 */
export function updateDifficultyFromLevel(level: number): DifficultyEngine {
  const rank = rankFromLevel(level);
  return updateDifficulty(level, rank);
}

// ---------------------------------------------------------------------------
// Mission difficulty tier labels (for generation and logic only; no UI strings required here)
// Tier 1: simple actions | 2: discipline | 3: focus | 4: planning | 5: reflection | 6: strategy
// ---------------------------------------------------------------------------

const COGNITIVE_TIER_NAMES: Record<number, string[]> = {
  1: ["Quick action", "Simple check", "One-step task", "Micro habit", "Single action"],
  2: ["Discipline block", "Consistency task", "Habit anchor", "Routine execution", "Commitment slot"],
  3: ["Focus block", "Deep work slot", "Concentration task", "Flow session", "Attention anchor"],
  4: ["Planning session", "Priority review", "Schedule block", "Goal alignment", "Resource plan"],
  5: ["Reflection block", "Review session", "Journal slot", "Retrospective", "Learning extract"],
  6: ["Strategy session", "System design", "Meta-planning", "Decision framework", "Long-game move"],
};

/** Base XP per cognitive tier (scaled by discomfort for final xpReward). */
const BASE_XP_BY_TIER: Record<number, number> = {
  1: 50,
  2: 75,
  3: 100,
  4: 125,
  5: 150,
  6: 175,
};

/** Deterministic-ish seed for daily variety without UI. */
function dailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
}

/** Simple numeric hash for seeding. */
function hashSeed(seed: number, index: number): number {
  let h = (seed * 31 + index) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Generates daily missions from the current difficulty engine.
 * Uses difficultyEngine.dailyMissions, cognitiveTier, discomfortTier, and missionDurationMin/Max.
 */
export function generateDailyMissions(engine: DifficultyEngine): GeneratedMission[] {
  const count = engine.dailyMissions;
  const cognitiveTier = Math.max(1, Math.min(6, engine.cognitiveTier));
  const discomfortTier = Math.max(1, Math.min(6, engine.discomfortTier));
  const minDur = engine.missionDurationMin;
  const maxDur = engine.missionDurationMax;
  const seed = dailySeed();

  const names = COGNITIVE_TIER_NAMES[cognitiveTier] ?? COGNITIVE_TIER_NAMES[1];
  const baseXP = BASE_XP_BY_TIER[cognitiveTier] ?? 50;
  const discomfortMultiplier = 0.9 + discomfortTier * 0.05;

  const out: GeneratedMission[] = [];
  for (let i = 0; i < count; i++) {
    const h = hashSeed(seed, i);
    const nameIndex = h % names.length;
    const name = names[nameIndex];
    const durationRange = maxDur - minDur;
    const estimatedDuration = durationRange <= 0
      ? minDur
      : minDur + (hashSeed(h, i + 1) % (durationRange + 1));
    const xpReward = Math.floor(baseXP * discomfortMultiplier * (0.9 + (h % 21) / 100));

    out.push({
      name: `${name} (T${cognitiveTier})`,
      xpReward: Math.max(25, xpReward),
      difficultyTier: cognitiveTier,
      estimatedDuration,
    });
  }
  return out;
}

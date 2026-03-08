/**
 * Rank ladder (levels 1–100) for the AI-driven behaviour engine.
 * Single source of truth for display rank and rank perks.
 *
 * Fase 1 (1–20): Initiatie — Recruit → Tactical Leader
 * Fase 2 (20–60): Competentie — Captain → Strategic Commander
 * Fase 3 (60–100): Meesterschap — War Architect → Dark Commander
 */

export interface RankStep {
  name: string;
  levelRequired: number;
}

/** Full ladder: level thresholds for each rank. */
export const RANKS: RankStep[] = [
  { name: "Recruit", levelRequired: 1 },
  { name: "Operator", levelRequired: 3 },
  { name: "Specialist", levelRequired: 6 },
  { name: "Commander", levelRequired: 10 },
  { name: "Elite Commander", levelRequired: 15 },
  { name: "Tactical Leader", levelRequired: 20 },
  { name: "Field Captain", levelRequired: 25 },
  { name: "Strategic Captain", levelRequired: 30 },
  { name: "Major", levelRequired: 35 },
  { name: "Senior Major", levelRequired: 40 },
  { name: "Lieutenant Colonel", levelRequired: 45 },
  { name: "Colonel", levelRequired: 50 },
  { name: "Senior Colonel", levelRequired: 55 },
  { name: "Brigade Commander", levelRequired: 60 },
  { name: "Division Commander", levelRequired: 65 },
  { name: "Strategic Commander", levelRequired: 70 },
  { name: "War Architect", levelRequired: 75 },
  { name: "Supreme Strategist", levelRequired: 80 },
  { name: "Apex Commander", levelRequired: 85 },
  { name: "Grand Commander", levelRequired: 90 },
  { name: "Master of Operations", levelRequired: 95 },
  { name: "Dark Commander", levelRequired: 100 },
];

/** Rank perks (unlocks) — not only cosmetic. */
export interface RankPerks {
  moreMissions: boolean;
  skillTreeUnlock: boolean;
  aiAutopilot: boolean;
  eliteMissions: boolean;
  customMissions: boolean;
}

/** Cumulative perks per rank (unlocks persist). */
function buildRankPerks(): Record<string, RankPerks> {
  const out: Record<string, RankPerks> = {};
  let moreMissions = false;
  let skillTreeUnlock = false;
  let aiAutopilot = false;
  let eliteMissions = false;
  let customMissions = false;
  for (const step of RANKS) {
    if (step.name === "Operator") moreMissions = true;
    if (step.name === "Commander") skillTreeUnlock = true;
    if (step.name === "Field Captain") aiAutopilot = true;
    if (step.name === "Colonel") eliteMissions = true;
    if (step.name === "Supreme Strategist") customMissions = true;
    out[step.name] = { moreMissions, skillTreeUnlock, aiAutopilot, eliteMissions, customMissions };
  }
  return out;
}

const RANK_PERKS = buildRankPerks();

const DEFAULT_PERKS: RankPerks = {
  moreMissions: false,
  skillTreeUnlock: false,
  aiAutopilot: false,
  eliteMissions: false,
  customMissions: false,
};

/** Highest rank at or below level. */
export function rankFromLevel(level: number): string {
  let current = RANKS[0];
  for (const step of RANKS) {
    if (level >= step.levelRequired) current = step;
    else break;
  }
  return current.name;
}

/** Perks for a rank (by display name). */
export function getRankPerks(rankName: string): RankPerks {
  return RANK_PERKS[rankName] ?? { ...DEFAULT_PERKS };
}

/** Next rank and level required; null if already at max. */
export function getNextRank(level: number): RankStep | null {
  const currentRank = rankFromLevel(level);
  const idx = RANKS.findIndex((r) => r.name === currentRank);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1] ?? null;
}

/** Whether a level-up at this level means a new rank (promotion). */
export function isRankPromotion(previousLevel: number, newLevel: number): boolean {
  return rankFromLevel(previousLevel) !== rankFromLevel(newLevel);
}

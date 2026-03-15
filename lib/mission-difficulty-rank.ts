/**
 * Difficulty rank for current missions (S = hardest/most impact, D = lightest).
 * Derived from UMS (Unified Mission Score 0–1). Single pipeline for all rank display.
 *
 * Thresholds (configurable here):
 * - S: UMS >= 0.85
 * - A: UMS >= 0.7
 * - B: UMS >= 0.5
 * - C: UMS >= 0.3
 * - D: below 0.3
 */

export type MissionDifficultyRank = "S" | "A" | "B" | "C" | "D";

const RANK_THRESHOLDS = { S: 0.85, A: 0.7, B: 0.5, C: 0.3 } as const;

const RANK_COLORS: Record<MissionDifficultyRank, string> = {
  S: "text-amber-400 border-amber-500/50 bg-amber-500/10",
  A: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
  B: "text-[var(--accent-focus)] border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10",
  C: "text-[var(--text-muted)] border-[var(--card-border)] bg-[var(--bg-surface)]",
  D: "text-[var(--text-muted)]/80 border-[var(--card-border)] bg-[var(--bg-surface)]/50",
};

export function getMissionDifficultyRank(ums: number): MissionDifficultyRank {
  if (ums >= RANK_THRESHOLDS.S) return "S";
  if (ums >= RANK_THRESHOLDS.A) return "A";
  if (ums >= RANK_THRESHOLDS.B) return "B";
  if (ums >= RANK_THRESHOLDS.C) return "C";
  return "D";
}

export function getMissionRankStyle(rank: MissionDifficultyRank): string {
  return RANK_COLORS[rank];
}

/**
 * Difficulty rank for current missions (S = hardest/most impact, D = lightest).
 * Derived from UMS (Unified Mission Score 0–1).
 */

export type MissionDifficultyRank = "S" | "A" | "B" | "C" | "D";

const RANK_COLORS: Record<MissionDifficultyRank, string> = {
  S: "text-amber-400 border-amber-500/50 bg-amber-500/10",
  A: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10",
  B: "text-[var(--accent-focus)] border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10",
  C: "text-[var(--text-muted)] border-[var(--card-border)] bg-[var(--bg-surface)]",
  D: "text-[var(--text-muted)]/80 border-[var(--card-border)] bg-[var(--bg-surface)]/50",
};

export function getMissionDifficultyRank(ums: number): MissionDifficultyRank {
  if (ums >= 0.85) return "S";
  if (ums >= 0.7) return "A";
  if (ums >= 0.5) return "B";
  if (ums >= 0.3) return "C";
  return "D";
}

export function getMissionRankStyle(rank: MissionDifficultyRank): string {
  return RANK_COLORS[rank];
}

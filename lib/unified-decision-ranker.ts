export type UnifiedDecisionRankingMode = "rules" | "hybrid_shadow" | "legacy";

export type UnifiedDecisionRankCandidate = {
  candidateId: string;
  ruleScore: number;
};

export type UnifiedDecisionRankInput = {
  dateStr: string;
  /**
   * Compact feature snapshot used for telemetry/debugging.
   * This intentionally stays generic so model implementations can evolve independently.
   */
  featureSnapshot: Record<string, string | number | boolean | null>;
  candidates: UnifiedDecisionRankCandidate[];
};

export type UnifiedDecisionRankOutput = {
  rankingMode: UnifiedDecisionRankingMode;
  modelVersion: string;
  rankedCandidateIds: string[];
};

function resolveRankingMode(): UnifiedDecisionRankingMode {
  const raw = (process.env.UNIFIED_DECISION_RANKING_MODE ?? "rules").trim().toLowerCase();
  if (raw === "hybrid_shadow") return "hybrid_shadow";
  if (raw === "legacy") return "legacy";
  return "rules";
}

/**
 * Hybrid-ready ranker interface.
 * Current behavior remains deterministic (rule score ordering).
 */
export function rankUnifiedDecisionCandidates(input: UnifiedDecisionRankInput): UnifiedDecisionRankOutput {
  const rankingMode = resolveRankingMode();
  const rankedCandidateIds = [...input.candidates]
    .sort((a, b) => b.ruleScore - a.ruleScore)
    .map((candidate) => candidate.candidateId);
  return {
    rankingMode,
    modelVersion: rankingMode === "rules" ? "rules-v1" : "rules-v1-shadow",
    rankedCandidateIds,
  };
}

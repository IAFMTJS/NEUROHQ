import type { MissionsPipelinePayload } from "@/lib/missions/derive-mission-capacity";

/**
 * Dunne laag voor `deriveUnifiedDecision`: geen UI-structuren, geen volledige `decisionBlocks`,
 * alleen tellingen en ids die regels mogen sturen.
 */
export type UnifiedDecisionMissionsSummary = {
  /** Incomplete taken vandaag in UMS-volgorde (zelfde basis als vroeger `rankedVisibleCount`). */
  todayOpenCount: number;
  /** Hoogste-UMS open taak, of null. */
  topTaskId: string | null;
  overloadRisk: "low" | "medium" | "high";
  recoveryOnly: boolean;
  /** Carry-over of structurele druk-blokken (niet: “heeft taken”). */
  hasBacklog: boolean;
  /** Unieke aanbevolen ids (top pick + kritieke/hoge-druk blokken). */
  recommendedCount: number;
};

export function buildMissionsSummaryForDecision(
  pipeline: MissionsPipelinePayload,
  opts: { carryOverCount: number }
): UnifiedDecisionMissionsSummary {
  const db = pipeline.decisionBlocks;
  const openSorted = db.tasksSortedByUMS.filter((t) => !t.completed);
  const top = openSorted[0] ?? null;
  const carry = Math.max(0, opts.carryOverCount);
  const hasBacklog =
    carry > 0 ||
    db.highPressure.length > 0 ||
    db.alignmentFix.length > 0 ||
    db.streakCritical.length > 0;

  const recIds = new Set<string>();
  if (db.topRecommendation?.id) recIds.add(db.topRecommendation.id);
  for (const t of db.streakCritical) recIds.add(t.id);
  for (const t of db.highPressure.slice(0, 4)) recIds.add(t.id);

  return {
    todayOpenCount: openSorted.length,
    topTaskId: top?.id ?? null,
    overloadRisk: pipeline.capacity.overloadRisk,
    recoveryOnly: !!db.recoveryOnly,
    hasBacklog,
    recommendedCount: recIds.size,
  };
}

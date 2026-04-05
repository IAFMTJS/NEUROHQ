/**
 * Ruwe cijfers voor Strategy Command-kaarten (naast de geaggregeerde pillar-scores).
 */
export type QuarterCommandMetrics = {
  savedThisQuarterCents: number | null;
  savingsTargetCents: number | null;
  xpEarnedThisQuarter: number;
  xpTargetEarned: number | null;
  /** Leer-% zoals in het contract (kan naast protocolmeting bestaan). */
  growthContractTargetPct: number | null;
  /** Werkelijke % die de growth-pijler voedde (protocoltaken of pacing). */
  growthActualPct: number | null;
  /** Doel-% intern in de engine (bijv. 100 bij protocol-gedreven groei). */
  growthEngineTargetPct: number | null;
  taskCompletesInQuarter: number;
  missionOutcomeNegative: number;
  missionOutcomesBreakdown: { skip: number; reschedule: number; delete: number };
};

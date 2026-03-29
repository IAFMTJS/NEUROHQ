/** Serializable result of `getStrategyPacingHints` — safe to pass to client components. */
export type StrategyPacingHints = {
  quarterElapsedFrac: number;
  savingsTargetCents: number | null;
  savedThisQuarterCents: number | null;
  savingsOnTrack: boolean | null;
  learningTargetPct: number | null;
  learningRoughPct: number | null;
  learningOnTrack: boolean | null;
};

/** Serializable result of `getStrategyPacingHints` — safe to pass to client components. */
export type StrategyPacingHints = {
  quarterElapsedFrac: number;
  savingsTargetCents: number | null;
  savedThisQuarterCents: number | null;
  savingsOnTrack: boolean | null;
  learningTargetPct: number | null;
  learningRoughPct: number | null;
  learningOnTrack: boolean | null;
  /** Gezet wanneer leervoortgang uit protocoltaken dit kwartaal komt (i.p.v. alleen week-index). */
  protocolQuarterTasks: {
    completedTasks: number;
    expectedTasks: number;
    weekRangeStart: number;
    weekRangeEnd: number;
    protocolTitle: string;
  } | null;
};

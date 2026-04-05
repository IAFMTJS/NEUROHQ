"use server";

import { getActiveStrategyEngineParams } from "@/app/actions/strategyFocus";
import { sumSavingsContributionsInDateRange } from "@/app/actions/savings";
import { getActiveProtocolQuarterMissionStats } from "@/app/actions/protocol-growth-stats";
import { calendarQuarterBounds } from "@/lib/strategy/engine-params";
import { todayDateString } from "@/lib/utils/timezone";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";

export type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";

function quarterElapsedFraction(todayStr: string, start: string, end: string): number {
  const startMs = new Date(start + "T12:00:00Z").getTime();
  const endMs = new Date(end + "T23:59:59Z").getTime();
  const nowMs = new Date(todayStr + "T12:00:00Z").getTime();
  if (endMs <= startMs) return 1;
  return Math.max(0, Math.min(1, (nowMs - startMs) / (endMs - startMs)));
}

/**
 * Read-only pace vs Strategy engine quarterly targets (savings + learning).
 * Does not write anywhere — avoids conflicting with Budget/Growth CRUD.
 */
export async function getStrategyPacingHints(): Promise<StrategyPacingHints | null> {
  const ep = await getActiveStrategyEngineParams();
  if (!ep) return null;
  const saveT = ep.savings.quarterlyMustSaveCents;
  const learnT = ep.growth.quarterlyLearningProgressTargetPct;
  const xpT = ep.xp.quarterlyTargetXpEarned;
  if (saveT == null && learnT == null && (xpT == null || xpT <= 0)) return null;

  const today = todayDateString();
  const { start, end } = calendarQuarterBounds(today);
  const quarterElapsedFrac = quarterElapsedFraction(today, start, end);

  let savedThisQuarterCents: number | null = null;
  let savingsOnTrack: boolean | null = null;
  if (saveT != null && saveT > 0) {
    /** Pure dates — `contributed_at` is a Postgres `date`; ISO timestamps can skew TZ edge cases. */
    savedThisQuarterCents = await sumSavingsContributionsInDateRange(start, end);
    const expected = saveT * quarterElapsedFrac;
    savingsOnTrack = savedThisQuarterCents >= expected * 0.85;
  }

  let learningRoughPct: number | null = null;
  let learningOnTrack: boolean | null = null;
  let protocolQuarterTasks: StrategyPacingHints["protocolQuarterTasks"] = null;

  const quarterProto = await getActiveProtocolQuarterMissionStats();
  if (quarterProto && quarterProto.expectedTasks > 0) {
    learningRoughPct = Math.min(
      100,
      Math.round((100 * quarterProto.completedTasks) / quarterProto.expectedTasks)
    );
    protocolQuarterTasks = {
      completedTasks: quarterProto.completedTasks,
      expectedTasks: quarterProto.expectedTasks,
      weekRangeStart: quarterProto.weekRangeStart,
      weekRangeEnd: quarterProto.weekRangeEnd,
      protocolTitle: quarterProto.protocolTitle,
    };
    if (learnT != null && learnT > 0) {
      const expectedLearn = learnT * quarterElapsedFrac;
      learningOnTrack = learningRoughPct >= expectedLearn * 0.85;
    }
  }

  return {
    quarterElapsedFrac,
    savingsTargetCents: saveT,
    savedThisQuarterCents,
    savingsOnTrack,
    learningTargetPct: learnT,
    learningRoughPct,
    learningOnTrack,
    protocolQuarterTasks,
  };
}

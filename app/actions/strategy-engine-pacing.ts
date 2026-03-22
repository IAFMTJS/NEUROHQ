"use server";

import { getActiveStrategyEngineParams } from "@/app/actions/strategyFocus";
import { getSavingsContributions } from "@/app/actions/savings";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { progressKey, resolveFocusProtocol } from "@/lib/growth/resolve-focus-protocol";
import { calendarQuarterBounds } from "@/lib/strategy/engine-params";
import { todayDateString } from "@/lib/utils/timezone";

/** Rough week count for progress % when definition total weeks unavailable. */
const ASSUMED_PROTOCOL_WEEKS = 12;

export type StrategyPacingHints = {
  /** Elapsed fraction of current calendar quarter (0–1). */
  quarterElapsedFrac: number;
  savingsTargetCents: number | null;
  savedThisQuarterCents: number | null;
  /** null = unknown / no target */
  savingsOnTrack: boolean | null;
  learningTargetPct: number | null;
  learningRoughPct: number | null;
  learningOnTrack: boolean | null;
};

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
  if (saveT == null && learnT == null) return null;

  const today = todayDateString();
  const { start, end } = calendarQuarterBounds(today);
  const quarterElapsedFrac = quarterElapsedFraction(today, start, end);

  let savedThisQuarterCents: number | null = null;
  let savingsOnTrack: boolean | null = null;
  if (saveT != null && saveT > 0) {
    const rows = await getSavingsContributions({
      fromDate: `${start}T00:00:00.000Z`,
      toDate: `${end}T23:59:59.999Z`,
    });
    savedThisQuarterCents = rows.reduce((s, r) => s + (r.amount_cents ?? 0), 0);
    const expected = saveT * quarterElapsedFrac;
    savingsOnTrack = savedThisQuarterCents >= expected * 0.85;
  }

  let learningRoughPct: number | null = null;
  let learningOnTrack: boolean | null = null;
  if (learnT != null && learnT > 0) {
    const [progressMap, focus, protocols] = await Promise.all([
      getProtocolProgressMap(),
      getGrowthFocus(),
      getProtocolLibrary("nl"),
    ]);
    const active = resolveFocusProtocol(protocols, progressMap, focus);
    if (active) {
      const key = progressKey(active.slug, active.locale);
      const prog = progressMap[key];
      const week = Math.max(1, prog?.current_week_index ?? 1);
      learningRoughPct = Math.min(100, Math.round((week / ASSUMED_PROTOCOL_WEEKS) * 100));
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
  };
}

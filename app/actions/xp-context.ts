"use server";

import { getXP, getXPIdentity } from "@/app/actions/xp";
import { getXPForecast } from "@/app/actions/dcic/xp-forecast";
import { getInsightEngineState, type InsightEngineState } from "@/app/actions/dcic/insight-engine";

export type XPFullContext = {
  /** Huidige totaal XP en level (present). */
  xp: { total_xp: number; level: number };
  /** Uitgebreide identiteit: rank, streak, xp_to_next_level, next_unlock (present). */
  identity: Awaited<ReturnType<typeof getXPIdentity>>;
  /** Voorspelling vandaag: all/half/none scenario's (future). */
  forecast: Awaited<ReturnType<typeof getXPForecast>>;
  /** Insight engine: momentum, trend, xpLast7, xpPrevious7, graphData (past + present). */
  insightState: InsightEngineState | null;
};

/**
 * Eén geconsolideerde XP-context voor het volledige gebruikersaccount:
 * - Past: insightState (xpLast7, xpPrevious7, graphData)
 * - Present: xp, identity (total_xp, level, rank, streak)
 * - Future: forecast (scenarios vandaag)
 * Gebruik op XP-pagina en Insight/Report-pagina.
 */
export async function getXPFullContext(dateStr?: string): Promise<XPFullContext> {
  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  const [xp, identity, forecast, insightState] = await Promise.all([
    getXP(),
    getXPIdentity(),
    getXPForecast(today),
    getInsightEngineState(),
  ]);
  return { xp, identity, forecast, insightState };
}

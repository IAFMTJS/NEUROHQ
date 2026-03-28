import type { GrowthCommandMetrics } from "@/lib/growth/growth-command-metrics";

/** Eén korte zin voor de Growth Status-kaart (Nederlands). */
export function growthStatusCardMessage(metrics: GrowthCommandMetrics): string {
  const p = metrics.ringProgress;
  if (p >= 100) return "Weekdoel gehaald — houd Strategy als kompas.";
  if (p >= 70) return "Op koers — check of Strategy nog matcht.";
  if (p >= 40) return "Tempo drukt — herijk focus in Strategy.";
  return "Achter op schema — pas Strategy of je week aan.";
}

/** Strategy domains for focus allocation. */
export const DOMAINS = ["discipline", "health", "learning", "business"] as const;
export type StrategyDomain = (typeof DOMAINS)[number];

export type WeeklyAllocation = Record<StrategyDomain, number>;

/** Domain label for UI (sync helper — not a Server Action). */
export function domainLabel(d: string): string {
  const labels: Record<string, string> = {
    discipline: "Discipline",
    health: "Health",
    learning: "Learning",
    business: "Business",
  };
  return labels[d] ?? d;
}

/** Planned distribution as fractions 0–1 (for alignment). */
export function distributionFractions(wa: WeeklyAllocation): Record<string, number> {
  const t = 100;
  const out: Record<string, number> = {};
  for (const d of DOMAINS) out[d] = (wa[d] ?? 0) / t;
  return out;
}

/** Alignment score: 1 - (sum |planned - actual| / 2). */
export function alignmentScore(
  planned: Record<string, number>,
  actual: Record<string, number>
): number {
  let sum = 0;
  for (const d of DOMAINS) {
    const p = planned[d] ?? 0;
    const a = actual[d] ?? 0;
    sum += Math.abs(p - a);
  }
  return Math.max(0, Math.min(1, 1 - sum / 2));
}

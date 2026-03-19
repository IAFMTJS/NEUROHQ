import type { Insight } from "@/lib/dcic/finance-engine";

type CanonicalBudgetSignalsInput = {
  remainingToSpendCents: number | null;
  daysUntilNextIncome: number;
  insights: Insight[] | null | undefined;
};

type CanonicalBudgetSignals = {
  safeDailySpendCents: number;
  projectedOverspendCents: number;
  insightsSorted: Insight[];
  topInsight: Insight | null;
};

export function deriveCanonicalBudgetSignals({
  remainingToSpendCents,
  daysUntilNextIncome,
  insights,
}: CanonicalBudgetSignalsInput): CanonicalBudgetSignals {
  const safeDailySpendCents =
    remainingToSpendCents != null && daysUntilNextIncome > 0
      ? Math.floor(remainingToSpendCents / daysUntilNextIncome)
      : 0;

  const projectedOverspendCents =
    remainingToSpendCents != null ? Math.max(0, -remainingToSpendCents) : 0;

  const insightPriority = { critical: 3, warning: 2, suggestion: 1, info: 0 } as const;
  const insightsSorted = [...(insights ?? [])].sort(
    (a, b) => (insightPriority[b.type] ?? 0) - (insightPriority[a.type] ?? 0),
  );
  const topInsight = insightsSorted[0] ?? null;

  return {
    safeDailySpendCents,
    projectedOverspendCents,
    insightsSorted,
    topInsight,
  };
}

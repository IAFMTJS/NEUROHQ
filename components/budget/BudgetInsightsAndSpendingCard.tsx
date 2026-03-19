"use client";

import { useMemo, useState } from "react";
import type { Insight } from "@/lib/dcic/finance-engine";
import { BudgetPatternDetectionCard } from "@/components/budget/BudgetPatternDetectionCard";
import { BudgetCognitiveLoadTrendCard } from "@/components/budget/BudgetCognitiveLoadTrendCard";
import { ExpenseDistributionChart } from "@/components/budget/ExpenseDistributionChart";

type Point = { label: string; value: number };

type Props = {
  categoryTotals: Record<string, number>;
  impulseWindow?: string | null;
  insights: Insight[] | undefined;
  points: Point[];
  currency: string;
};

export function BudgetInsightsAndSpendingCard({
  categoryTotals,
  impulseWindow,
  insights,
  points,
  currency,
}: Props) {
  const [showCharts, setShowCharts] = useState(false);
  const topInsights = useMemo(() => {
    const priority = { critical: 3, warning: 2, suggestion: 1, info: 0 } as const;
    return [...(insights ?? [])]
      .sort((a, b) => (priority[b.type] ?? 0) - (priority[a.type] ?? 0))
      .slice(0, 3);
  }, [insights]);

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Inzichten & bestedingspatronen</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Eerst de kernpatronen, grafieken op aanvraag voor minder cognitieve load.
        </p>
      </div>
      <div className="space-y-4 p-4">
        <BudgetPatternDetectionCard categoryTotals={categoryTotals} impulseWindow={impulseWindow} />
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/30 p-3">
          <p className="text-xs font-medium text-[var(--text-muted)]">Belangrijkste inzichten</p>
          {topInsights.length === 0 ? (
            <p className="mt-1 text-sm text-[var(--text-muted)]">Er zijn op dit moment geen actieve inzichten.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-[var(--text-primary)]">
              {topInsights.map((insight, idx) => (
                <li key={`${insight.type}-${idx}`}>• {insight.message}</li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCharts((v) => !v)}
          className="text-xs font-medium text-[var(--accent-focus)] hover:underline"
        >
          {showCharts ? "Verberg grafieken" : "Toon grafieken"}
        </button>
        {showCharts && (
          <div className="space-y-4">
            <BudgetCognitiveLoadTrendCard points={points} />
            <ExpenseDistributionChart categoryTotals={categoryTotals} currency={currency} />
          </div>
        )}
      </div>
    </section>
  );
}

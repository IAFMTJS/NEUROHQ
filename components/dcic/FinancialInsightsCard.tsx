/**
 * Dark Commander Intelligence Core - Financial Insights Card
 * Shows dynamic insights, warnings, and suggestions
 */

"use client";

import type { Insight } from "@/lib/dcic/finance-engine";

interface FinancialInsightsCardProps {
  insights: Insight[];
}

export function FinancialInsightsCard({ insights }: FinancialInsightsCardProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Insights
        </h3>
        <p className="text-sm text-[var(--text-muted)]">Alles ziet er goed uit.</p>
      </div>
    );
  }

  const getInsightColor = (type: Insight["type"]) => {
    switch (type) {
      case "critical":
        return "text-red-500 border-red-500/20 bg-red-500/10";
      case "warning":
        return "text-yellow-500 border-yellow-500/20 bg-yellow-500/10";
      case "suggestion":
        return "text-blue-500 border-blue-500/20 bg-blue-500/10";
      default:
        return "text-[var(--text-primary)] border-[var(--card-border)] bg-[var(--bg-secondary)]";
    }
  };

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Insights
      </h3>
      
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`rounded border p-3 text-sm ${getInsightColor(insight.type)}`}
          >
            <p>{insight.message}</p>
            {insight.actionable && (
              <p className="mt-1 text-xs opacity-75">Actie vereist</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

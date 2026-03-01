"use client";

import type { FC } from "react";
import type { Insight } from "@/lib/dcic/finance-engine";

type Props = {
  insights: Insight[] | null | undefined;
};

function pickTopInsight(insights: Insight[]): Insight | null {
  if (!insights.length) return null;
  const priority = { critical: 3, warning: 2, suggestion: 1, info: 0 } as const;
  return [...insights].sort((a, b) => (priority[b.type] ?? 0) - (priority[a.type] ?? 0))[0] ?? null;
}

export const BudgetRiskInsightCard: FC<Props> = ({ insights }) => {
  const top = insights && insights.length ? pickTopInsight(insights) : null;

  if (!top) {
    return (
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Risk Insight</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--text-muted)]">
            No active risk signals detected right now.
          </p>
        </div>
      </section>
    );
  }

  const isWarning = top.type === "warning";
  const isCritical = top.type === "critical";

  const borderClass = isCritical || isWarning ? "border-amber-500/70" : "border-[var(--card-border)]";
  const glowClass = isCritical ? "shadow-[0_0_25px_rgba(245,158,11,0.65)]" : "";

  return (
    <section className={`card-simple overflow-hidden p-0 ${glowClass}`}>
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Risk Insight</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          One primary risk surfaced from your recent budget patterns.
        </p>
      </div>
      <div className="p-4">
        <div className={`rounded-lg border ${borderClass} bg-[var(--bg-surface)]/60 px-3 py-2`}>
          <p className="text-sm text-[var(--text-primary)]">{top.message}</p>
        </div>
      </div>
    </section>
  );
};


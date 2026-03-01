"use client";

import type { FC } from "react";
import type { FinanceState } from "@/lib/dcic/types";
import { getLargestCategory, getTotalPotentialSavings } from "@/lib/dcic/finance-engine";

type Props = {
  financeState: FinanceState | null;
};

export const BudgetAchievementsCard: FC<Props> = ({ financeState }) => {
  if (!financeState) return null;

  const discipline = financeState.disciplineScore;
  const largest = getLargestCategory(financeState);
  const potentialSavings = getTotalPotentialSavings(financeState);
  const hasNoOverspend =
    largest != null && financeState.budgetTargets.every((t) => {
      const spent = (largest && t.category === largest.category ? largest.amount : 0);
      return spent <= t.target;
    });

  const badges: string[] = [];
  if (discipline >= 80) badges.push("High Discipline");
  if (hasNoOverspend) badges.push("No Overspend This Cycle");
  if (potentialSavings > 0) badges.push("Subscriptions Audit Ready");

  if (badges.length === 0) {
    badges.push("Finance achievements will unlock as your discipline improves.");
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Finance Achievements</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Lightweight badges based on your current discipline and budget behavior.
        </p>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {badges.map((b) => (
          <span
            key={b}
            className="rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/70 px-3 py-1 text-xs font-medium text-[var(--text-secondary)]"
          >
            {b}
          </span>
        ))}
      </div>
    </section>
  );
};


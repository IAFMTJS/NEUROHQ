/**
 * Dark Commander Intelligence Core - Financial Status Card
 * Shows safe daily spend (budget-based), days until next income, remaining to spend
 * When remainingToSpendCents is passed, uses budget remaining = gemiddelde van het budget/geld dat over is.
 */

"use client";

import type { FinanceState } from "@/lib/dcic/types";
import {
  getDaysUntilNextIncome,
  getRemainingBalance,
} from "@/lib/dcic/finance-engine";

interface FinancialStatusCardProps {
  financeState: FinanceState | null;
  /** Budget-based: (monthly budget − savings − spent this month). When set, Safe Daily Spend = this / days, Remaining = this. */
  remainingToSpendCents?: number | null;
}

export function FinancialStatusCard({ financeState, remainingToSpendCents }: FinancialStatusCardProps) {
  if (!financeState) {
    return (
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
        <p className="text-sm text-[var(--text-muted)]">Finance data niet beschikbaar</p>
      </div>
    );
  }

  const daysUntilIncome = getDaysUntilNextIncome(financeState);
  const useBudgetRemaining =
    remainingToSpendCents != null &&
    (Number.isFinite(remainingToSpendCents) || remainingToSpendCents === 0);

  const remainingBalance = useBudgetRemaining
    ? remainingToSpendCents!
    : getRemainingBalance(financeState);
  const safeDailySpend =
    daysUntilIncome > 0 ? Math.floor(remainingBalance / daysUntilIncome) : 0;
  const isOverBudget = remainingBalance < 0;

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Financial Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm text-[var(--text-muted)]">Safe Daily Spend</span>
          <span className={`text-lg font-semibold ${isOverBudget ? "text-red-500" : "text-[var(--accent-primary)]"}`}>
            €{(safeDailySpend / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] -mt-1">
          {useBudgetRemaining
            ? "Gemiddeld bedrag per dag dat je nog mag uitgeven (resterend budget ÷ dagen tot loon)."
            : isOverBudget
            ? "Over budget: max. dit bedrag per dag om niet verder achter te lopen."
            : "Max. dit bedrag per dag tot volgende inkomst om binnen budget te blijven."}
        </p>
        
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">Days Until Income</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {daysUntilIncome} days
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">
            {useBudgetRemaining ? "Remaining (to spend)" : "Remaining Balance"}
          </span>
          <span className={`text-sm font-medium ${remainingBalance < 0 ? "text-red-500" : "text-[var(--text-primary)]"}`}>
            €{(remainingBalance / 100).toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-[var(--text-muted)]">Discipline Score</span>
          <span className={`text-sm font-semibold ${
            financeState.disciplineScore >= 80 ? "text-green-500" :
            financeState.disciplineScore >= 60 ? "text-yellow-500" :
            "text-red-500"
          }`}>
            {financeState.disciplineScore}/100
          </span>
        </div>
      </div>
    </div>
  );
}

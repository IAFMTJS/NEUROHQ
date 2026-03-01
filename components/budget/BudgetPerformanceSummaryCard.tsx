"use client";

import type { FC } from "react";
import type { FinanceState } from "@/lib/dcic/types";
import {
  calculateBurnRate,
  calculateSafeDailySpend,
  forecastEndOfCycle,
} from "@/lib/dcic/finance-engine";

type Props = {
  financeState: FinanceState | null;
  remainingToSpendCents: number | null;
  periodLabel: string;
};

export const BudgetPerformanceSummaryCard: FC<Props> = ({
  financeState,
  remainingToSpendCents,
  periodLabel,
}) => {
  if (!financeState) {
    return (
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Performance Summary</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--text-muted)]">
            Financial engine state is not available yet.
          </p>
        </div>
      </section>
    );
  }

  const forecast = forecastEndOfCycle(financeState);
  const safeDaily = calculateSafeDailySpend(financeState);
  const burnRate = calculateBurnRate(financeState);
  const remainingBalance = remainingToSpendCents ?? forecast.projectedBalance;

  const overspendBase = Math.max(1, Math.abs(financeState.balance.current));
  const overspendPct =
    forecast.overspend > 0 ? Math.min(100, (forecast.overspend / overspendBase) * 100) : 0;
  const budgetAccuracy = Math.max(0, Math.min(100, Math.round(100 - overspendPct)));

  let loadLabel: "Stable" | "Tight" | "Critical" = "Stable";
  if (burnRate > safeDaily * 1.15) loadLabel = "Critical";
  else if (burnRate > safeDaily * 0.9) loadLabel = "Tight";

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Performance Summary</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          High-level accuracy and pace for {periodLabel}.
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-[var(--text-muted)]">Budget accuracy</p>
          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {budgetAccuracy}%
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Approximate alignment between your current burn and the end-of-cycle forecast.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Safe daily spend</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--accent-primary)]">
              €{(safeDaily / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Current burn rate</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
              €{(burnRate / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">Trend</p>
          <p
            className={`text-sm font-semibold ${
              loadLabel === "Stable"
                ? "text-green-400"
                : loadLabel === "Tight"
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {loadLabel}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">Projected balance at cycle end</p>
          <p
            className={`text-sm font-medium tabular-nums ${
              remainingBalance < 0 ? "text-amber-400" : "text-[var(--text-primary)]"
            }`}
          >
            €{(forecast.projectedBalance / 100).toFixed(2)}
          </p>
        </div>
      </div>
    </section>
  );
};


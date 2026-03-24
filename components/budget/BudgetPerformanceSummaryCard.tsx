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

  const driftPerDayCents = burnRate - safeDaily;
  const driftPerDayAbs = Math.abs(driftPerDayCents);
  const forecastStatus =
    forecast.projectedBalance < 0
      ? { label: "Tekortrisico", tone: "text-red-300" }
      : driftPerDayCents > 0
        ? { label: "Tempo loopt op", tone: "text-amber-300" }
        : { label: "Op koers", tone: "text-emerald-300" };

  let loadLabel: "Stabiel" | "Strak" | "Kritiek" = "Stabiel";
  if (burnRate > safeDaily * 1.15) loadLabel = "Kritiek";
  else if (burnRate > safeDaily * 0.9) loadLabel = "Strak";

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Prestatie-overzicht</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Nauwkeurigheid en tempo voor {periodLabel}.
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-[var(--text-muted)]">Budgetnauwkeurigheid</p>
          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {budgetAccuracy}%
          </p>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Je geeft nu ongeveer €
          {(driftPerDayAbs / 100).toFixed(2)} per dag{" "}
          {driftPerDayCents > 0 ? "meer uit dan veilig is" : "minder uit dan je veilige tempo"} richting
          het einde van deze cyclus.
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Veilig dagbudget</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--accent-primary)]">
              €{(safeDaily / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Huidige burn rate</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
              €{(burnRate / 100).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">Trend</p>
          <p
            className={`text-sm font-semibold ${
              loadLabel === "Stabiel"
                ? "text-green-400"
                : loadLabel === "Strak"
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {loadLabel}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/35 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">Forecast-signaal</p>
            <p className={`text-xs font-semibold ${forecastStatus.tone}`}>{forecastStatus.label}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Verwachte uitgaven tot einde cyclus:{" "}
            <span className="font-medium text-[var(--text-primary)]">€{(forecast.projectedSpend / 100).toFixed(2)}</span>
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Verwacht eindsaldo cyclus:{" "}
            <span
              className={`font-medium tabular-nums ${
                remainingBalance < 0 ? "text-amber-400" : "text-[var(--text-primary)]"
              }`}
            >
              €{(forecast.projectedBalance / 100).toFixed(2)}
            </span>
          </p>
          {forecast.overspend > 0 && (
            <p className="mt-1 text-xs text-amber-300">
              Verwacht tekort: €{(forecast.overspend / 100).toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};


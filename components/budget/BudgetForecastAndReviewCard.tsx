"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FinanceState } from "@/lib/dcic/types";
import { completeBudgetWeeklyReview } from "@/app/actions/budget-weekly-review";
import { calculateBurnRate, calculateSafeDailySpend, forecastEndOfCycle } from "@/lib/dcic/finance-engine";

type Props = {
  financeState: FinanceState | null;
  remainingToSpendCents: number | null;
  periodLabel: string;
  completedThisWeek: boolean;
  daysUntilNextIncome?: number | null;
  safeDailySpendCents?: number | null;
};

export function BudgetForecastAndReviewCard({
  financeState,
  remainingToSpendCents,
  periodLabel,
  completedThisWeek,
  daysUntilNextIncome,
  safeDailySpendCents,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(completedThisWeek);

  if (!financeState) {
    return (
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Voorspelling & weekreview</h2>
        </div>
        <div className="p-4 text-sm text-[var(--text-muted)]">Financiele engine-data is nog niet beschikbaar.</div>
      </section>
    );
  }

  const forecast = forecastEndOfCycle(financeState);
  const safeDaily =
    safeDailySpendCents != null && Number.isFinite(safeDailySpendCents)
      ? safeDailySpendCents
      : calculateSafeDailySpend(financeState);
  const burnRate = calculateBurnRate(financeState);
  const driftPerDayCents = burnRate - safeDaily;
  const driftPerDayAbs = Math.abs(driftPerDayCents);
  const remainingBalance = remainingToSpendCents ?? forecast.projectedBalance;
  const forecastStatus =
    forecast.projectedBalance < 0
      ? { label: "Tekortrisico", tone: "text-red-300" }
      : driftPerDayCents > 0
        ? { label: "Tempo loopt op", tone: "text-amber-300" }
        : { label: "Op koers", tone: "text-emerald-300" };

  function handleComplete() {
    if (done) return;
    startTransition(async () => {
      const res = await completeBudgetWeeklyReview();
      if (res.ok) {
        setDone(true);
        router.refresh();
      } else {
        toast.error("Weekreview opslaan mislukt. Probeer opnieuw.");
      }
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Voorspelling & weekreview</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Tempo en check-in voor {periodLabel}.</p>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Veilig dagbudget</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--accent-primary)]">€{(safeDaily / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Huidige burn rate</p>
            <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">€{(burnRate / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Verwacht saldo einde cyclus</p>
            <p className={`text-lg font-semibold tabular-nums ${remainingBalance < 0 ? "text-amber-400" : "text-[var(--text-primary)]"}`}>
              €{(remainingBalance / 100).toFixed(2)}
            </p>
          </div>
        </div>
        {daysUntilNextIncome != null && (
          <p className="text-xs text-[var(--text-muted)]">Dagen tot volgende loon: {daysUntilNextIncome}</p>
        )}
        <p className="text-xs text-[var(--text-muted)]">
          Huidige afwijking: ongeveer €{(driftPerDayAbs / 100).toFixed(2)} per dag{" "}
          {driftPerDayCents > 0 ? "boven" : "onder"} veilig tempo.
        </p>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/35 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">Forecast-signaal</p>
            <p className={`text-xs font-semibold ${forecastStatus.tone}`}>{forecastStatus.label}</p>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Verwachte uitgaven tot einde cyclus:{" "}
            <span className="font-medium text-[var(--text-primary)]">
              €{(forecast.projectedSpend / 100).toFixed(2)}
            </span>
          </p>
          {forecast.overspend > 0 && (
            <p className="mt-1 text-xs text-amber-300">
              Verwacht tekort: €{(forecast.overspend / 100).toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/30 px-3 py-2">
          <p className="text-xs text-[var(--text-muted)]">Status weekreview</p>
          <button
            type="button"
            onClick={handleComplete}
            disabled={done || pending}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              done
                ? "border border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                : "border border-[var(--card-border)] bg-[var(--bg-surface)]/80 text-[var(--text-muted)] hover:border-[var(--accent-primary)]/60 hover:text-[var(--accent-primary)]"
            }`}
          >
            {done ? "Deze week afgerond" : pending ? "Opslaan..." : "Markeer als gedaan"}
          </button>
        </div>
      </div>
    </section>
  );
}

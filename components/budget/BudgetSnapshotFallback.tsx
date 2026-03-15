"use client";

import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { formatCents } from "@/lib/utils/currency";

/**
 * First-paint content for the Budget page from DailySnapshot.budget.
 * Used as a Suspense fallback so users see a quick summary immediately
 * when opening the budget view from cache.
 */
export function BudgetSnapshotFallback() {
  const snapshot = useDailySnapshot();
  const budget = snapshot?.budget ?? null;

  if (!budget) {
    return (
      <div className="space-y-4">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-white/10" aria-hidden />
        <p className="text-sm text-[var(--text-muted)]">Budget laden…</p>
        <div className="h-16 w-full animate-pulse rounded-xl bg-white/5" aria-hidden />
      </div>
    );
  }

  const { budgetRemainingCents, currentMonthExpenses, currentMonthIncome, currency, periodLabel, unplannedSummary } = budget;

  const remainingLabel =
    budgetRemainingCents != null ? formatCents(budgetRemainingCents, currency) : "—";
  const expensesLabel =
    currentMonthExpenses != null ? formatCents(currentMonthExpenses, currency) : "—";
  const incomeLabel =
    currentMonthIncome != null ? formatCents(currentMonthIncome, currency) : "—";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Budget</h1>
        <p className="text-xs text-[var(--text-muted)]">Voorbereid uit snapshot ({periodLabel})</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Resterend
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{remainingLabel}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Uitgaven {periodLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">{expensesLabel}</p>
        </div>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/40 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Inkomsten {periodLabel}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">{incomeLabel}</p>
        </div>
      </div>

      {unplannedSummary?.count > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          Ongeplande uitgaven deze week: {unplannedSummary.count} (
          {(unplannedSummary.totalCents / 100).toFixed(2)} {currency})
        </p>
      )}

      <p className="text-xs text-[var(--text-muted)]">
        Volledige budgetdetails laden…
      </p>
    </div>
  );
}


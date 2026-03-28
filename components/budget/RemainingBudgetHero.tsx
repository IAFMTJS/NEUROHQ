"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HQModal } from "@/components/hq";
import { Modal } from "@/components/Modal";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import { BudgetLockHeaderBadge } from "@/components/budget/BudgetLockHeaderBadge";
import { BudgetRemainingStatusCircle } from "@/components/budget/BudgetRemainingStatusCircle";
import { updateBudgetSettings } from "@/app/actions/budget";
import { formatCents } from "@/lib/utils/currency";
import {
  clearPendingBudgetSnapshot,
  derivePendingBudgetRemaining,
  markPendingBudgetSynced,
  setPendingBudgetSnapshot,
  usePendingBudgetSnapshot,
} from "@/lib/client-pending-budget";
import { useSettings } from "@/lib/settings-context";

type Props = {
  /** Total budget for the current cycle (month/week) in cents. */
  budgetCents: number;
  /** Savings reserved from the budget for the current cycle in cents. */
  savingsCents: number;
  /** Expenses booked in the current cycle in cents. */
  expensesCents: number;
  currency: string;
  periodLabel: string;
  budgetPeriod: "monthly" | "weekly";
  historyMode?: boolean;
  /** YYYY-MM-DD for quick log default date */
  logDate: string;
  /** Days until next payday; null if unknown */
  daysUntilNextIncome?: number | null;
  /** Short label for next payday (e.g. "28 mrt") */
  nextPaydayShortLabel?: string | null;
};

export function RemainingBudgetHero({
  budgetCents,
  savingsCents,
  expensesCents,
  currency,
  periodLabel,
  budgetPeriod,
  historyMode = false,
  logDate,
  daysUntilNextIncome = null,
  nextPaydayShortLabel = null,
}: Props) {
  const pendingBudget = usePendingBudgetSnapshot();
  const pendingActive = pendingBudget != null && pendingBudget.synced !== true;
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [pending, startTransition] = useTransition();
  const [budgetInput, setBudgetInput] = useState(String(Math.max(0, budgetCents) / 100));
  const [savingsInput, setSavingsInput] = useState(String(Math.max(0, savingsCents) / 100));
  const [periodInput, setPeriodInput] = useState<"monthly" | "weekly">(budgetPeriod);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { invalidate: invalidateSettings } = useSettings();

  const effectiveBudgetCents =
    pendingActive && pendingBudget?.monthlyBudgetCents !== undefined ? pendingBudget.monthlyBudgetCents ?? 0 : budgetCents;
  const effectiveSavingsCents =
    pendingActive && pendingBudget?.monthlySavingsCents !== undefined ? pendingBudget.monthlySavingsCents ?? 0 : savingsCents;
  const effectiveCurrency = pendingActive ? pendingBudget?.currency ?? currency : currency;
  const effectiveBudgetPeriod = pendingActive ? pendingBudget?.budgetPeriod ?? budgetPeriod : budgetPeriod;
  const spendableCents = Math.max(0, effectiveBudgetCents - effectiveSavingsCents);
  const remainingCents =
    pendingActive && pendingBudget?.budgetRemainingCents != null
      ? pendingBudget.budgetRemainingCents
      : derivePendingBudgetRemaining(effectiveBudgetCents, effectiveSavingsCents, expensesCents);
  const isOverBudget = remainingCents < 0;

  let remainingRatio: number;
  if (spendableCents > 0) {
    remainingRatio = (remainingCents / spendableCents) * 100;
  } else if (remainingCents < 0) {
    // No explicit spendable budget, but you've spent money → treat as fully overspent.
    remainingRatio = -100;
  } else {
    remainingRatio = 0;
  }

  // Circle: clamp between 0–100 so the arc doesn't break.
  const remainingPctForMeter =
    spendableCents > 0
      ? Math.min(100, Math.max(0, remainingRatio))
      : 0;

  // Text: show real percentage, including negatives when overspent (also when spendable is 0 but there are expenses).
  const remainingPctDisplay = Math.round(remainingRatio);

  const hasSettings = effectiveBudgetCents > 0 || effectiveSavingsCents > 0;
  const spentPct = spendableCents > 0 ? Math.min(100, (expensesCents / spendableCents) * 100) : 0;

  useEffect(() => {
    if (!showEdit) return;
    setBudgetInput(String(Math.max(0, effectiveBudgetCents) / 100));
    setSavingsInput(String(Math.max(0, effectiveSavingsCents) / 100));
    setPeriodInput(effectiveBudgetPeriod);
    setError(null);
  }, [effectiveBudgetCents, effectiveBudgetPeriod, effectiveSavingsCents, showEdit]);

  function handleSaveSettings() {
    setError(null);
    const b = budgetInput.trim() ? Math.round(parseFloat(budgetInput) * 100) : null;
    const s = savingsInput.trim() ? Math.round(parseFloat(savingsInput) * 100) : null;
    if (b != null && (isNaN(b) || b < 0)) {
      setError("Budget must be a positive number.");
      return;
    }
    if (s != null && (isNaN(s) || s < 0)) {
      setError("Savings must be a positive number.");
      return;
    }
    if (b != null && s != null && s > b) {
      setError("Savings cannot exceed budget.");
      return;
    }

    const nextRemainingCents = derivePendingBudgetRemaining(b, s, expensesCents);
    setPendingBudgetSnapshot({
      monthlyBudgetCents: b ?? null,
      monthlySavingsCents: s ?? null,
      budgetPeriod: periodInput,
      currency: effectiveCurrency,
      budgetRemainingCents: historyMode ? null : nextRemainingCents,
    });
    setShowEdit(false);

    startTransition(async () => {
      try {
        await updateBudgetSettings({
          monthly_budget_cents: b ?? null,
          monthly_savings_cents: s ?? null,
          budget_period: periodInput,
        });
        markPendingBudgetSynced();
        router.refresh();
        await invalidateSettings();
        window.setTimeout(() => clearPendingBudgetSnapshot(), 1500);
      } catch (e) {
        clearPendingBudgetSnapshot();
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  function openQuickLogToast() {
    toast.custom(
      (id) => (
        <div
          className="relative w-[min(100vw-2rem,22rem)] max-h-[min(85vh,520px)] overflow-y-auto rounded-2xl border border-[var(--card-border)]/90 bg-[var(--bg-elevated)]/98 px-3 py-3 pr-9 text-left shadow-xl backdrop-blur-md"
          role="dialog"
          aria-label="Quick log"
        >
          <button
            type="button"
            className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
            aria-label="Sluiten"
            onClick={() => toast.dismiss(id)}
          >
            ✕
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">Quick log</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Korte entry — sluit automatisch na opslaan.</p>
          <div className="mt-3">
            <AddBudgetEntryForm
              date={logDate}
              currency={effectiveCurrency}
              mode="quick"
              onSuccess={() => toast.dismiss(id)}
            />
          </div>
        </div>
      ),
      { duration: 120_000 }
    );
  }

  const paydayLine =
    typeof daysUntilNextIncome === "number"
      ? daysUntilNextIncome <= 0
        ? "Loon vandaag of binnen 24u"
        : daysUntilNextIncome === 1
          ? "Nog 1 dag tot loon"
          : `Nog ${daysUntilNextIncome} dagen tot loon`
      : null;

  return (
    <>
      <section
        className="card-simple overflow-hidden p-0"
        aria-label="Remaining budget overview"
        data-tutorial="budget-hero"
      >
        <div className="border-b border-[var(--card-border)] px-4 py-3 md:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">Budget command</p>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {effectiveBudgetPeriod === "weekly" ? "Week" : "Maand"} · resterend vs spendable (na reserveringen)
          </p>
        </div>
        <div className="relative flex flex-col gap-6 px-4 py-5 md:flex-row md:items-start md:justify-between md:px-5 md:py-6">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
            <BudgetRemainingStatusCircle
              arcPercent={remainingPctForMeter}
              remainingRatioDisplay={remainingPctDisplay}
              amountLine={hasSettings ? formatCents(remainingCents, effectiveCurrency) : "—"}
              hasSpendable={spendableCents > 0}
              isOverBudget={isOverBudget}
            />

            <div className="w-full min-w-0 flex-1 space-y-3 text-center sm:text-left">
              {paydayLine && (
                <div className="rounded-xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/60 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Tot loon</p>
                  <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{paydayLine}</p>
                  {nextPaydayShortLabel && (
                    <p className="text-[11px] text-[var(--text-secondary)]">{nextPaydayShortLabel}</p>
                  )}
                </div>
              )}
              {hasSettings ? (
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  {formatCents(spendableCents, effectiveCurrency)} spendable · {formatCents(expensesCents, effectiveCurrency)}{" "}
                  uitgegeven
                </p>
              ) : (
                <p className="max-w-md text-sm text-[var(--text-muted)]">
                  Stel je {effectiveBudgetPeriod === "weekly" ? "week" : "maand"}budget en spaarreserve in om de ring en
                  tempo te zien.
                </p>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:min-w-[200px] md:items-end">
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:justify-end">
              {!historyMode && (
                <button
                  type="button"
                  onClick={openQuickLogToast}
                  className="dashboard-mini-btn inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold md:w-auto"
                >
                  Quick log
                </button>
              )}
              {!historyMode && (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-focus)]/80 md:w-auto"
                >
                  Budget bewerken
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="btn-primary inline-flex h-auto w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold md:w-auto"
              >
                Details
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] md:text-right">
              budget − spaarreserve − uitgaven = restant
            </p>
            {pendingActive && (
              <p className="text-[11px] text-[var(--accent-focus)] md:text-right">Bijwerken… tijdelijke waarden actief.</p>
            )}
          </div>
        </div>
        {!historyMode && spendableCents > 0 && (
          <div className="border-t border-[var(--card-border)]/60 px-4 pb-4 pt-3 md:px-5">
            <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Spendable gebruikt</p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
              <div
                className={`h-full rounded-full transition-all duration-300 ${spentPct >= 100 ? "bg-amber-500" : "bg-[var(--accent-focus)]"}`}
                style={{ width: `${Math.min(100, spentPct)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      <HQModal open={showDetails} onClose={() => setShowDetails(false)} width={520}>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <BudgetLockHeaderBadge />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Remaining budget
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
              {budgetPeriod === "weekly" ? "This week" : "This month"} overview
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Your spendable budget is your total budget minus savings. Remaining is what&apos;s
              left after expenses.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Budget (total)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCents(effectiveBudgetCents, effectiveCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Savings reserved</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--accent-focus)]">
                {formatCents(effectiveSavingsCents, effectiveCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Spent {periodLabel}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCents(expensesCents, effectiveCurrency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/90 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Remaining to spend</p>
              <p
                className={`mt-0.5 text-lg font-semibold tabular-nums ${
                  isOverBudget ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {formatCents(remainingCents, effectiveCurrency)}
              </p>
              {spendableCents > 0 && (
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {remainingPctDisplay}% of spendable left
                  {isOverBudget ? " (over budget)" : ""}.
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            Tip: keep remaining above zero before the end of{" "}
            {effectiveBudgetPeriod === "weekly" ? "the week" : "the month"} to stay in the safe zone.
          </p>
        </div>
      </HQModal>

      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title={hasSettings ? "Edit budget & savings" : "Set budget & savings"}
        showBranding
        headerBadge={<BudgetLockHeaderBadge />}
      >
        <p className="text-sm text-[var(--text-muted)]">
          Total amount per {periodInput === "weekly" ? "week" : "month"}, and how much you reserve for savings.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Budget period</label>
            <select
              value={periodInput}
              onChange={(e) => setPeriodInput(e.target.value as "monthly" | "weekly")}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Budget</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Savings</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={savingsInput}
              onChange={(e) => setSavingsInput(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={pending}
              className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}


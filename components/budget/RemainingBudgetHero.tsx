"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HQModal, RadialMeter } from "@/components/hq";
import { Modal } from "@/components/Modal";
import { updateBudgetSettings } from "@/app/actions/budget";
import { formatCents, getCurrencySymbol } from "@/lib/utils/currency";
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
};

export function RemainingBudgetHero({
  budgetCents,
  savingsCents,
  expensesCents,
  currency,
  periodLabel,
  budgetPeriod,
  historyMode = false,
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
  const symbol = getCurrencySymbol(effectiveCurrency);
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

  // Text: show real percentage, including negatives when overspent.
  const remainingPctDisplay =
    spendableCents > 0 ? Math.round(remainingRatio) : 0;

  const variant = isOverBudget ? "warning" : "focus";

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

  return (
    <>
      <section
        className="card-simple-accent relative overflow-hidden rounded-[24px] p-0"
        aria-label="Remaining budget overview"
        data-tutorial="budget-hero"
      >
        <div className="border-b border-[var(--card-border)] px-5 py-3 sm:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">Budget Command Hero</p>
        </div>
        <div className="relative flex flex-col items-center gap-6 px-5 py-6 sm:flex-row sm:items-stretch sm:justify-between sm:px-7 sm:py-7">
          <div className="flex items-center gap-6 sm:gap-8">
            <RadialMeter
              value={remainingPctForMeter}
              displayValue={remainingPctDisplay}
              label={spendableCents > 0 ? "Remaining budget" : "No budget set"}
              description={
                spendableCents > 0
                  ? effectiveBudgetPeriod === "weekly"
                    ? "Of your spendable budget for this week."
                    : "Of your spendable budget for this month."
                  : undefined
              }
              variant={variant}
            />

            <div className="space-y-1 sm:space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                Remaining {periodLabel}
              </p>
              {hasSettings ? (
                <>
                  <p
                    className="text-4xl font-bold tabular-nums text-[var(--text-primary)] sm:text-5xl"
                    style={{
                      textShadow:
                        "0 0 16px rgba(0,229,255,0.55), 0 0 4px rgba(148,163,184,0.45), 0 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {formatCents(remainingCents, effectiveCurrency)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
                    {formatCents(spendableCents, effectiveCurrency)} spendable •{" "}
                    {formatCents(expensesCents, effectiveCurrency)} spent •{" "}
                    <span className="text-[var(--accent-focus)]">
                      {remainingPctDisplay}%
                    </span>{" "}
                    left
                  </p>
                </>
              ) : (
                <p className="max-w-xs text-sm text-[var(--text-muted)]">
                  Set your {effectiveBudgetPeriod === "weekly" ? "weekly" : "monthly"} budget and savings to
                  see remaining amount and burn rate.
                </p>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
              {!historyMode && (
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="inline-flex w-full items-center justify-center rounded-[999px] border border-[var(--card-border)] bg-[rgba(11,30,46,0.68)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-focus)] sm:w-auto"
                >
                  Edit budget
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="btn-primary inline-flex h-auto w-full items-center justify-center rounded-[999px] px-4 py-2.5 text-sm font-semibold sm:w-auto"
              >
                View details
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Formula: budget − savings − expenses = remaining to spend.
            </p>
            {pendingActive && (
              <p className="text-[11px] text-[var(--accent-focus)]">
                Bijwerken... tijdelijke waarden actief.
              </p>
            )}
          </div>
        </div>
        {!historyMode && spendableCents > 0 && (
          <div className="relative mt-5">
            <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Spendable used</p>
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


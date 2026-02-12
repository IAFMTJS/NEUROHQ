"use client";

import { useState, useTransition } from "react";
import { updateBudgetSettings } from "@/app/actions/budget";
import { Modal } from "@/components/Modal";
import { formatCents, getCurrencySymbol } from "@/lib/utils/currency";

type Props = {
  monthlyBudgetCents: number | null;
  monthlySavingsCents: number | null;
  expensesCents: number;
  incomeCents?: number;
  currency?: string;
  periodLabel?: string;
  budgetPeriod?: "monthly" | "weekly";
  historyMode?: boolean;
};

const FORMULA_TOOLTIP = "Spendable = budget minus savings. Remaining = spendable minus expenses.";

export function BudgetSummaryCard({
  monthlyBudgetCents,
  monthlySavingsCents,
  expensesCents,
  incomeCents = 0,
  currency = "EUR",
  periodLabel = "this month",
  budgetPeriod = "monthly",
  historyMode = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [budget, setBudget] = useState(
    monthlyBudgetCents != null ? String(monthlyBudgetCents / 100) : ""
  );
  const [savings, setSavings] = useState(
    monthlySavingsCents != null ? String(monthlySavingsCents / 100) : ""
  );
  const [period, setPeriod] = useState<"monthly" | "weekly">(budgetPeriod);
  const [error, setError] = useState<string | null>(null);

  const budgetCents = monthlyBudgetCents ?? 0;
  const savingsCents = monthlySavingsCents ?? 0;
  const spendableCents = Math.max(0, budgetCents - savingsCents);
  const remainingCents = spendableCents - expensesCents;
  const isOverBudget = remainingCents < 0;
  const symbol = getCurrencySymbol(currency);

  function handleSaveSettings() {
    setError(null);
    const b = budget.trim() ? Math.round(parseFloat(budget) * 100) : null;
    const s = savings.trim() ? Math.round(parseFloat(savings) * 100) : null;
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
    startTransition(async () => {
      try {
        await updateBudgetSettings({
          monthly_budget_cents: b ?? null,
          monthly_savings_cents: s ?? null,
          budget_period: period,
        });
        setShowModal(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  const hasSettings = monthlyBudgetCents != null || monthlySavingsCents != null;
  const spentPct = spendableCents > 0 ? Math.min(100, (expensesCents / spendableCents) * 100) : 0;

  return (
    <>
      <section className="card-modern-accent overflow-hidden p-0">
        <div className="border-b border-neuro-border/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neuro-silver">Your budget {periodLabel}</h2>
            <button
              type="button"
              onClick={() => {
                setBudget(monthlyBudgetCents != null ? String(monthlyBudgetCents / 100) : "");
                setSavings(monthlySavingsCents != null ? String(monthlySavingsCents / 100) : "");
                setPeriod(budgetPeriod);
                setError(null);
                setShowModal(true);
              }}
              className="text-sm font-medium text-neuro-blue hover:underline"
              aria-label={hasSettings ? "Edit budget and savings" : "Set budget and savings"}
            >
              {hasSettings ? "Edit" : "Set budget"}
            </button>
          </div>
          <p className="mt-0.5 text-xs text-neuro-muted" title={FORMULA_TOOLTIP}>
            Budget − savings − expenses = remaining to spend.
          </p>
        </div>
        <div className="p-5">
          {!hasSettings ? (
            <p className="text-sm text-neuro-muted">
              Set your total {budgetPeriod === "weekly" ? "weekly" : "monthly"} amount and how much you want to save. Expenses below will reduce your remaining spendable amount.
            </p>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-neuro-muted">Budget (total)</p>
                  <p className="text-xl font-bold tabular-nums text-neuro-silver">
                    {symbol}{(budgetCents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neuro-muted">Saving {periodLabel}</p>
                  <p className="text-xl font-bold tabular-nums text-neuro-blue">
                    {symbol}{(savingsCents / 100).toFixed(2)}
                  </p>
                </div>
                {incomeCents > 0 && (
                  <div>
                    <p className="text-xs font-medium text-neuro-muted">Income {periodLabel}</p>
                    <p className="text-xl font-bold tabular-nums text-green-400">
                      {formatCents(incomeCents, currency)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-neuro-muted">Spent {periodLabel}</p>
                  <p className="text-xl font-bold tabular-nums text-neuro-silver">
                    {symbol}{(expensesCents / 100).toFixed(2)}
                  </p>
                </div>
                {!historyMode && (
                  <div>
                    <p className="text-xs font-medium text-neuro-muted">Remaining (to spend)</p>
                    <p className={`text-xl font-bold tabular-nums ${!isOverBudget ? "text-green-400" : "text-amber-400"}`}>
                      {symbol}{(remainingCents / 100).toFixed(2)}
                    </p>
                    {isOverBudget && (
                      <p className="mt-0.5 text-xs text-amber-400">Over budget {periodLabel}</p>
                    )}
                  </div>
                )}
              </div>
              {!historyMode && spendableCents > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-neuro-muted mb-1">Spendable used</p>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-neuro-border">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${spentPct >= 100 ? "bg-amber-500" : "bg-neuro-blue"}`}
                      style={{ width: `${Math.min(100, spentPct)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={hasSettings ? "Edit budget & savings" : "Set budget & savings"}
        showBranding
      >
        <p className="text-sm text-neuro-muted">
          Total amount available per {period === "weekly" ? "week" : "month"}, and how much you want to save. Remaining = budget − savings − expenses.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neuro-silver">Budget period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "monthly" | "weekly")}
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neuro-silver">Budget (total amount per {period === "weekly" ? "week" : "month"})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={period === "weekly" ? "e.g. 200" : "e.g. 3000"}
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neuro-silver">Amount to save {period === "weekly" ? "this week" : "this month"}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="e.g. 500"
              className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={pending}
              className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-neuro-border px-4 py-2.5 text-sm font-medium text-neuro-silver hover:bg-neuro-border/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

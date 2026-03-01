"use client";

import { useState } from "react";
import { HQModal, RadialMeter } from "@/components/hq";
import { formatCents, getCurrencySymbol } from "@/lib/utils/currency";

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
};

export function RemainingBudgetHero({
  budgetCents,
  savingsCents,
  expensesCents,
  currency,
  periodLabel,
  budgetPeriod,
}: Props) {
  const [showDetails, setShowDetails] = useState(false);

  const symbol = getCurrencySymbol(currency);
  const spendableCents = Math.max(0, budgetCents - savingsCents);
  const remainingCents = spendableCents - expensesCents;
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

  const hasSettings = budgetCents > 0 || savingsCents > 0;

  return (
    <>
      <section
        className="relative overflow-hidden rounded-[28px] border border-[var(--glass-border-soft)] bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.95)_0%,_rgba(3,7,18,0.98)_55%,_rgba(3,7,18,1)_100%)] px-5 py-6 shadow-[0_0_40px_rgba(0,229,255,0.12)] sm:px-7 sm:py-7"
        aria-label="Remaining budget overview"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(56,189,248,0.18), transparent 55%), radial-gradient(circle at 80% 100%, rgba(129,140,248,0.18), transparent 60%)",
          }}
        />

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-between">
          <div className="flex items-center gap-6 sm:gap-8">
            <RadialMeter
              value={remainingPctForMeter}
              displayValue={remainingPctDisplay}
              label={spendableCents > 0 ? "Remaining budget" : "No budget set"}
              description={
                spendableCents > 0
                  ? budgetPeriod === "weekly"
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
                    className="text-3xl font-bold tabular-nums text-[var(--text-primary)] sm:text-4xl"
                    style={{
                      textShadow:
                        "0 0 16px rgba(0,229,255,0.55), 0 0 4px rgba(148,163,184,0.45), 0 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {formatCents(remainingCents, currency)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] sm:text-sm">
                    {formatCents(spendableCents, currency)} spendable •{" "}
                    {formatCents(expensesCents, currency)} spent •{" "}
                    <span className="text-[var(--accent-focus)]">
                      {remainingPctDisplay}%
                    </span>{" "}
                    left
                  </p>
                </>
              ) : (
                <p className="max-w-xs text-sm text-[var(--text-muted)]">
                  Set your {budgetPeriod === "weekly" ? "weekly" : "monthly"} budget and savings to
                  see remaining amount and burn rate.
                </p>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
            <button
              type="button"
              onClick={() => setShowDetails(true)}
              className="inline-flex w-full items-center justify-center rounded-[999px] border border-[var(--accent-focus)]/60 bg-[rgba(15,23,42,0.9)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[0_0_18px_rgba(56,189,248,0.35)] transition hover:-translate-y-[1px] hover:border-[var(--accent-focus)] hover:bg-[rgba(15,23,42,1)] hover:shadow-[0_0_26px_rgba(56,189,248,0.55)] sm:w-auto"
            >
              View remaining budget details
            </button>
            <p className="text-[11px] text-[var(--text-muted)]">
              Formula: budget − savings − expenses = remaining to spend.
            </p>
          </div>
        </div>
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
                {formatCents(budgetCents, currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Savings reserved</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--accent-focus)]">
                {formatCents(savingsCents, currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/70 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Spent {periodLabel}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-[var(--text-primary)]">
                {formatCents(expensesCents, currency)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/90 px-4 py-3">
              <p className="text-xs font-medium text-[var(--text-muted)]">Remaining to spend</p>
              <p
                className={`mt-0.5 text-lg font-semibold tabular-nums ${
                  isOverBudget ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {formatCents(remainingCents, currency)}
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
            {budgetPeriod === "weekly" ? "the week" : "the month"} to stay in the safe zone.
          </p>
        </div>
      </HQModal>
    </>
  );
}


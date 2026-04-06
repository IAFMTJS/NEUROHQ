"use client";

import { useEffect, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBudgetSettings, type ScheduledNextBudget } from "@/app/actions/budget";
import { Modal } from "@/components/Modal";
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
  monthlyBudgetCents: number | null;
  monthlySavingsCents: number | null;
  expensesCents: number;
  incomeCents?: number;
  currency?: string;
  periodLabel?: string;
  budgetPeriod?: "monthly" | "weekly";
  historyMode?: boolean;
  forecastProjectedBalanceCents?: number | null;
  forecastOverspendCents?: number | null;
  /** Einde huidige budgetperiode (YYYY-MM-DD); voor keuze volgende loonsperiode. */
  periodEnd?: string;
  scheduledNextBudget?: ScheduledNextBudget | null;
};

const FORMULA_TOOLTIP = "Spendable = budget minus savings. Remaining = spendable minus expenses.";

const budgetInsightShell =
  "relative overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.09)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.22)] via-[var(--bg-elevated)]/12 to-[var(--bg-primary)]/28 shadow-[0_12px_48px_rgba(0,0,0,0.35),0_0_28px_rgba(var(--mode-rgb),0.05)] backdrop-blur-xl";

const statTileShell =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-3 py-2.5";

export function BudgetSummaryCard({
  monthlyBudgetCents,
  monthlySavingsCents,
  expensesCents,
  incomeCents = 0,
  currency = "EUR",
  periodLabel = "this month",
  budgetPeriod = "monthly",
  historyMode = false,
  forecastProjectedBalanceCents = null,
  forecastOverspendCents = null,
  periodEnd = "",
  scheduledNextBudget = null,
}: Props) {
  const pendingBudget = usePendingBudgetSnapshot();
  const pendingActive = pendingBudget != null && pendingBudget.synced !== true;
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
  const [budgetApplyTarget, setBudgetApplyTarget] = useState<"current" | "next">("current");
  const router = useRouter();
  const { invalidate: invalidateSettings } = useSettings();

  const effectiveBudgetSetting =
    pendingActive && pendingBudget?.monthlyBudgetCents !== undefined ? pendingBudget.monthlyBudgetCents : monthlyBudgetCents;
  const effectiveSavingsSetting =
    pendingActive && pendingBudget?.monthlySavingsCents !== undefined ? pendingBudget.monthlySavingsCents : monthlySavingsCents;
  const effectiveCurrency = pendingActive ? pendingBudget?.currency ?? currency : currency;
  const effectiveBudgetPeriod = pendingActive ? pendingBudget?.budgetPeriod ?? budgetPeriod : budgetPeriod;
  const budgetCents = effectiveBudgetSetting ?? 0;
  const savingsCents = effectiveSavingsSetting ?? 0;
  const spendableCents = Math.max(0, budgetCents - savingsCents);
  const remainingCents =
    pendingActive && pendingBudget?.budgetRemainingCents != null
      ? pendingBudget.budgetRemainingCents
      : derivePendingBudgetRemaining(effectiveBudgetSetting, effectiveSavingsSetting, expensesCents);
  const isOverBudget = remainingCents < 0;
  const symbol = getCurrencySymbol(effectiveCurrency);

  const nextPeriodStartIso =
    !historyMode && periodEnd && /^\d{4}-\d{2}-\d{2}$/.test(periodEnd)
      ? addDays(new Date(periodEnd + "T12:00:00Z"), 1).toISOString().slice(0, 10)
      : null;
  const nextPeriodStartLabel =
    nextPeriodStartIso != null
      ? format(new Date(nextPeriodStartIso + "T12:00:00Z"), "d MMMM yyyy", { locale: nl })
      : null;
  const canChooseNextPeriod = Boolean(nextPeriodStartLabel) && !historyMode;

  useEffect(() => {
    if (!showModal) return;
    setBudgetApplyTarget("current");
    setBudget(effectiveBudgetSetting != null ? String(effectiveBudgetSetting / 100) : "");
    setSavings(effectiveSavingsSetting != null ? String(effectiveSavingsSetting / 100) : "");
    setPeriod(effectiveBudgetPeriod);
  }, [effectiveBudgetPeriod, effectiveBudgetSetting, effectiveSavingsSetting, showModal]);

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

    if (budgetApplyTarget === "next") {
      startTransition(async () => {
        try {
          await updateBudgetSettings({
            monthly_budget_cents: b ?? null,
            monthly_savings_cents: s ?? null,
            budget_period: period,
            apply_to_next_period: true,
          });
          toast.success(
            nextPeriodStartLabel
              ? `Budget gepland voor volgende loonsperiode (actief vanaf ${nextPeriodStartLabel}).`
              : "Budget gepland voor volgende loonsperiode."
          );
          setShowModal(false);
          router.refresh();
          await invalidateSettings();
        } catch (e) {
          setError(e instanceof Error ? e.message : "Failed to save.");
        }
      });
      return;
    }

    const nextRemainingCents = derivePendingBudgetRemaining(b, s, expensesCents);
    setPendingBudgetSnapshot({
      monthlyBudgetCents: b ?? null,
      monthlySavingsCents: s ?? null,
      budgetPeriod: period,
      currency: effectiveCurrency,
      budgetRemainingCents: historyMode ? null : nextRemainingCents,
    });
    setShowModal(false);
    startTransition(async () => {
      try {
        await updateBudgetSettings({
          monthly_budget_cents: b ?? null,
          monthly_savings_cents: s ?? null,
          budget_period: period,
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

  const hasSettings = effectiveBudgetSetting != null || effectiveSavingsSetting != null;
  const spentPct = spendableCents > 0 ? Math.min(100, (expensesCents / spendableCents) * 100) : 0;

  return (
    <>
      <section className={budgetInsightShell} aria-label="Budgetoverzicht">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.12),transparent_58%)]"
          aria-hidden
        />
        <div className="relative z-[1] border-b border-[rgba(var(--mode-rgb),0.1)] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Budgetoverzicht</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                Jouw budget · <span className="text-[var(--text-secondary)]">{periodLabel}</span>
              </h2>
              <p className="mt-1 max-w-xl text-xs leading-snug text-[var(--text-muted)]" title={FORMULA_TOOLTIP}>
                Budget − sparen − uitgaven = resterend (spendable).
              </p>
              {pendingActive && (
                <p className="mt-2 text-xs font-medium text-[var(--accent-focus)]">Bijwerken… tijdelijke waarden actief.</p>
              )}
              {!historyMode && scheduledNextBudget ? (
                <p className="mt-2 max-w-xl rounded-lg border border-cyan-500/25 bg-cyan-950/30 px-2.5 py-2 text-[10px] leading-snug text-cyan-100/95">
                  Gepland vanaf{" "}
                  {format(new Date(scheduledNextBudget.applies_from + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}:{" "}
                  {scheduledNextBudget.monthly_budget_cents != null
                    ? formatCents(scheduledNextBudget.monthly_budget_cents, effectiveCurrency)
                    : "—"}{" "}
                  · spaar{" "}
                  {scheduledNextBudget.monthly_savings_cents != null
                    ? formatCents(scheduledNextBudget.monthly_savings_cents, effectiveCurrency)
                    : "—"}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setBudget(effectiveBudgetSetting != null ? String(effectiveBudgetSetting / 100) : "");
                setSavings(effectiveSavingsSetting != null ? String(effectiveSavingsSetting / 100) : "");
                setPeriod(effectiveBudgetPeriod);
                setError(null);
                setShowModal(true);
              }}
              className="shrink-0 rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)]/70 px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[rgba(var(--mode-rgb),0.35)] hover:bg-[var(--bg-elevated)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)]"
              aria-label={hasSettings ? "Budget en sparen bewerken" : "Budget instellen"}
            >
              {hasSettings ? "Bewerken" : "Instellen"}
            </button>
          </div>
        </div>
        <div className="relative z-[1] p-4 sm:p-5">
          {!hasSettings ? (
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Stel je totale {effectiveBudgetPeriod === "weekly" ? "week" : "maand"}bedrag en spaarreserve in. Uitgaven
              hieronder verlagen je resterend spendable.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={statTileShell}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Totaal budget</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-[var(--text-primary)] sm:text-xl">
                    {symbol}
                    {(budgetCents / 100).toFixed(2)}
                  </p>
                </div>
                <div className={statTileShell}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Sparen {periodLabel}</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-[var(--accent-focus)] sm:text-xl">
                    {symbol}
                    {(savingsCents / 100).toFixed(2)}
                  </p>
                </div>
                {incomeCents > 0 && (
                  <div className={statTileShell}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Inkomsten {periodLabel}</p>
                    <p className="mt-1.5 text-lg font-bold tabular-nums text-emerald-300/95 sm:text-xl">
                      {formatCents(incomeCents, effectiveCurrency)}
                    </p>
                  </div>
                )}
                <div className={statTileShell}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Uitgegeven {periodLabel}</p>
                  <p className="mt-1.5 text-lg font-bold tabular-nums text-[var(--semantic-accent)] sm:text-xl">
                    {symbol}
                    {(expensesCents / 100).toFixed(2)}
                  </p>
                </div>
                {!historyMode && (
                  <div className={`${statTileShell} sm:col-span-2`}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Resterend</p>
                    <p
                      className={`mt-1.5 text-lg font-bold tabular-nums sm:text-xl ${
                        !isOverBudget ? "text-emerald-200" : "text-amber-300"
                      }`}
                    >
                      {symbol}
                      {(remainingCents / 100).toFixed(2)}
                    </p>
                    {isOverBudget && (
                      <p className="mt-1 text-xs font-medium text-amber-400/95">Boven budget deze periode</p>
                    )}
                  </div>
                )}
              </div>
              {!historyMode && spendableCents > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Spendable gebruikt</p>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(var(--mode-rgb),0.12)]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        spentPct >= 100 ? "bg-amber-500" : "bg-[var(--accent-focus)]"
                      }`}
                      style={{ width: `${Math.min(100, spentPct)}%` }}
                    />
                  </div>
                </div>
              )}
              {!historyMode && forecastProjectedBalanceCents != null && (
                <div className="mt-4 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(var(--mode-rgb-deep),0.06)] px-3 py-2.5">
                  <p className="text-xs text-[var(--text-muted)]">
                    Forecast eindsaldo cyclus:{" "}
                    <span
                      className={
                        forecastProjectedBalanceCents < 0
                          ? "font-semibold text-amber-300"
                          : "font-semibold text-[var(--text-primary)]"
                      }
                    >
                      {formatCents(forecastProjectedBalanceCents, effectiveCurrency)}
                    </span>
                  </p>
                  {(forecastOverspendCents ?? 0) > 0 && (
                    <p className="mt-1 text-xs text-amber-300/95">
                      Verwacht tekort: {formatCents(forecastOverspendCents ?? 0, effectiveCurrency)}
                    </p>
                  )}
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
        <p className="text-sm text-[var(--text-muted)]">
          Total amount available per {period === "weekly" ? "week" : "month"}, and how much you want to save. Remaining = budget − savings − expenses.
        </p>
        {canChooseNextPeriod ? (
          <div className="mt-4 space-y-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Waarvoor geldt dit?</p>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--text-secondary)]">
              <input
                type="radio"
                name="budgetApplySummary"
                className="mt-1 h-3.5 w-3.5 shrink-0 border-[var(--card-border)] text-[rgb(var(--mode-rgb))] focus:ring-[rgb(var(--mode-rgb))]/40"
                checked={budgetApplyTarget === "current"}
                onChange={() => setBudgetApplyTarget("current")}
              />
              <span>
                <span className="font-medium text-[var(--text-primary)]">Deze loonsperiode</span> — past je huidige
                restant aan.
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[var(--text-secondary)]">
              <input
                type="radio"
                name="budgetApplySummary"
                className="mt-1 h-3.5 w-3.5 shrink-0 border-[var(--card-border)] text-[rgb(var(--mode-rgb))] focus:ring-[rgb(var(--mode-rgb))]/40"
                checked={budgetApplyTarget === "next"}
                onChange={() => setBudgetApplyTarget("next")}
              />
              <span>
                <span className="font-medium text-[var(--text-primary)]">Volgende loonsperiode</span>
                {nextPeriodStartLabel ? <> (start {nextPeriodStartLabel})</> : null} — huidige periode ongewijzigd.
              </span>
            </label>
          </div>
        ) : null}
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Budget period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "monthly" | "weekly")}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Budget (total amount per {period === "weekly" ? "week" : "month"})</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={period === "weekly" ? "e.g. 200" : "e.g. 3000"}
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Amount to save {period === "weekly" ? "this week" : "this month"}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              placeholder="e.g. 500"
              className="mt-1.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
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
              className="rounded-lg border border-[var(--card-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--card-border)]/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

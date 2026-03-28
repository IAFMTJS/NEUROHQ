"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HQModal } from "@/components/hq";
import { Modal } from "@/components/Modal";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import { BudgetLockHeaderBadge } from "@/components/budget/BudgetLockHeaderBadge";
import { EnergyRing, type EnergyRingMode } from "@/components/hud-test/EnergyRing";
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
/** Zelfde tile-shell als ProfileHomeCompact / profiel-orbit */
const orbitTileShell =
  "rounded-xl border border-[rgba(var(--mode-rgb),0.07)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-3 py-2.5 transition-colors hover:border-[rgba(var(--mode-rgb),0.16)] hover:bg-[rgba(var(--mode-rgb-deep),0.12)]";

function budgetRingMode(
  hasSettings: boolean,
  spendableCents: number,
  isOverBudget: boolean,
  remainingPctClamped: number
): EnergyRingMode {
  if (!hasSettings) return "locked";
  if (isOverBudget) return "high-alert";
  if (spendableCents <= 0) return "locked";
  if (remainingPctClamped <= 12) return "alert";
  if (remainingPctClamped <= 38) return "default";
  if (remainingPctClamped <= 68) return "green";
  return "green-peak";
}

/** Volle boog bij over budget (crisis); anders resterend % van spendable. */
function budgetRingProgress(isOverBudget: boolean, remainingPctForMeter: number): number {
  if (isOverBudget) return 100;
  return remainingPctForMeter;
}

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

  const commandStatus = (() => {
    if (!hasSettings) return { label: "Geen budget", pill: "border-slate-500/35 bg-slate-900/50 text-slate-300" };
    if (isOverBudget) return { label: "Over budget", pill: "border-red-500/45 bg-red-950/55 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.25)]" };
    const p = remainingPctForMeter;
    if (p <= 12) return { label: "Kritiek laag", pill: "border-amber-400/45 bg-amber-950/40 text-amber-100" };
    if (p <= 35) return { label: "Onder druk", pill: "border-orange-400/35 bg-orange-950/30 text-orange-100" };
    if (p <= 60) return { label: "Gecontroleerd", pill: "border-cyan-400/35 bg-cyan-950/25 text-cyan-100" };
    return { label: "Ruim", pill: "border-emerald-400/40 bg-emerald-950/35 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.2)]" };
  })();

  const ringMode = budgetRingMode(hasSettings, spendableCents, isOverBudget, remainingPctForMeter);
  const ringProgress = budgetRingProgress(isOverBudget, remainingPctForMeter);
  const ringLabel = hasSettings
    ? `Resterend · ${remainingPctDisplay}%`
    : "Geen budget ingesteld";
  const ringValue = hasSettings ? formatCents(remainingCents, effectiveCurrency) : "—";

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
          className="relative w-[min(100vw-2rem,22rem)] max-h-[min(85vh,520px)] overflow-y-auto rounded-2xl border border-emerald-500/25 bg-[linear-gradient(165deg,rgba(6,24,20,0.97),rgba(15,23,42,0.98))] px-3 py-3 pr-9 text-left shadow-[0_0_36px_rgba(16,185,129,0.15),0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md"
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
        className="relative overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.09)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.22)] via-[var(--bg-elevated)]/12 to-[var(--bg-primary)]/28 px-4 py-5 shadow-[0_12px_48px_rgba(0,0,0,0.4),0_0_28px_rgba(var(--mode-rgb),0.05)] backdrop-blur-xl sm:px-6"
        aria-label="Remaining budget overview"
        data-tutorial="budget-hero"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.14),transparent_58%)]"
          aria-hidden
        />

        <div className="relative z-[1] border-b border-[rgba(var(--mode-rgb),0.1)] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Budget command</p>
              <p className="mt-1 max-w-xl text-xs leading-snug text-[var(--text-secondary)]">
                {effectiveBudgetPeriod === "weekly" ? "Weekcyclus" : "Maandcyclus"} · resterend t.o.v. spendable (na
                spaarreserve)
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${commandStatus.pill}`}
            >
              {commandStatus.label}
            </span>
          </div>
        </div>

        <div className="relative z-[1] mt-5 flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between lg:gap-8">
          <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center lg:gap-10">
            <div className="flex shrink-0 flex-col items-center">
              <div className="relative">
                <div
                  className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.16)_0%,transparent_62%)] blur-md sm:h-[120%] sm:w-[120%]"
                  aria-hidden
                />
                <div className="relative drop-shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
                  <EnergyRing
                    profileOrbit
                    size={236}
                    progress={ringProgress}
                    label={ringLabel}
                    value={ringValue}
                    mode={ringMode}
                  />
                </div>
              </div>
              <p className="mt-3 max-w-[280px] text-center text-[11px] leading-relaxed text-[var(--text-muted)]">
                {hasSettings ? (
                  <>
                    <span className="tabular-nums text-[var(--text-secondary)]">
                      {formatCents(spendableCents, effectiveCurrency)} spendable
                    </span>
                    {" · "}
                    <span className="tabular-nums text-[var(--text-secondary)]">
                      {formatCents(expensesCents, effectiveCurrency)} uitgegeven
                    </span>
                  </>
                ) : (
                  <>Stel budget en spaarreserve in om de ring te activeren.</>
                )}
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 space-y-3 text-center sm:max-w-md sm:text-left lg:pt-1">
              {paydayLine && (
                <div className={`${orbitTileShell} text-left`}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Tot loon</p>
                  <p className="mt-1.5 text-sm font-semibold leading-snug text-[var(--text-primary)]">{paydayLine}</p>
                  {nextPaydayShortLabel && (
                    <p className="mt-1 font-mono text-[11px] text-[var(--text-secondary)]">{nextPaydayShortLabel}</p>
                  )}
                </div>
              )}
              {hasSettings ? (
                <div className={`${orbitTileShell} space-y-2 text-left`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Spendable</span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {formatCents(spendableCents, effectiveCurrency)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Uitgegeven {periodLabel}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-[var(--semantic-accent)]">
                      {formatCents(expensesCents, effectiveCurrency)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  Stel je {effectiveBudgetPeriod === "weekly" ? "week" : "maand"}budget en spaarreserve in voor tempo en
                  signalen.
                </p>
              )}
            </div>
          </div>

            <div className="flex w-full flex-col justify-center gap-3 lg:w-[min(100%,240px)] lg:shrink-0">
              <div className="flex w-full flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowDetails(true)}
                  className="btn-primary inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold"
                >
                  Details
                </button>
                {!historyMode && (
                  <button
                    type="button"
                    onClick={openQuickLogToast}
                    className="btn-secondary inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[inset_4px_0_0_0_rgba(16,185,129,0.55)]"
                  >
                    Quick log
                  </button>
                )}
                {!historyMode && (
                  <button
                    type="button"
                    onClick={() => setShowEdit(true)}
                    className="btn-secondary inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)]"
                  >
                    Budget bewerken
                  </button>
                )}
              </div>
              <p className="text-center text-[10px] leading-snug text-[var(--text-muted)] md:text-right">
                budget − spaarreserve − uitgaven = restant
              </p>
              {pendingActive && (
                <p className="text-center text-[11px] text-[var(--accent-focus)] md:text-right">Bijwerken… tijdelijke waarden actief.</p>
              )}
            </div>
        </div>

        {!historyMode && spendableCents > 0 && (
          <div className="relative z-[1] mt-5 rounded-b-[var(--hq-card-radius,18px)] border-t border-[rgba(var(--mode-rgb),0.1)] bg-black/10 px-0 pb-1 pt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Spendable gebruikt</p>
              <p className="font-mono text-[11px] tabular-nums text-[var(--text-secondary)]">{Math.round(Math.min(100, spentPct))}%</p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border border-white/5 bg-[var(--card-border)]/40 shadow-inner">
              <div
                className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${
                  spentPct >= 100
                    ? "from-amber-600 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.45)]"
                    : "from-emerald-500 via-cyan-500 to-[var(--accent-focus)] shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                }`}
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


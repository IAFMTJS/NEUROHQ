"use client";

import { useState, useTransition } from "react";
import { updateBudgetSettings } from "@/app/actions/budget";
import { getCurrencySymbol } from "@/lib/utils/currency";

const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "JPY"];

type Props = {
  initialCurrency: string;
  initialImpulseThresholdPct: number;
  initialBudgetPeriod: "monthly" | "weekly";
  initialImpulseQuickAddMinutes: number | null;
  initialImpulseRiskCategories: string[];
};

export function SettingsBudget({
  initialCurrency,
  initialImpulseThresholdPct,
  initialBudgetPeriod,
  initialImpulseQuickAddMinutes,
  initialImpulseRiskCategories,
}: Props) {
  const [currency, setCurrency] = useState(initialCurrency || "EUR");
  const [impulsePct, setImpulsePct] = useState(String(initialImpulseThresholdPct ?? 40));
  const [budgetPeriod, setBudgetPeriod] = useState<"monthly" | "weekly">(initialBudgetPeriod ?? "monthly");
  const [quickAddMins, setQuickAddMins] = useState(initialImpulseQuickAddMinutes != null ? String(initialImpulseQuickAddMinutes) : "");
  const [riskCategories, setRiskCategories] = useState(initialImpulseRiskCategories?.length ? initialImpulseRiskCategories.join(", ") : "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setError(null);
    setSaved(false);
    const pct = parseInt(impulsePct, 10);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      setError("Impulse threshold must be between 0 and 100.");
      return;
    }
    const mins = quickAddMins.trim() ? parseInt(quickAddMins, 10) : null;
    if (quickAddMins.trim() && (isNaN(mins!) || mins! < 0 || mins! > 60)) {
      setError("Quick-add window must be 0–60 minutes or empty.");
      return;
    }
    const categories = riskCategories.split(",").map((s) => s.trim()).filter(Boolean);
    startTransition(async () => {
      try {
        await updateBudgetSettings({
          currency: currency.trim() || "EUR",
          impulse_threshold_pct: pct,
          budget_period: budgetPeriod,
          impulse_quick_add_minutes: mins,
          impulse_risk_categories: categories,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="card-modern overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Budget & spending</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Currency and impulse detection threshold.</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c} ({getCurrencySymbol(c)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Impulse threshold (%)</label>
            <p className="text-xs text-[var(--text-muted)] mb-1">
              Flag an unplanned expense as possible impulse when it’s above this % of your 4‑week average spend.
            </p>
            <input
              type="number"
              min="0"
              max="100"
              value={impulsePct}
              onChange={(e) => setImpulsePct(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Budget period</label>
            <select
              value={budgetPeriod}
              onChange={(e) => setBudgetPeriod(e.target.value as "monthly" | "weekly")}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Quick-add window (minutes)</label>
            <p className="text-xs text-[var(--text-muted)] mb-1">Flag as possible impulse if expense is added within this many minutes. Leave empty to disable.</p>
            <input
              type="number"
              min="0"
              max="60"
              placeholder="e.g. 2"
              value={quickAddMins}
              onChange={(e) => setQuickAddMins(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">High-risk categories (comma-separated)</label>
            <p className="text-xs text-[var(--text-muted)] mb-1">Unplanned expenses in these categories will be flagged as possible impulse.</p>
            <input
              type="text"
              placeholder="e.g. Shopping, Eating out"
              value={riskCategories}
              onChange={(e) => setRiskCategories(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
          </div>
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          {saved && <p className="text-sm text-green-400">Saved.</p>}
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
  );
}

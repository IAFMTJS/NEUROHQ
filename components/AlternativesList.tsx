"use client";

import { useState, useTransition } from "react";
import { dismissAlternative } from "@/app/actions/alternatives";
import { updateSavingsGoal } from "@/app/actions/savings";
import type { Alternative } from "@/app/actions/alternatives";
import { getCurrencySymbol } from "@/lib/utils/currency";

type Goal = { id: string; name: string; target_cents: number; current_cents: number; status?: string };

export function AlternativesList({
  alternatives,
  goals = [],
  currency = "EUR",
}: {
  alternatives: Alternative[];
  goals?: Goal[];
  currency?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [goalId, setGoalId] = useState("");
  const [amount, setAmount] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const activeGoals = goals.filter((g) => g.status !== "completed" && g.status !== "cancelled");
  const symbol = getCurrencySymbol(currency);

  function handleAddToGoal(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    const amountCents = amount.trim() ? Math.round(parseFloat(amount) * 100) : 0;
    if (!goalId || amountCents <= 0) {
      setAddError("Select a goal and enter an amount.");
      return;
    }
    const goal = activeGoals.find((g) => g.id === goalId);
    if (!goal) return;
    startTransition(async () => {
      try {
        await updateSavingsGoal(goalId, { current_cents: goal.current_cents + amountCents });
        setAmount("");
        setGoalId("");
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "Failed to add.");
      }
    });
  }

  if (alternatives.length === 0 && activeGoals.length === 0) return null;

  return (
    <div className="space-y-4">
      {activeGoals.length > 0 && (
        <form onSubmit={handleAddToGoal} className="flex flex-wrap items-end gap-3 rounded-lg border border-neuro-border bg-neuro-dark/40 p-3">
          <span className="text-xs font-medium text-neuro-muted w-full">Quick add to goal</span>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2 text-sm text-neuro-silver focus:border-neuro-blue focus:outline-none"
          >
            <option value="">Select goal</option>
            {activeGoals.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount (${symbol})`}
            className="w-28 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none"
          />
          <button type="submit" disabled={pending} className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">
            Add to goal
          </button>
          {addError && <p className="text-xs text-red-400 w-full">{addError}</p>}
        </form>
      )}
      {alternatives.length > 0 && (
        <ul className="space-y-2">
          {alternatives.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded border border-neutral-700 bg-neuro-surface px-3 py-2 text-sm text-neuro-silver"
            >
              <span>{a.suggestion_text}</span>
              <button
                type="button"
                onClick={() => startTransition(() => dismissAlternative(a.id))}
                disabled={pending}
                className="text-xs text-neutral-500 hover:text-neuro-silver focus:outline-none focus:underline"
                aria-label="Dismiss suggestion"
              >
                Dismiss
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

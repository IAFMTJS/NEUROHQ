"use client";

import { useTransition } from "react";
import { addSavingsContribution, updateSavingsGoal, deleteSavingsGoal } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";
import { getCurrencySymbol } from "@/lib/utils/currency";

type Goal = {
  id: string;
  name: string;
  target_cents: number;
  current_cents: number;
  deadline: string | null;
  status?: string;
};

export function SavingsGoalCard({
  goal,
  weeklyReq,
  currency = "EUR",
  contributedThisMonthCents = 0,
}: {
  goal: Goal;
  weeklyReq: number | null;
  currency?: string;
  contributedThisMonthCents?: number;
}) {
  const [pending, startTransition] = useTransition();
  const pct = goal.target_cents ? Math.min(100, Math.round((goal.current_cents / goal.target_cents) * 100)) : 0;
  const symbol = getCurrencySymbol(currency);
  const isReached = goal.current_cents >= goal.target_cents;
  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
  const weeksLeft =
    deadlineDate && deadlineDate > new Date()
      ? Math.max(1, Math.ceil((deadlineDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : null;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("amount") as HTMLInputElement;
    const noteInput = form.elements.namedItem("note") as HTMLInputElement | null;
    const value = input?.value?.trim();
    if (!value) return;
    const amountCents = Math.round(parseFloat(value) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;
    startTransition(async () => {
      await addSavingsContribution(goal.id, amountCents, noteInput?.value?.trim());
      form.reset();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this goal?")) return;
    startTransition(() => deleteSavingsGoal(goal.id));
  }

  function handleMarkComplete() {
    startTransition(() => updateSavingsGoal(goal.id, { status: "completed" }));
  }

  function handleCancelGoal() {
    if (!confirm("Archive this goal? You can still see it in settings if you show archived.")) return;
    startTransition(() => updateSavingsGoal(goal.id, { status: "cancelled" }));
  }

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="flex items-start justify-between border-b border-[var(--card-border)] px-4 py-3">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">{goal.name}</h3>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {symbol}{(goal.current_cents / 100).toFixed(2)} / {symbol}{(goal.target_cents / 100).toFixed(2)}
            {goal.deadline && ` · Deadline ${goal.deadline}`}
          </p>
          {weeklyReq !== null && weeklyReq > 0 && (
            <p className="mt-1 text-xs font-medium text-[var(--accent-focus)]">
              ~{symbol}{(weeklyReq / 100).toFixed(2)}/week to reach goal
              {weeksLeft !== null && ` · ${weeksLeft} week${weeksLeft !== 1 ? "s" : ""} left`}
            </p>
          )}
          {weeksLeft !== null && weeklyReq !== null && weeklyReq > 0 && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {isReached ? "Goal reached!" : (goal.current_cents + weeklyReq * weeksLeft >= goal.target_cents ? "On track" : "Add more to stay on track")}
            </p>
          )}
          {contributedThisMonthCents > 0 && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Added this month: {symbol}{(contributedThisMonthCents / 100).toFixed(2)}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isReached && (
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={pending}
              className="rounded-lg px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/10 transition"
            >
              Mark complete
            </button>
          )}
          <button
            type="button"
            onClick={handleCancelGoal}
            disabled={pending}
            className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--card-border)]/50 transition"
          >
            Archive
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
          <div
            className="h-full rounded-full bg-[var(--accent-focus)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isReached && (
          <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 50"
              className="w-28 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <input
              name="note"
              type="text"
              placeholder="Note (optional)"
              className="w-32 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <button type="submit" disabled={pending} className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

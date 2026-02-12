"use client";

import { useTransition } from "react";
import { updateSavingsGoal, deleteSavingsGoal } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";

type Goal = {
  id: string;
  name: string;
  target_cents: number;
  current_cents: number;
  deadline: string | null;
};

export function SavingsGoalCard({ goal, weeklyReq }: { goal: Goal; weeklyReq: number | null }) {
  const [pending, startTransition] = useTransition();
  const pct = goal.target_cents ? Math.min(100, Math.round((goal.current_cents / goal.target_cents) * 100)) : 0;

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const amount = parseInt((form.elements.namedItem("amount") as HTMLInputElement)?.value ?? "0", 10);
    if (isNaN(amount) || amount <= 0) return;
    startTransition(async () => {
      await updateSavingsGoal(goal.id, { current_cents: goal.current_cents + amount });
      form.reset();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this goal?")) return;
    startTransition(() => deleteSavingsGoal(goal.id));
  }

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="flex items-start justify-between border-b border-neuro-border px-4 py-3">
        <div>
          <h3 className="font-semibold text-neuro-silver">{goal.name}</h3>
          <p className="mt-0.5 text-sm text-neuro-muted">
            {(goal.current_cents / 100).toFixed(2)} / {(goal.target_cents / 100).toFixed(2)}
            {goal.deadline && ` · Deadline ${goal.deadline}`}
          </p>
          {weeklyReq !== null && weeklyReq > 0 && (
            <p className="mt-1 text-xs font-medium text-neuro-blue">~{(weeklyReq / 100).toFixed(0)}/week to reach goal</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-lg px-2 py-1 text-xs text-neuro-muted hover:bg-red-500/10 hover:text-red-400 transition"
        >
          Delete
        </button>
      </div>
      <div className="p-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-neuro-border">
          <div
            className="h-full rounded-full bg-neuro-blue transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input
            name="amount"
            type="number"
            min="1"
            step="100"
            placeholder="Add (cents)"
            className="w-24 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          />
          <button type="submit" disabled={pending} className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}

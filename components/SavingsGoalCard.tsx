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
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-neuro-silver">{goal.name}</h3>
          <p className="text-sm text-neutral-400">
            {(goal.current_cents / 100).toFixed(2)} / {(goal.target_cents / 100).toFixed(2)}
            {goal.deadline && ` · Deadline ${goal.deadline}`}
          </p>
          {weeklyReq !== null && weeklyReq > 0 && (
            <p className="mt-1 text-xs text-neuro-blue">~{(weeklyReq / 100).toFixed(0)}/week to reach goal</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="text-xs text-neutral-500 hover:text-red-400"
        >
          Delete
        </button>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-700">
        <div
          className="h-full rounded-full bg-neuro-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <form onSubmit={handleAdd} className="mt-2 flex gap-2">
        <input
          name="amount"
          type="number"
          min="1"
          step="100"
          placeholder="Add (cents)"
          className="w-24 rounded border border-neutral-600 bg-neuro-dark px-2 py-1 text-sm text-white"
        />
        <button type="submit" disabled={pending} className="rounded bg-neuro-blue px-2 py-1 text-sm text-white">
          Add
        </button>
      </form>
    </div>
  );
}

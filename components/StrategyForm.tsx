"use client";

import { useState, useTransition } from "react";
import { upsertQuarterlyStrategy } from "@/app/actions/strategy";

type Strategy = {
  primary_theme: string | null;
  secondary_theme: string | null;
  savings_goal_id: string | null;
  identity_statement: string | null;
} | null;

type Goal = { id: string; name: string };

export function StrategyForm({ initial, goals }: { initial: Strategy; goals: Goal[] }) {
  const [primary, setPrimary] = useState(initial?.primary_theme ?? "");
  const [secondary, setSecondary] = useState(initial?.secondary_theme ?? "");
  const [savingsGoalId, setSavingsGoalId] = useState(initial?.savings_goal_id ?? "");
  const [identity, setIdentity] = useState(initial?.identity_statement ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertQuarterlyStrategy({
        primary_theme: primary || null,
        secondary_theme: secondary || null,
        savings_goal_id: savingsGoalId || null,
        identity_statement: identity || null,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <div>
        <label className="block text-xs text-neutral-400">Primary theme</label>
        <input
          type="text"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          placeholder="e.g. Focus"
          className="mt-1 w-full rounded border border-neutral-600 bg-neuro-dark px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400">Secondary theme</label>
        <input
          type="text"
          value={secondary}
          onChange={(e) => setSecondary(e.target.value)}
          placeholder="e.g. Health"
          className="mt-1 w-full rounded border border-neutral-600 bg-neuro-dark px-3 py-2 text-sm text-white"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-400">Savings goal (optional)</label>
        <select
          value={savingsGoalId}
          onChange={(e) => setSavingsGoalId(e.target.value)}
          className="mt-1 w-full rounded border border-neutral-600 bg-neuro-dark px-3 py-2 text-sm text-white"
        >
          <option value="">None</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-400">Identity statement</label>
        <textarea
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="e.g. I am focused and consistent."
          rows={3}
          className="mt-1 w-full rounded border border-neutral-600 bg-neuro-dark px-3 py-2 text-sm text-white"
        />
      </div>
      <button type="submit" disabled={pending} className="rounded bg-neuro-blue px-3 py-2 text-sm text-white">
        Save strategy
      </button>
    </form>
  );
}

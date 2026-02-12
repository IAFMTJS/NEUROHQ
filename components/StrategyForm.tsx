"use client";

import { useState, useTransition } from "react";
import { upsertQuarterlyStrategy } from "@/app/actions/strategy";

type Strategy = {
  primary_theme: string | null;
  secondary_theme: string | null;
  savings_goal_id: string | null;
  identity_statement: string | null;
  key_results: string | null;
} | null;

type Goal = { id: string; name: string };

export function StrategyForm({ initial, goals }: { initial: Strategy; goals: Goal[] }) {
  const [primary, setPrimary] = useState(initial?.primary_theme ?? "");
  const [secondary, setSecondary] = useState(initial?.secondary_theme ?? "");
  const [savingsGoalId, setSavingsGoalId] = useState(initial?.savings_goal_id ?? "");
  const [identity, setIdentity] = useState(initial?.identity_statement ?? "");
  const [keyResults, setKeyResults] = useState(initial?.key_results ?? "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertQuarterlyStrategy({
        primary_theme: primary || null,
        secondary_theme: secondary || null,
        savings_goal_id: savingsGoalId || null,
        identity_statement: identity || null,
        key_results: keyResults.trim() || null,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">Quarterly strategy</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Theme, identity, key results, and linked savings goal.</p>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-neuro-silver">Primary theme</label>
          <input
            type="text"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            placeholder="e.g. Focus"
            className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neuro-silver">Secondary theme</label>
          <input
            type="text"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            placeholder="e.g. Health"
            className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neuro-silver">Savings goal (optional)</label>
          <select
            value={savingsGoalId}
            onChange={(e) => setSavingsGoalId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
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
          <label className="block text-sm font-medium text-neuro-silver">Identity statement</label>
          <textarea
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            placeholder="e.g. I am focused and consistent."
            rows={3}
            className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          />
          <p className="mt-1 text-xs text-neuro-muted">Who you want to be this quarter.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neuro-silver">Key results / milestones</label>
          <textarea
            value={keyResults}
            onChange={(e) => setKeyResults(e.target.value)}
            placeholder="e.g. Ship feature X. Complete course Y. Save €Z."
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          />
          <p className="mt-1 text-xs text-neuro-muted">One per line. Concrete outcomes you want by end of quarter.</p>
        </div>
        <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
          Save strategy
        </button>
      </div>
    </form>
  );
}

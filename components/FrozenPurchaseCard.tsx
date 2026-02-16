"use client";

import { useState, useTransition } from "react";
import { confirmFreeze, cancelFreeze } from "@/app/actions/budget";
import { formatCents } from "@/lib/utils/currency";

type Entry = {
  id: string;
  amount_cents: number;
  date: string;
  category: string | null;
  note: string | null;
  freeze_until: string | null;
};

type Goal = { id: string; name: string; target_cents: number; current_cents: number; status?: string };

type Props = {
  activeFrozen: Entry[];
  readyForAction: Entry[];
  currency?: string;
  goals?: Goal[];
};

function formatDate(s: string): string {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function FrozenPurchaseCard({ activeFrozen, readyForAction, currency = "EUR", goals = [] }: Props) {
  const [pending, startTransition] = useTransition();
  const activeGoals = goals.filter((g) => g.status !== "completed" && g.status !== "cancelled");

  if (activeFrozen.length === 0 && readyForAction.length === 0) return null;

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">24h freeze</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Confirm or cancel. You can cancel early or add the amount to a goal.</p>
      </div>
      <div className="p-4 space-y-4">
        {activeFrozen.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-[var(--text-muted)] mb-2">Still frozen</h3>
            <ul className="space-y-2">
              {activeFrozen.map((e) => (
                <li key={e.id} className="flex justify-between items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/50 px-3 py-2.5 text-sm">
                  <div>
                    <span className="text-[var(--text-primary)]">{formatCents(e.amount_cents, currency)}</span>
                    {e.note && <span className="ml-2 text-[var(--text-muted)]">— {e.note}</span>}
                    <p className="mt-1 text-xs text-[var(--text-muted)]">Until {e.freeze_until ? formatDate(e.freeze_until) : ""}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startTransition(() => cancelFreeze(e.id))}
                    disabled={pending}
                    className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--card-border)]/50 disabled:opacity-50"
                  >
                    Cancel freeze
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {readyForAction.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-[var(--text-muted)] mb-2">Ready to confirm or cancel</h3>
            <ul className="space-y-2">
              {readyForAction.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/50 px-3 py-2.5 text-sm">
                  <div>
                    <span className="text-[var(--text-primary)]">{formatCents(e.amount_cents, currency)}</span>
                    {e.note && <span className="ml-2 text-[var(--text-muted)]">— {e.note}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startTransition(() => confirmFreeze(e.id))}
                      disabled={pending}
                      className="rounded-lg bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(() => cancelFreeze(e.id))}
                      disabled={pending}
                      className="rounded-lg border border-[var(--card-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--card-border)]/50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    {activeGoals.length > 0 && (
                      <CancelAndAddToGoal
                        entryId={e.id}
                        amountCents={Math.abs(e.amount_cents)}
                        goals={activeGoals}
                        currency={currency}
                        pending={pending}
                        onCancel={() => startTransition(() => cancelFreeze(e.id, {}))}
                        onAddToGoal={(goalId) => startTransition(() => cancelFreeze(e.id, { addToGoalId: goalId }))}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function CancelAndAddToGoal({
  entryId,
  amountCents,
  goals,
  currency,
  pending,
  onAddToGoal,
}: {
  entryId: string;
  amountCents: number;
  goals: Goal[];
  currency: string;
  pending: boolean;
  onCancel: () => void;
  onAddToGoal: (goalId: string) => void;
}) {
  const [selected, setSelected] = useState("");
  return (
    <span className="inline-flex items-center gap-1">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
      >
        <option value="">Add to goal…</option>
        {goals.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending || !selected}
        onClick={() => selected && onAddToGoal(selected)}
        className="rounded-lg bg-[var(--accent-focus)]/80 px-2 py-1 text-xs font-medium text-white hover:bg-[var(--accent-focus)] disabled:opacity-50"
      >
        Cancel & add
      </button>
    </span>
  );
}

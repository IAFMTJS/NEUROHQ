"use client";

import { useState, useTransition } from "react";
import { createSavingsGoal } from "@/app/actions/savings";

const TRANSIENT_SERVER_ACTION_ERROR = "An unexpected response was received from the server.";

function isTransientServerActionError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(TRANSIENT_SERVER_ACTION_ERROR);
}

async function withServerActionRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isTransientServerActionError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return fn();
  }
}

export function AddSavingsGoalForm({ readOnly = false }: { readOnly?: boolean }) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const target_cents = Math.round(parseFloat(target) * 100);
    if (!name.trim() || isNaN(target_cents) || target_cents <= 0) return;
    startTransition(async () => {
      try {
        setSubmitError(null);
        await withServerActionRetry(() =>
          createSavingsGoal({ name: name.trim(), target_cents, deadline: deadline || undefined })
        );
        setName("");
        setTarget("");
        setDeadline("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not create savings goal.";
        setSubmitError(message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">Goal name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency fund"
          className="w-40 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">Target (e.g. 1000)</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-28 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--text-muted)]">Deadline (optional)</span>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
        />
      </label>
      <button type="submit" disabled={pending || readOnly} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        Add goal
      </button>
      {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
      {readOnly && (
        <p className="text-xs text-[var(--text-muted)]">
          History mode: switch to current period to add goals.
        </p>
      )}
    </form>
  );
}

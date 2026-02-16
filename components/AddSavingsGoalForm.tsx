"use client";

import { useState, useTransition } from "react";
import { createSavingsGoal } from "@/app/actions/savings";

export function AddSavingsGoalForm() {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const target_cents = Math.round(parseFloat(target) * 100);
    if (!name.trim() || isNaN(target_cents) || target_cents <= 0) return;
    startTransition(async () => {
      await createSavingsGoal({ name: name.trim(), target_cents, deadline: deadline || undefined });
      setName("");
      setTarget("");
      setDeadline("");
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
      <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        Add goal
      </button>
    </form>
  );
}

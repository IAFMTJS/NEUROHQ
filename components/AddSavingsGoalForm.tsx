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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Goal name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency fund"
          className="w-40 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Target (e.g. 1000)</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="w-24 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Deadline (YYYY-MM-DD)</span>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-neuro-blue px-3 py-1.5 text-sm text-white">
        Add goal
      </button>
    </form>
  );
}

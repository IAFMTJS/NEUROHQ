"use client";

import { useState, useTransition } from "react";
import { createEducationOption } from "@/app/actions/learning";

export function AddEducationOptionForm() {
  const [name, setName] = useState("");
  const [interest, setInterest] = useState("5");
  const [futureValue, setFutureValue] = useState("5");
  const [effort, setEffort] = useState("5");
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const i = parseInt(interest, 10);
    const f = parseInt(futureValue, 10);
    const eff = parseInt(effort, 10);
    if (!name.trim() || isNaN(i) || isNaN(f) || isNaN(eff)) return;
    startTransition(async () => {
      await createEducationOption({
        name: name.trim(),
        interest_score: Math.max(1, Math.min(10, i)),
        future_value_score: Math.max(1, Math.min(10, f)),
        effort_score: Math.max(1, Math.min(10, eff)),
        category: category.trim() || null,
      });
      setName("");
      setInterest("5");
      setFutureValue("5");
      setEffort("5");
      setCategory("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-700 bg-[var(--bg-surface)] p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Learn TypeScript"
          className="w-48 rounded border border-neutral-600 bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Category (optional)</span>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Programming"
          className="w-32 rounded border border-neutral-600 bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-white"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Interest (1–10)</span>
        <input
          type="number"
          min="1"
          max="10"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="w-14 rounded border border-neutral-600 bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-white"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Future value (1–10)</span>
        <input
          type="number"
          min="1"
          max="10"
          value={futureValue}
          onChange={(e) => setFutureValue(e.target.value)}
          className="w-14 rounded border border-neutral-600 bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-white"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Effort (1–10)</span>
        <input
          type="number"
          min="1"
          max="10"
          value={effort}
          onChange={(e) => setEffort(e.target.value)}
          className="w-14 rounded border border-neutral-600 bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-white"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-[var(--accent-focus)] px-3 py-1.5 text-sm text-white">
        Add option
      </button>
    </form>
  );
}

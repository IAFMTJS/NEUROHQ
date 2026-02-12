"use client";

import { useState, useTransition } from "react";
import { addLearningSession } from "@/app/actions/learning";

export function AddLearningSessionForm({ date }: { date: string }) {
  const [minutes, setMinutes] = useState("");
  const [topic, setTopic] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = parseInt(minutes, 10);
    if (isNaN(m) || m <= 0) return;
    startTransition(async () => {
      await addLearningSession({ minutes: m, date, topic: topic || undefined });
      setMinutes("");
      setTopic("");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2 rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Minutes</span>
        <input
          type="number"
          min="1"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-20 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
          required
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Topic (optional)</span>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. React"
          className="w-40 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
        />
      </label>
      <button type="submit" disabled={pending} className="rounded bg-neuro-blue px-3 py-1.5 text-sm text-white">
        Log session
      </button>
    </form>
  );
}

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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neuro-muted">Minutes</span>
        <input
          type="number"
          min="1"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-24 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neuro-muted">Topic (optional)</span>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. React"
          className="w-44 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
        Log session
      </button>
    </form>
  );
}

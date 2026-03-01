"use client";

import type { FC } from "react";
import { useState, useTransition } from "react";
import type { LearningReflectionState } from "@/app/actions/learning-state";
import { submitLearningReflection } from "@/app/actions/learning-state";

type Props = {
  reflection: LearningReflectionState;
  today: string;
};

export const GrowthReflectionCard: FC<Props> = ({ reflection, today }) => {
  const [understood, setUnderstood] = useState("");
  const [difficult, setDifficult] = useState("");
  const [adjust, setAdjust] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const highlight = reflection.reflectionRequired && !submitted;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const ok = await submitLearningReflection({
        date: today,
        understood,
        difficult,
        adjust,
      });
      if (ok) {
        setSubmitted(true);
      }
    });
  }

  const disabled = pending || submitted;

  return (
    <section
      className={`card-simple overflow-hidden p-0 ${
        highlight ? "ring-1 ring-[var(--accent-primary)]/40" : ""
      }`}
    >
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Reflection</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Short weekly check-in. Max 500 characters per question.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            What did you understand?
          </label>
          <textarea
            value={understood}
            onChange={(e) => setUnderstood(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30 disabled:opacity-60"
            placeholder="Keep it short and concrete."
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            What was difficult?
          </label>
          <textarea
            value={difficult}
            onChange={(e) => setDifficult(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30 disabled:opacity-60"
            placeholder="Name friction, not failure."
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            What will you adjust?
          </label>
          <textarea
            value={adjust}
            onChange={(e) => setAdjust(e.target.value)}
            maxLength={500}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30 disabled:opacity-60"
            placeholder="One concrete tweak for next week."
            disabled={disabled}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--text-muted)]">
            Sunday highlight when weekly reflection is due.
          </p>
          <button
            type="submit"
            disabled={disabled}
            className="rounded-lg bg-[var(--accent-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {submitted ? "Saved" : pending ? "Saving…" : "Save reflection"}
          </button>
        </div>
      </form>
    </section>
  );
};


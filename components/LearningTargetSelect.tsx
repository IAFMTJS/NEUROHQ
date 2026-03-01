"use client";

import { useTransition } from "react";
import { updateWeeklyLearningTarget } from "@/app/actions/learning";

const PRESETS = [30, 60, 90, 120];

type Props = { currentTarget: number };

export function LearningTargetSelect({ currentTarget }: Props) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">Weekly target:</span>
      <select
        value={currentTarget}
        onChange={(e) => {
          const v = parseInt(e.target.value, 10);
          if (isNaN(v)) return;
          startTransition(() => updateWeeklyLearningTarget(v));
        }}
        disabled={pending}
        className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)]/80 px-2 py-1 text-xs text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none disabled:opacity-50"
      >
        {PRESETS.map((m) => (
          <option key={m} value={m}>
            {m} min
          </option>
        ))}
        {!PRESETS.includes(currentTarget) && (
          <option value={currentTarget}>{currentTarget} min</option>
        )}
      </select>
    </div>
  );
}

"use client";

import { useState } from "react";

type Props = { target: number };

export function LearningStreakExplain({ target }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline"
      >
        {open ? "Hide" : "How is streak calculated?"}
      </button>
      {open && (
        <p className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">
          Consecutive weeks where you hit at least {target} minutes. This week counts once it’s over (after Sunday). No penalties for missing a week — the streak just resets.
        </p>
      )}
    </div>
  );
}

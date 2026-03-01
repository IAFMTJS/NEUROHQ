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
          Streak = aantal opeenvolgende weken waarin je je <strong>wekelijkse target</strong> hebt gehaald (jouw target: {target} min). Niet op totaal uren — elke week telt apart: gehaald of niet. Deze week telt mee zodra hij voorbij is (na zondag). Geen straf bij missen; de streak reset dan.
        </p>
      )}
    </div>
  );
}

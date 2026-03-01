"use client";

import type { FC } from "react";

type Props = {
  categoryTotals: Record<string, number>;
  impulseWindow?: string | null;
};

export const BudgetPatternDetectionCard: FC<Props> = ({ categoryTotals, impulseWindow }) => {
  const entries = Object.entries(categoryTotals).filter(([, v]) => v > 0);

  if (!entries.length && !impulseWindow) {
    return (
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Pattern Detection</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--text-muted)]">
            Not enough recent data to detect spending patterns yet.
          </p>
        </div>
      </section>
    );
  }

  let message: string;
  if (impulseWindow) {
    message = `Impulse spending peaks between ${impulseWindow}. Consider adding extra guardrails in that window.`;
  } else if (entries.length) {
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const [topCategory, topAmount] = entries.sort((a, b) => b[1] - a[1])[0];
    const topPct = total > 0 ? (topAmount / total) * 100 : 0;

    if (topPct >= 60) {
      message = `Spending is heavily concentrated in ${topCategory} (~${topPct.toFixed(
        0,
      )}%). Consider whether this matches your current priorities.`;
    } else if (topPct >= 40) {
      message = `${topCategory} is your largest category (~${topPct.toFixed(
        0,
      )}%), but spending is still somewhat spread across others.`;
    } else {
      message =
        "Spending is fairly distributed across categories. No single dominant pattern yet.";
    }
  } else {
    message = "Not enough data yet to detect clear spending patterns.";
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Pattern Detection</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Lightweight pattern scan on where your money actually flows.
        </p>
      </div>
      <div className="p-4">
        <p className="text-sm text-[var(--text-primary)]">{message}</p>
      </div>
    </section>
  );
};


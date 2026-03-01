"use client";

import type { FC } from "react";

type Props = {
  /** 0–100 discipline score */
  value: number | null | undefined;
};

function getDisciplineLabel(score: number) {
  if (score >= 80) return "Stable";
  if (score >= 60) return "Declining";
  return "Critical";
}

export const DisciplineIndexCard: FC<Props> = ({ value }) => {
  const safeValue = typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Discipline Index</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Combined signal from budget adherence, impulse control, logging consistency, and weekly reviews.
        </p>
      </div>
      <div className="p-4 space-y-3">
        {safeValue == null ? (
          <p className="text-sm text-[var(--text-muted)]">
            Discipline score is not available yet.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-[var(--text-muted)]">Score</p>
              <p className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                {safeValue}/100
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
                <div
                  className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                  style={{ width: `${safeValue}%` }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Status:{" "}
                <span className="font-medium text-[var(--text-secondary)]">
                  {getDisciplineLabel(safeValue)}
                </span>
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
};


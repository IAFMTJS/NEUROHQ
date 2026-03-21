"use client";

import type { FC } from "react";

type Props = {
  /** Calm days this week: spend that day ≤ safe daily (incl. geen uitgave gelogd). */
  daysUnderBudget: number | null | undefined;
  /** XP earned from discipline-related budget actions (placeholder for now). */
  disciplineXp: number | null | undefined;
};

export const WeeklyPerformanceCard: FC<Props> = ({ daysUnderBudget, disciplineXp }) => {
  const safeDays = typeof daysUnderBudget === "number" && daysUnderBudget >= 0 ? daysUnderBudget : 0;
  const xp = typeof disciplineXp === "number" && disciplineXp >= 0 ? disciplineXp : 0;
  const maxDays = 7;
  const pct = Math.max(0, Math.min(100, (safeDays / maxDays) * 100));

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Weekly Performance</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Rustige dagen: uitgave op of onder je veilige dagtempo (ook dagen zonder boeking).
        </p>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm text-[var(--text-muted)]">Kalme dagen</p>
          <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {safeDays}/{maxDays}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Hoger = meer dagen binnen je veilige dagbudget (geen overspend die dag).
          </p>
        </div>

        <div className="flex items-baseline justify-between">
          <p className="text-sm text-[var(--text-muted)]">XP from discipline</p>
          <p className="text-base font-semibold tabular-nums text-[var(--accent-primary)]">
            +{xp} XP
          </p>
        </div>
      </div>
    </section>
  );
};


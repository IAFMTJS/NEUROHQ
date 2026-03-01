"use client";

import type { FC } from "react";
import type { LearningConsistency } from "@/app/actions/learning-state";

type Props = {
  consistency: LearningConsistency;
  today: string;
};

function getStatusLabel(ratio: number): string {
  if (ratio >= 1) return "Excellent momentum";
  if (ratio >= 0.75) return "On track";
  if (ratio >= 0.4) return "Behind";
  return "Critical drift";
}

export const GrowthConsistencyCard: FC<Props> = ({ consistency, today }) => {
  const { sessionsThisWeek, weeklyTargetSessions, completionRatio, currentStreak } = consistency;
  const safeRatio = Math.max(0, Math.min(1, completionRatio));

  const date = new Date(today + "T00:00:00");
  const isWednesday = date.getDay() === 3;
  const showAdjustmentHint = isWednesday && safeRatio < 0.5 && weeklyTargetSessions > 0;

  const showStreakReset =
    currentStreak === 0 && sessionsThisWeek > 0;

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Consistency</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Weekly rhythm in sessions, not minutes.
        </p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">This week</p>
            <p className="mt-0.5 text-sm text-[var(--text-primary)]">
              {sessionsThisWeek} / {weeklyTargetSessions} sessions
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-[var(--text-muted)]">Status</p>
            <p className="mt-0.5 text-sm font-semibold text-[var(--text-secondary)]">
              {getStatusLabel(safeRatio)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${safeRatio * 100}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Weekly streak:{" "}
            <span className="font-medium text-[var(--text-secondary)]">
              {currentStreak} week{currentStreak === 1 ? "" : "s"} in a row
            </span>
          </p>
        </div>

        {showAdjustmentHint && (
          <div className="mt-2 rounded-lg border border-[var(--card-border-strong)] bg-[var(--bg-soft)] px-3 py-2 text-xs text-[var(--text-secondary)]">
            Consistency dropping. Adjust target?
          </div>
        )}

        {showStreakReset && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Consistency reset. Rebuild momentum.
          </p>
        )}
      </div>
    </section>
  );
};


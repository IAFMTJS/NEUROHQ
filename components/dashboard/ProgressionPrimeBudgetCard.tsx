"use client";

export interface ProgressionRankState {
  rank: string;
  nextRank: string | null;
  criteria: { minTotalXp: number; minStreak: number; minCompletionRate7d: number } | null;
  progress: { totalXp: number; streak: number; completionRate7d: number };
}

export interface PrimeWindow {
  start: string;
  end: string;
  active: boolean;
}

export interface WeeklyBudgetOutcome {
  weekStart: string;
  message: string;
  recoveryAvailable: boolean;
}

export function ProgressionPrimeBudgetCard({
  progressionRank,
  primeWindow,
  weeklyBudgetOutcome,
}: {
  progressionRank: ProgressionRankState | null;
  primeWindow: PrimeWindow | null;
  weeklyBudgetOutcome: WeeklyBudgetOutcome | null;
}) {
  if (!progressionRank && !primeWindow?.active && !weeklyBudgetOutcome) return null;

  const rankLabel = progressionRank?.rank ? progressionRank.rank.charAt(0).toUpperCase() + progressionRank.rank.slice(1) : null;

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/80 px-4 py-3 text-sm">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Rank &amp; week
      </h3>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {rankLabel != null && (
          <span className="text-[var(--text-primary)]">
            <strong>Rank:</strong> {rankLabel}
            {progressionRank?.nextRank && (
              <span className="ml-1 text-[var(--text-secondary)]">
                → {progressionRank.nextRank.charAt(0).toUpperCase() + progressionRank.nextRank.slice(1)}
              </span>
            )}
          </span>
        )}
        {primeWindow?.active && (
          <span className="text-[var(--text-primary)]">
            <strong>Prime window:</strong> {primeWindow.start}–{primeWindow.end}
          </span>
        )}
        {weeklyBudgetOutcome?.message && (
          <span className="text-[var(--text-primary)]">
            <strong>Week:</strong> {weeklyBudgetOutcome.message}
            {weeklyBudgetOutcome.recoveryAvailable && (
              <span className="ml-1 text-amber-400/90">(3× S-rank voor herstel)</span>
            )}
          </span>
        )}
      </div>
    </section>
  );
}

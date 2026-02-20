"use client";

/**
 * Dashboard Identity Block: Level, Rank, Streak, Next unlock preview, XP needed today for level up.
 */

type Props = {
  level: number;
  rank: string;
  streak: number;
  xpToNextLevel: number;
  nextUnlock: { level: number; rank: string; xpNeeded: number };
};

export function IdentityBlock({ level, rank, streak, xpToNextLevel, nextUnlock }: Props) {
  return (
    <section
      className="glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)]"
      aria-label="Identity & progress"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">Level {level}</span>
        <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">{rank}</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
            🔥 {streak} day streak
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Volgende unlock: <strong className="text-[var(--text-primary)]">Level {nextUnlock.level}</strong> — {nextUnlock.rank}
      </p>
      {xpToNextLevel > 0 && (
        <p className="mt-1 text-xs text-[var(--accent-focus)]">
          Vandaag nog nodig voor level up: <strong>{xpToNextLevel} XP</strong>
        </p>
      )}
    </section>
  );
}

"use client";

import Link from "next/link";

type Props = {
  disciplinePoints: number;
  focusCredits: number;
  momentumBoosters: number;
  compact?: boolean;
};

export function EconomyBadge({ disciplinePoints, focusCredits, momentumBoosters, compact = false }: Props) {
  if (compact) {
    return (
      <Link
        href="/tasks"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-focus)]/50 hover:text-[var(--text-primary)] transition"
        aria-label={`Discipline: ${disciplinePoints}, Focus: ${focusCredits}, Momentum: ${momentumBoosters}`}
      >
        <span title="Discipline Points">🛡️ {disciplinePoints}</span>
        <span title="Focus Credits">🎯 {focusCredits}</span>
        <span title="Momentum Boosters">⚡ {momentumBoosters}</span>
      </Link>
    );
  }
  return (
    <Link
      href="/tasks"
      className="card-simple flex items-center gap-3 px-4 py-3 hover:opacity-90 transition"
    >
      <span className="text-xl" aria-hidden>🛡️</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-[var(--text-primary)]">Economy</p>
        <p className="text-xs text-[var(--text-muted)]">
          Discipline {disciplinePoints} · Focus {focusCredits} · Momentum {momentumBoosters}
        </p>
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";

type Props = {
  totalXp: number;
  level: number;
  compact?: boolean;
};

export function XPBadge({ totalXp, level, compact = false }: Props) {
  if (compact) {
    return (
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neuro-border)] bg-[var(--neuro-surface)]/80 px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-focus)]/50 hover:text-[var(--text-primary)] transition"
        aria-label={`Level ${level}, ${totalXp} XP`}
      >
        <span aria-hidden>⭐</span>
        <span>Lv.{level}</span>
        <span className="text-[var(--text-muted)]">{totalXp} XP</span>
      </Link>
    );
  }
  return (
    <Link
      href="/settings"
      className="card-modern flex items-center gap-3 px-4 py-3 hover:bg-[var(--neuro-surface)]/80 transition"
    >
      <span className="text-2xl" aria-hidden>⭐</span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Level {level}</p>
        <p className="text-xs text-[var(--text-muted)]">{totalXp} XP total</p>
      </div>
      <span className="ml-auto text-sm text-[var(--accent-focus)]">View in Settings →</span>
    </Link>
  );
}

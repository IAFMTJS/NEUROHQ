"use client";

/**
 * Identity Engine block: Level, Rank, Streak, Archetype, Reputation (Discipline/Consistency/Impact), Evolution Phase.
 * "Mensen komen terug voor wie ze aan het worden zijn."
 */

import type { Archetype, EvolutionPhase, ReputationScore } from "@/lib/identity-engine";
import { ARCHETYPE_LABELS, EVOLUTION_PHASE_LABELS } from "@/lib/identity-engine";

type Props = {
  level: number;
  rank: string;
  streak: number;
  xpToNextLevel: number;
  nextUnlock: { level: number; rank: string; xpNeeded: number };
  archetype?: Archetype;
  evolutionPhase?: EvolutionPhase;
  reputation?: ReputationScore;
  embedded?: boolean;
  className?: string;
};

function ReputationBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-xs text-[var(--text-muted)]">{label}</span>
      <div className="h-1.5 flex-1 max-w-24 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--accent-focus)]"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-[var(--text-secondary)]">{value}</span>
    </div>
  );
}

export function IdentityBlock({
  level,
  rank,
  streak,
  xpToNextLevel,
  nextUnlock,
  archetype = "operator",
  evolutionPhase = "initiate",
  reputation,
  embedded = false,
  className = "",
}: Props) {
  const content = (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">Level {level}</span>
        <span className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">{rank}</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">
            🔥 {streak} day streak
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="rounded bg-white/10 px-2 py-0.5 font-medium text-[var(--text-secondary)]">
          {ARCHETYPE_LABELS[archetype]}
        </span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="text-[var(--text-muted)]">{EVOLUTION_PHASE_LABELS[evolutionPhase]}</span>
      </div>

      {reputation && (
        <div className="mt-3 space-y-1.5 border-t border-[var(--card-border)] pt-3">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Reputatie</p>
          <ReputationBar label="Discipline" value={reputation.discipline} />
          <ReputationBar label="Consistentie" value={reputation.consistency} />
          <ReputationBar label="Impact" value={reputation.impact} />
        </div>
      )}

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        Volgende unlock: <strong className="text-[var(--text-primary)]">Level {nextUnlock.level}</strong> — {nextUnlock.rank}
      </p>
      {xpToNextLevel > 0 && (
        <p className="mt-1 text-xs text-[var(--accent-focus)]">
          Vandaag nog nodig voor level up: <strong>{xpToNextLevel} XP</strong>
        </p>
      )}
    </>
  );

  if (embedded) {
    return (
      <section className={`p-4 ${className}`.trim()} aria-label="Identity Engine">
        {content}
      </section>
    );
  }

  return (
    <section
      className={`glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)] ${className}`.trim()}
      aria-label="Identity Engine"
    >
      {content}
    </section>
  );
}

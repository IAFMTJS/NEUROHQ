"use client";

import { useDCICGameState } from "@/lib/dcic/game-state-client";

export function DCICStatusCard() {
  const { gameState, status } = useDCICGameState();

  const loading = status === "loading" && !gameState;

  if (status === "error" && !gameState) {
    return null;
  }

  const level = gameState?.level;
  const rank = gameState?.rank;
  const currentXP = gameState?.currentXP;
  const xpToNextLevel = gameState?.xpToNextLevel;
  const streakCurrent = gameState?.streak.current;
  const streakLongest = gameState?.streak.longest;
  const energy = gameState?.stats.energy;
  const focus = gameState?.stats.focus;

  return (
    <section
      className="glass-card glass-card-3d overflow-hidden rounded-2xl border border-[var(--card-border)]"
      aria-label="Commander status"
    >
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Commander status
        </h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Level, rank, streak en energie — direct uit je game engine.
        </p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Level & rank
          </p>
          {loading ? (
            <div className="mt-2 h-6 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-1 space-y-1">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {level ?? "–"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {rank ?? "Rank onbekend"}
              </p>
              {currentXP != null && xpToNextLevel != null && (
                <p className="text-xs text-[var(--text-muted)]">
                  {currentXP} / {xpToNextLevel} XP naar level{" "}
                  {(level ?? 0) + 1}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Streak
          </p>
          {loading ? (
            <div className="mt-2 h-6 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-1 space-y-1">
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {streakCurrent ?? "–"} dagen
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Langste: {streakLongest ?? "–"}
              </p>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Energie & focus
          </p>
          {loading ? (
            <div className="mt-2 h-6 w-24 animate-pulse rounded bg-white/10" />
          ) : (
            <div className="mt-1 space-y-1">
              <p className="text-sm text-[var(--text-secondary)]">
                Energie:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {energy != null ? `${energy}/100` : "–"}
                </span>
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Focus:{" "}
                <span className="font-semibold text-[var(--text-primary)]">
                  {focus != null ? `${focus}/100` : "–"}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


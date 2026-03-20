"use client";

import { useTransition, useState } from "react";
import {
  applyBudgetOptimizationLock,
  validateAndCompleteBudgetOptimizationChallenge,
} from "@/app/actions/budget-intelligence";

type Props = {
  summary: string;
  suggestions: string[];
  challenges: Array<{ key: string; label: string; xp: number; description: string }>;
};

export function BudgetOptimizationCard({ summary, suggestions, challenges }: Props) {
  const [pending, startTransition] = useTransition();
  const [awardedXpByKey, setAwardedXpByKey] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [lockInfo, setLockInfo] = useState<string | null>(null);
  return (
    <section className="card-simple space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Optimalisatie</h3>
      <p className="text-xs text-[var(--text-muted)]">{summary}</p>
      <ul className="space-y-1 text-sm text-[var(--text-primary)]">
        {suggestions.length === 0 ? <li>Nog geen concrete suggesties beschikbaar.</li> : suggestions.map((s) => <li key={s}>- {s}</li>)}
      </ul>
      <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Snelle interventies</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-60"
            onClick={() =>
              startTransition(async () => {
                const result = await applyBudgetOptimizationLock(1);
                setLockInfo(`24u focus-lock actief tot ${result.lockUntil}.`);
              })
            }
          >
            Start 24u focus-lock
          </button>
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-60"
            onClick={() =>
              startTransition(async () => {
                const result = await applyBudgetOptimizationLock(3);
                setLockInfo(`72u reset-lock actief tot ${result.lockUntil}.`);
              })
            }
          >
            Start 72u reset-lock
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Challenges</p>
        {challenges.map((challenge) => (
          <div key={challenge.key} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
            <p className="text-sm text-[var(--text-primary)]">{challenge.label}</p>
            <p className="text-xs text-[var(--text-muted)]">{challenge.description}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Reward: {challenge.xp} XP</p>
            <button
              type="button"
              disabled={pending}
              className="mt-2 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
              onClick={() =>
                startTransition(async () => {
                  const result = await validateAndCompleteBudgetOptimizationChallenge(challenge.key);
                  setAwardedXpByKey((prev) => ({ ...prev, [challenge.key]: result.awardedXp }));
                  setMessage(result.message);
                })
              }
            >
              {pending ? "Valideren..." : "Valideer resultaat"}
            </button>
            {awardedXpByKey[challenge.key] != null && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {awardedXpByKey[challenge.key] > 0
                  ? `${awardedXpByKey[challenge.key]} XP toegekend.`
                  : "Challenge vandaag al verwerkt of nog niet behaald."}
              </p>
            )}
          </div>
        ))}
      </div>
      {lockInfo && <p className="text-xs text-[var(--text-muted)]">{lockInfo}</p>}
      {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}
    </section>
  );
}


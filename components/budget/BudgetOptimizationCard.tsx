"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  applyBudgetOptimizationLock,
  validateAndCompleteBudgetOptimizationChallenge,
} from "@/app/actions/budget-intelligence";
import { useBudgetLock } from "@/components/budget/BudgetLockContext";
import { formatLockEndDateTime, formatLockEndShort } from "@/lib/budget-lock-display";

type Props = {
  lockPanelHref: string;
  summary: string;
  suggestions: string[];
  challenges: Array<{ key: string; label: string; xp: number; description: string }>;
};

export function BudgetOptimizationCard({ lockPanelHref, summary, suggestions, challenges }: Props) {
  const { lockActive, lockUntilAt } = useBudgetLock();
  const [pending, startTransition] = useTransition();
  const [awardedXpByKey, setAwardedXpByKey] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [lockInfo, setLockInfo] = useState<string | null>(null);

  const lockSummary =
    "Je hebt al een no-spend lock lopen. Extra focus-locks en challenge-validatie horen bij één actie tegelijk — volg je huidige lock af op Execute, of log een nooduitgave als dat nodig is.";
  const untilLabel = formatLockEndDateTime(lockUntilAt);

  return (
    <section className="card-simple space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Optimalisatie</h3>

      {lockActive && (
        <div className="rounded-lg border border-amber-400/50 bg-amber-500/15 px-3 py-2.5 text-xs text-amber-50">
          <p className="font-semibold text-amber-100">Lock actief — interventies hieronder staan op pauze</p>
          {untilLabel && <p className="mt-1 text-amber-50/95">Tot {untilLabel}</p>}
          <p className="mt-1.5 text-[var(--text-secondary)]">{lockSummary}</p>
          <a
            href={lockPanelHref}
            className="mt-2 inline-block text-xs font-semibold text-[var(--semantic-accent)] underline-offset-2 hover:underline"
          >
            Open lock- en nooduitgave-paneel op Execute
          </a>
        </div>
      )}

      <p className={`text-xs text-[var(--text-muted)] ${lockActive ? "opacity-80" : ""}`}>
        {lockActive ? "Suggesties blijven ter referentie; prioriteit is je lopende lock." : summary}
      </p>
      <ul
        className={`space-y-1 text-sm text-[var(--text-primary)] ${lockActive ? "rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-primary)]/30 p-2 opacity-70" : ""}`}
      >
        {suggestions.length === 0 ? (
          <li>{lockActive ? "Geen extra suggesties nodig — focus op je lock." : "Nog geen concrete suggesties beschikbaar."}</li>
        ) : (
          suggestions.map((s) => <li key={s}>- {s}</li>)
        )}
      </ul>
      <div
        className={`rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3 space-y-2 ${lockActive ? "opacity-60" : ""}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Snelle interventies</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || lockActive}
            title={lockActive ? "Er is al een no-spend lock actief." : undefined}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-60"
            onClick={() => {
              if (lockActive) {
                toast.message("Niet beschikbaar tijdens no-spend lock — gebruik het noodpad onderaan Execute.");
                return;
              }
              startTransition(async () => {
                const result = await applyBudgetOptimizationLock(1);
                setLockInfo(
                  `24u focus-lock actief tot ${formatLockEndShort(result.lockUntilAt) ?? result.lockUntil}.`
                );
              });
            }}
          >
            Start 24u focus-lock
          </button>
          <button
            type="button"
            disabled={pending || lockActive}
            title={lockActive ? "Er is al een no-spend lock actief." : undefined}
            className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-60"
            onClick={() => {
              if (lockActive) {
                toast.message("Niet beschikbaar tijdens no-spend lock — gebruik het noodpad onderaan Execute.");
                return;
              }
              startTransition(async () => {
                const result = await applyBudgetOptimizationLock(3);
                setLockInfo(
                  `72u reset-lock actief tot ${formatLockEndShort(result.lockUntilAt) ?? result.lockUntil}.`
                );
              });
            }}
          >
            Start 72u reset-lock
          </button>
        </div>
      </div>
      <div className={`space-y-2 ${lockActive ? "opacity-60" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Challenges</p>
        {challenges.map((challenge) => (
          <div key={challenge.key} className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3">
            <p className="text-sm text-[var(--text-primary)]">{challenge.label}</p>
            <p className="text-xs text-[var(--text-muted)]">{challenge.description}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Reward: {challenge.xp} XP</p>
            <button
              type="button"
              disabled={pending || lockActive}
              className="mt-2 rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
              onClick={() => {
                if (lockActive) {
                  toast.message("Challenge validatie is geblokkeerd tijdens no-spend lock.");
                  return;
                }
                startTransition(async () => {
                  const result = await validateAndCompleteBudgetOptimizationChallenge(challenge.key);
                  setAwardedXpByKey((prev) => ({ ...prev, [challenge.key]: result.awardedXp }));
                  setMessage(result.message);
                });
              }}
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


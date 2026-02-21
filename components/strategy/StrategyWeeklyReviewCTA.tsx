"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertStrategyReview } from "@/app/actions/strategyFocus";
import { domainLabel, type StrategyDomain } from "@/lib/strategyDomains";

const DOMAINS: StrategyDomain[] = ["discipline", "health", "learning", "business"];

type Props = {
  strategyId: string;
  weekNumber: number;
  weekStart: string;
  reviewDue: boolean;
  lastAlignmentScore: number | null;
  /** Optional: show compact when not due */
  compact?: boolean;
};

export function StrategyWeeklyReviewCTA({
  strategyId,
  weekNumber,
  weekStart,
  reviewDue,
  lastAlignmentScore,
  compact,
}: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [biggestDrift, setBiggestDrift] = useState<string>("");
  const [strongestDomain, setStrongestDomain] = useState<string>("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      await upsertStrategyReview({
        strategyId,
        weekNumber,
        weekStart,
        alignment_score: lastAlignmentScore ?? undefined,
        biggest_drift_domain: biggestDrift || undefined,
        strongest_domain: strongestDomain || undefined,
        notes: notes.trim() || undefined,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  if (!reviewDue) {
    return (
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Weekly review
        </h2>
        <p className="mt-2 text-sm text-[var(--text-primary)]">
          Deze week al gereviewd. Volgende review aan het begin van de nieuwe week.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-focus)]">
        Verplicht strategy review (elke 7 dagen)
      </h2>
      <p className="mt-2 text-sm text-[var(--text-primary)]">
        Zonder review: nieuwe week inactive. Strategie vereist onderhoud.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Grootste afwijking (domein)
          </label>
          <select
            value={biggestDrift}
            onChange={(e) => setBiggestDrift(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">— Kies —</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {domainLabel(d)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Sterkste domein
          </label>
          <select
            value={strongestDomain}
            onChange={(e) => setStrongestDomain(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">— Kies —</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {domainLabel(d)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Notities</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
            placeholder="Wat ging goed, wat anders?"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[var(--accent-focus)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Review afronden"}
        </button>
      </form>
    </section>
  );
}

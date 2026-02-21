"use client";

import Link from "next/link";
import type { CoachRecommendation } from "@/lib/insight-engine";

type Props = {
  recommendations: CoachRecommendation[];
};

export function InsightsCoachCard({ recommendations }: Props) {
  if (recommendations.length === 0) {
    return (
      <section
        className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
        aria-label="Aanbevelingen"
      >
        <h2 className="hq-h2 mb-4">Aanbevolen strategie</h2>
        <p className="hq-body text-[var(--text-muted)]">
          Geen specifieke aanbevelingen nu. Blijf consistent en check hier later voor acties.
        </p>
      </section>
    );
  }

  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      aria-label="Aanbevelingen"
    >
      <h2 className="hq-h2 mb-4">Aanbevolen strategie</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Max 3 acties voor de komende dagen. Elke insight eindigt met een actie.
      </p>
      <ul className="space-y-4">
        {recommendations.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/30 p-3"
          >
            <h3 className="font-semibold text-[var(--text-primary)]">{r.title}</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{r.body}</p>
            <Link
              href={r.actionHref}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent-focus)] hover:underline"
            >
              👉 {r.actionLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

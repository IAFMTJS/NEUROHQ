"use client";

import Link from "next/link";

type Props = {
  archetype: string;
  reason: string;
  action: string;
};

export function ArchetypeRiskLensCard({ archetype, reason, action }: Props) {
  return (
    <section className="card-simple overflow-hidden p-0 ring-1 ring-amber-300/20 shadow-[0_0_24px_rgba(251,191,36,0.1)]">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(90deg,rgba(251,191,36,0.1),rgba(236,72,153,0.04))] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Archetype & risk lens</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Gedragsprofiel op basis van recente patronen.</p>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-sm text-[var(--text-muted)]">Archetype</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">{archetype}</p>
        <p className="text-xs text-[var(--text-muted)]">{reason}</p>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2 text-sm text-[var(--text-primary)]">
          Actie 48u: {action}
        </div>
        <Link href="/budget?tab=tactical" className="text-xs font-medium text-[var(--accent-focus)] hover:underline">
          Actie uitvoeren →
        </Link>
      </div>
    </section>
  );
}

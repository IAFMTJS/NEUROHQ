"use client";

import { domainLabel, type StrategyDomain } from "@/lib/strategyDomains";

const DOMAINS: StrategyDomain[] = ["discipline", "health", "learning", "business"];

type Props = {
  momentumByDomain: Record<StrategyDomain, number>;
};

export function StrategyMomentumPerDomain({ momentumByDomain }: Props) {
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Strategic momentum per domein
      </h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        XP laatste 7 dagen / XP vorige 7 dagen — waar groei zit, waar stagnatie.
      </p>
      <ul className="mt-3 space-y-2">
        {DOMAINS.map((d) => {
          const ratio = momentumByDomain[d] ?? 0;
          const label =
            ratio > 1.2 ? "Groei" : ratio > 0.8 ? "Stabiel" : ratio > 0 ? "Daling" : "Geen data";
          const color =
            ratio > 1.2
              ? "var(--accent-focus)"
              : ratio > 0.8
                ? "var(--accent-cyan)"
                : ratio > 0
                  ? "var(--accent-amber)"
                  : "var(--text-muted)";
          return (
            <li
              key={d}
              className="flex items-center justify-between rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-card)]/50 px-3 py-2"
            >
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {domainLabel(d)}
              </span>
              <span className="tabular-nums text-sm" style={{ color }}>
                {ratio > 0 ? ratio.toFixed(2) : "—"}×
              </span>
              <span className="text-xs text-[var(--text-muted)]">{label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

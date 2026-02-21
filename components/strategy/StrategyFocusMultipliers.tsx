"use client";

import { domainLabel, type StrategyDomain } from "@/lib/strategyDomains";

type Props = {
  primaryDomain: StrategyDomain;
  secondaryDomains: string[];
};

export function StrategyFocusMultipliers({ primaryDomain, secondaryDomains }: Props) {
  const domains: StrategyDomain[] = ["discipline", "health", "learning", "business"];
  const getMultiplier = (d: StrategyDomain) => {
    if (d === primaryDomain) return "+30%";
    if (secondaryDomains.includes(d)) return "+10%";
    return "−20%";
  };
  const getRole = (d: StrategyDomain) => {
    if (d === primaryDomain) return "Primary";
    if (secondaryDomains.includes(d)) return "Secondary";
    return "Overige";
  };

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Focus & XP multipliers
      </h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Primary +30%, Secondary +10%, Overige −20%. Missies buiten focus: zachte confrontatie.
      </p>
      <ul className="mt-3 space-y-2">
        {domains.map((d) => (
          <li
            key={d}
            className="flex items-center justify-between rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-card)]/50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-[var(--text-primary)]">{domainLabel(d)}</span>
            <span className="text-xs text-[var(--text-muted)]">{getRole(d)}</span>
            <span
              className={
                d === primaryDomain
                  ? "font-semibold text-[var(--accent-focus)]"
                  : secondaryDomains.includes(d)
                    ? "font-medium text-[var(--accent-cyan)]"
                    : "text-[var(--text-muted)]"
              }
            >
              {getMultiplier(d)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

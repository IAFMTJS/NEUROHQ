"use client";

import { domainLabel } from "@/lib/strategyDomains";

type Props = {
  biggestSabotagePattern: string | null;
  mostEffectiveType: string | null;
  comfortzoneScore: number;
  growthPerDomain: Record<string, number>;
};

export function MetaInsights30Banner({
  biggestSabotagePattern,
  mostEffectiveType,
  comfortzoneScore,
  growthPerDomain,
}: Props) {
  const hasAny = biggestSabotagePattern ?? mostEffectiveType ?? Object.keys(growthPerDomain).length > 0;
  if (!hasAny) return null;

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Meta (laatste 30 dagen)</h3>
      <ul className="mt-2 space-y-1 text-[var(--text-primary)]">
        {biggestSabotagePattern && (
          <li><span className="text-[var(--text-muted)]">Grootste sabotage: </span>{biggestSabotagePattern}</li>
        )}
        {mostEffectiveType && (
          <li><span className="text-[var(--text-muted)]">Meest effectief: </span>{mostEffectiveType}</li>
        )}
        <li><span className="text-[var(--text-muted)]">Comfortzone score: </span>{Math.round(comfortzoneScore * 100)}%</li>
        {Object.entries(growthPerDomain).length > 0 && (
          <li>
            <span className="text-[var(--text-muted)]">Groei per domein: </span>
            {Object.entries(growthPerDomain).map(([d, pct]) => `${domainLabel(d)} ${Math.round(pct * 100)}%`).join(", ")}
          </li>
        )}
      </ul>
    </div>
  );
}

"use client";

import type { RecentCompletionWithRank } from "@/app/actions/dcic/insight-engine";

const RANK_COLORS: Record<string, string> = {
  S: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  A: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  B: "bg-sky-500/20 text-sky-400 border-sky-500/40",
  C: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

type Props = {
  items: RecentCompletionWithRank[];
};

export function InsightsRecentRanksCard({ items }: Props) {
  if (items.length === 0) {
    return (
      <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Rank geschiedenis">
        <h2 className="hq-h2 mb-2">Rank geschiedenis</h2>
        <p className="text-sm text-[var(--text-muted)]">Laatste 30 dagen: nog geen voltooiingen met rank.</p>
      </section>
    );
  }

  return (
    <section className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5" aria-label="Rank geschiedenis">
      <h2 className="hq-h2 mb-1">Rank geschiedenis</h2>
      <p className="mb-4 text-sm text-[var(--text-muted)]">Recente voltooiingen met performance rank (S/A/B/C).</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={`${item.type}-${item.date}-${item.occurredAt}-${i}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm font-medium text-[var(--text-primary)]" title={item.label}>
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {item.rank && (
                <span
                  className={`inline-flex shrink-0 rounded border px-2 py-0.5 text-xs font-bold ${RANK_COLORS[item.rank] ?? "bg-white/10 text-[var(--text-secondary)]"}`}
                >
                  {item.rank}
                </span>
              )}
              {item.score != null && (
                <span className="text-xs text-[var(--text-muted)]">{item.score}</span>
              )}
              <span className="text-xs text-[var(--text-muted)]">{item.date}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

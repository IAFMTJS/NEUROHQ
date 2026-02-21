"use client";

import Link from "next/link";

type Props = {
  score: number;
  band: "low" | "medium" | "high";
  trendDirection: "up" | "plateau" | "down";
  microcopy: string;
};

const bandStyles: Record<"low" | "medium" | "high", string> = {
  high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-red-500/20 text-red-300 border-red-500/40",
};

const trendSymbol: Record<"up" | "plateau" | "down", string> = {
  up: "↑",
  plateau: "→",
  down: "↓",
};

export function InsightsMomentumHero({ score, band, trendDirection, microcopy }: Props) {
  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] overflow-hidden p-0"
      aria-label="Momentum"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-bold tabular-nums ${bandStyles[band]}`}
            aria-hidden
          >
            {score}
          </div>
          <div>
            <h2 className="hq-h2 mb-1">Momentum Score</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Snelheid, consistentie, streak
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
          <span className="text-lg font-medium text-[var(--text-primary)]" aria-hidden>
            {trendSymbol[trendDirection]}
          </span>
          <p className="text-sm text-[var(--text-secondary)]">{microcopy}</p>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden bg-[var(--bg-surface)]">
        <div
          className={`h-full rounded-r-full transition-all ${
            band === "high" ? "bg-emerald-500" : band === "medium" ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="p-4 pt-3">
        <Link
          href="/tasks"
          className="btn-hq-secondary inline-flex w-full items-center justify-center rounded-[var(--hq-btn-radius)] py-2.5 px-4"
        >
          Optimaliseer
        </Link>
      </div>
    </section>
  );
}

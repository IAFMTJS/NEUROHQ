"use client";

import type { MomentumBand } from "@/lib/momentum";

type Props = {
  score: number;
  band: MomentumBand;
  embedded?: boolean;
  className?: string;
};

const bandStyles: Record<MomentumBand, string> = {
  high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-red-500/20 text-red-300 border-red-500/40",
};

export function MomentumScore({ score, band, embedded = false, className = "" }: Props) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Momentum</p>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
            Consistentie, completion rate, streak
          </p>
        </div>
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-xl font-bold tabular-nums ${bandStyles[band]}`}
          aria-hidden
        >
          {score}
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${
            band === "high" ? "bg-emerald-500" : band === "medium" ? "bg-amber-500" : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </>
  );

  if (embedded) {
    return (
      <section className={`p-4 ${className}`.trim()} aria-label="Momentum score">
        {content}
      </section>
    );
  }

  return (
    <section
      className={`glass-card glass-card-3d p-4 rounded-2xl border border-[var(--card-border)] ${className}`.trim()}
      aria-label="Momentum score"
    >
      {content}
    </section>
  );
}

"use client";

type Props = {
  used: number;
  cap: number;
  remaining: number;
  planned: number;
  /** Thin strip + gradient fill — matches visual-lab missions command deck. */
  variant?: "card" | "commandDeckStrip";
};

export function EnergyCapBar({ used, cap, remaining, planned, variant = "card" }: Props) {
  const pct = cap > 0 ? (used / cap) * 100 : 0;

  if (variant === "commandDeckStrip") {
    return (
      <div className="space-y-1" aria-label="Energy vandaag">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <span>Dag-budget (visueel)</span>
          <span className="tabular-nums text-[var(--text-secondary)]">
            {used}/{cap}
            {planned > 0 && <span className="ml-1 font-normal normal-case tracking-normal text-[var(--text-muted)]">(+{planned})</span>}
            <span className="ml-1.5 text-[var(--text-muted)]">· {Math.min(100, Math.round(pct))}%</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] via-[var(--semantic-accent)] to-emerald-400/90 shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)] transition-all"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        {remaining <= 2 && remaining > 0 && (
          <p className="text-[11px] leading-relaxed text-amber-400/95">Bijna op. Plan lichte taken of wacht tot morgen.</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-white/5 px-4 py-3" aria-label="Energy vandaag">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-[var(--text-muted)]">Energy vandaag</span>
        <span className="font-medium tabular-nums text-[var(--text-primary)]">
          {used}/{cap}
          {planned > 0 && <span className="ml-1 text-[var(--text-muted)]">(+{planned} gepland)</span>}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--accent-focus)] transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      {remaining <= 2 && remaining > 0 && (
        <p className="mt-1 text-xs text-amber-400">Bijna op. Plan lichte taken of wacht tot morgen.</p>
      )}
    </div>
  );
}

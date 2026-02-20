"use client";

type Props = {
  used: number;
  cap: number;
  remaining: number;
  planned: number;
};

export function EnergyCapBar({ used, cap, remaining, planned }: Props) {
  const pct = cap > 0 ? (used / cap) * 100 : 0;

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

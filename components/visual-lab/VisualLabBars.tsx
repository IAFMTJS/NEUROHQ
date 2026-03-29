"use client";

type SegmentedBarProps = {
  label: string;
  caption?: string;
  /** 0–1 fill per segment (mock). */
  fills: number[];
  segmentLabels?: string[];
};

export function SegmentedBar({ label, caption, fills, segmentLabels }: SegmentedBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</span>
        {caption ? <span className="text-[10px] text-[var(--text-secondary)]">{caption}</span> : null}
      </div>
      <div className="flex gap-1.5" role="img" aria-label={`${label}: ${fills.map((f) => `${Math.round(f * 100)}%`).join(", ")}`}>
        {fills.map((fill, i) => (
          <div key={i} className="min-w-0 flex-1">
            {segmentLabels?.[i] ? (
              <span className="mb-1 block truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {segmentLabels[i]}
              </span>
            ) : null}
            <div className="h-3 overflow-hidden rounded-md border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.75)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
              <div
                className="h-full rounded-sm bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] via-[var(--semantic-accent)] to-emerald-400/90 shadow-[0_0_10px_rgba(var(--mode-rgb),0.25)] transition-[width] duration-500"
                style={{ width: `${Math.max(0, Math.min(1, fill)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ZoneBandBarProps = {
  label: string;
  caption?: string;
  /** Marker position 0–100. */
  pct: number;
  /** Optional footer labels under bands (default Low / Target / High). */
  bandFootLabels?: readonly [string, string, string];
  className?: string;
};

/** Background bands: low / target / high — marker shows current reading. */
export function ZoneBandBar({
  label,
  caption,
  pct,
  bandFootLabels = ["Low", "Target", "High"],
  className = "",
}: ZoneBandBarProps) {
  const x = Math.max(0, Math.min(100, pct));
  const [lowL, midL, highL] = bandFootLabels;
  return (
    <div className={className ? `space-y-2 ${className}` : "space-y-2"}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</span>
        {caption ? <span className="text-[10px] tabular-nums text-[var(--text-secondary)]">{caption}</span> : null}
      </div>
      <div className="relative pt-1">
        <div
          className="relative h-4 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.18)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]"
          role="img"
          aria-label={`${label} at ${x}%`}
        >
          <div className="absolute inset-0 flex">
            <div className="h-full w-[35%] bg-gradient-to-b from-red-500/25 to-red-950/30" title="Low band" />
            <div className="h-full w-[40%] bg-gradient-to-b from-emerald-500/18 to-cyan-950/20" title="Target band" />
            <div className="h-full w-[25%] bg-gradient-to-b from-amber-500/22 to-amber-950/25" title="High band" />
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-[35%] w-px bg-[rgba(var(--mode-rgb),0.2)]" aria-hidden />
          <div className="pointer-events-none absolute inset-y-0 left-[75%] w-px bg-[rgba(var(--mode-rgb),0.2)]" aria-hidden />
          <div
            className="pointer-events-none absolute top-1/2 z-10 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-[var(--text-primary)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.65),0_0_20px_rgba(255,255,255,0.15)]"
            style={{ left: `${x}%` }}
            aria-hidden
          />
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">
          <span>{lowL}</span>
          <span>{midL}</span>
          <span>{highL}</span>
        </div>
      </div>
    </div>
  );
}

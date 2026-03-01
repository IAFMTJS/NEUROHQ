"use client";

const PHASES = [
  { key: "accumulation", label: "Accumulation" },
  { key: "intensification", label: "Intensification" },
  { key: "optimization", label: "Optimization" },
  { key: "stabilization", label: "Stabilization" },
] as const;

type Phase = (typeof PHASES)[number]["key"];

type Props = {
  phase: Phase;
};

export function StrategyPhaseIndicator({ phase }: Props) {
  const idx = PHASES.findIndex((p) => p.key === phase);
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Strategy phase cycle
      </h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Accumulation → Intensification → Optimization → Stabilization. Beïnvloedt XP, moeilijkheid, missie-type.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PHASES.map((p, i) => (
          <span
            key={p.key}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              p.key === phase
                ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]"
                : i < idx
                  ? "border-[var(--card-border)] bg-[var(--bg-card)]/50 text-[var(--text-muted)]"
                  : "border-[var(--card-border)] bg-[var(--bg-card)] text-[var(--text-primary)]"
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </section>
  );
}

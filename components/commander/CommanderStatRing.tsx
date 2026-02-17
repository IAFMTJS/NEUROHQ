"use client";

type Variant = "energy" | "focus" | "load";

const accentByVariant: Record<Variant, string> = {
  energy: "var(--accent-cyan)",
  focus: "var(--accent-primary)",
  load: "var(--accent-amber)",
};

type Props = {
  value: number;
  variant: Variant;
};

export function CommanderStatRing({ value, variant }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  const accent = accentByVariant[variant];

  return (
    <div
      className={`stat-ring ${variant}`}
      style={{
        background: `conic-gradient(${accent} 0% ${pct}%, rgba(255,255,255,0.05) ${pct}% 100%)`,
      }}
      aria-hidden
    >
      <div className="stat-inner">
        <span>{pct}%</span>
      </div>
    </div>
  );
}

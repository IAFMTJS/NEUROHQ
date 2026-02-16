"use client";

/**
 * Commander HQ UI Kit – Status ring with conic gradient fill.
 * Uses design tokens: --hq-cyan, --hq-purple, --hq-green.
 */
export type HQStatusRingProps = {
  /** 0–100 */
  value: number;
  label: string;
  className?: string;
};

export function HQStatusRing({ value, label, className = "" }: HQStatusRingProps) {
  const angle = Math.min(100, Math.max(0, value)) / 100 * 360;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative w-24 h-24">
        {/* Glow behind ring */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--hq-cyan)] via-[var(--hq-purple)] to-[var(--hq-green)] blur-md opacity-70"
          aria-hidden
        />
        {/* Ring: conic fill then inner circle to form ring */}
        <div
          className="absolute inset-0 rounded-full border-2 border-white/10"
          style={{
            background: `conic-gradient(var(--hq-purple) 0deg, var(--hq-purple) ${angle}deg, transparent ${angle}deg)`,
          }}
        />
        <div className="absolute inset-3 rounded-full bg-[var(--hq-bg-2)]" />
        {/* Inner center */}
        <div className="absolute inset-4 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white font-semibold">
          {Math.round(value)}%
        </div>
      </div>
      <span className="text-sm text-white/70">{label}</span>
    </div>
  );
}

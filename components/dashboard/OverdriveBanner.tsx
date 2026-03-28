"use client";

import { useEffect, useMemo, useState } from "react";
import { getOverdriveHeatEfficiency } from "@/lib/dcic/mode-engine";

type Props = {
  lockedUntil: string | null;
  overdriveSessionStart: string | null;
};

const taglines = [
  "Everything you do today hits harder.",
  "Double XP. No excuses.",
  "If you're gonna move, move now.",
];

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function OverdriveBanner({ lockedUntil, overdriveSessionStart }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingMs = useMemo(() => {
    if (!lockedUntil) return 0;
    const end = Date.parse(lockedUntil);
    if (Number.isNaN(end)) return 0;
    return end - now;
  }, [lockedUntil, now]);

  const heat = useMemo(
    () => getOverdriveHeatEfficiency(overdriveSessionStart, now),
    [overdriveSessionStart, now]
  );
  const heatPct = Math.round(heat * 100);
  const tagline = taglines[new Date().getDate() % taglines.length];

  return (
    <div
      className="overdrive-banner relative z-20 mb-2 overflow-hidden rounded-2xl border border-cyan-400/35 bg-gradient-to-r from-cyan-950/80 via-sky-950/70 to-blue-950/80 px-4 py-3 shadow-[0_0_28px_rgba(56,189,248,0.22)]"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(56,189,248,0.5), transparent 45%), radial-gradient(circle at 80% 30%, rgba(125,211,252,0.35), transparent 40%)",
        }}
      />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-200/95">
            Overdrive active — all XP ×2
          </p>
          <p className="mt-1 text-sm font-medium text-sky-50/95">{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {lockedUntil ? (
            <div className="rounded-lg border border-cyan-400/30 bg-black/25 px-3 py-1.5 text-center tabular-nums">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">
                Ends in
              </div>
              <div className="text-lg font-bold text-sky-100">{formatRemaining(remainingMs)}</div>
            </div>
          ) : null}
          <div className="rounded-lg border border-cyan-400/25 bg-black/20 px-3 py-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/75">
              XP efficiency
            </div>
            <div className="text-sm font-semibold text-sky-100">{heatPct}%</div>
            <div className="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-[width] duration-500"
                style={{ width: `${heatPct}%` }}
              />
            </div>
            {heat < 1 ? (
              <p className="mt-1 text-[10px] text-sky-200/70">
                Overheat: long grind = lower XP gain. Take a break; come back sharp.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

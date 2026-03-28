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
      className="overdrive-banner relative z-20 mb-2 overflow-hidden rounded-2xl border border-fuchsia-500/40 bg-gradient-to-r from-violet-950/90 via-purple-950/85 to-fuchsia-950/80 px-4 py-3 shadow-[0_0_32px_rgba(168,85,247,0.35),0_0_60px_rgba(192,38,211,0.12)]"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 45%, rgba(168,85,247,0.55), transparent 42%), radial-gradient(circle at 82% 28%, rgba(236,72,153,0.2), transparent 38%), radial-gradient(circle at 50% 100%, rgba(190,242,100,0.08), transparent 50%)",
        }}
      />
      <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-fuchsia-200/95">
            Overdrive active — all XP ×2
          </p>
          <p className="mt-1 text-sm font-medium text-violet-50/95">{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {lockedUntil ? (
            <div className="rounded-lg border border-violet-400/35 bg-black/30 px-3 py-1.5 text-center tabular-nums">
              <div className="text-[9px] font-semibold uppercase tracking-wider text-fuchsia-200/85">
                Ends in
              </div>
              <div className="text-lg font-bold text-violet-100">{formatRemaining(remainingMs)}</div>
            </div>
          ) : null}
          <div className="rounded-lg border border-fuchsia-500/30 bg-black/25 px-3 py-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-fuchsia-200/80">
              XP efficiency
            </div>
            <div className="text-sm font-semibold text-violet-100">{heatPct}%</div>
            <div className="mt-1 h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-black/45">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-lime-300 transition-[width] duration-500"
                style={{ width: `${heatPct}%` }}
              />
            </div>
            {heat < 1 ? (
              <p className="mt-1 text-[10px] text-fuchsia-200/75">
                Overheat: long grind = lower XP gain. Take a break; come back sharp.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

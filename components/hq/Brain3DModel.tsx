"use client";

import dynamic from "next/dynamic";

const Brain3DCanvas = dynamic(() => import("./Brain3DCanvas").then((m) => m.Brain3DCanvas), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center bg-[var(--bg-surface)]/50 rounded-xl animate-pulse"
      style={{ aspectRatio: "1", minHeight: 120 }}
    >
      <span className="text-[var(--text-muted)] text-sm">Loading…</span>
    </div>
  ),
});

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  className?: string;
};

export function Brain3DModel({ energyPct, focusPct, loadPct, className = "" }: Props) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ aspectRatio: "1", minHeight: 120 }}
      aria-hidden
    >
      <Brain3DCanvas
        energyPct={energyPct}
        focusPct={focusPct}
        loadPct={loadPct}
      />
    </div>
  );
}

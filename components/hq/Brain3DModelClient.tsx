"use client";

import dynamic from "next/dynamic";

const Brain3DModel = dynamic(
  () => import("./Brain3DModel").then((m) => m.Brain3DModel),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full aspect-square min-h-[160px] rounded-xl bg-[var(--bg-surface)]/50 animate-pulse"
        aria-hidden
      />
    ),
  }
);

type Props = {
  energyPct: number;
  focusPct: number;
  loadPct: number;
  className?: string;
};

export function Brain3DModelClient({ energyPct, focusPct, loadPct, className = "" }: Props) {
  return (
    <Brain3DModel
      energyPct={energyPct}
      focusPct={focusPct}
      loadPct={loadPct}
      className={className}
    />
  );
}

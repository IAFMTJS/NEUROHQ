"use client";

import Link from "next/link";
import { HudLinkButton } from "@/components/hud-test/HudLinkButton";

type Props = {
  disciplinePoints: number;
  focusCredits: number;
  momentumBoosters: number;
  compact?: boolean;
};

export function EconomyBadge({ disciplinePoints, focusCredits, momentumBoosters, compact = false }: Props) {
  if (compact) {
    return (
      <HudLinkButton
        href="/tasks"
        className="dashboard-hud-chip shrink-0 whitespace-nowrap rounded-[10px] px-2 text-[9px] font-semibold normal-case tracking-[0.03em]"
        style={{ height: "26px", minHeight: "26px", paddingTop: 0, paddingBottom: 0, paddingLeft: "6px", paddingRight: "6px" }}
        aria-label={`Discipline: ${disciplinePoints}, Focus: ${focusCredits}, Momentum: ${momentumBoosters}`}
      >
        <span title="Discipline Points">🛡️ {disciplinePoints}</span>
        <span title="Focus Credits">🎯 {focusCredits}</span>
        <span title="Momentum Boosters">⚡ {momentumBoosters}</span>
      </HudLinkButton>
    );
  }
  return (
    <Link
      href="/tasks"
      className="card-simple flex items-center gap-3 px-4 py-3 hover:opacity-90 transition"
    >
      <span className="text-xl" aria-hidden>🛡️</span>
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-[var(--text-primary)]">Economy</p>
        <p className="text-xs text-[var(--text-muted)]">
          Discipline {disciplinePoints} · Focus {focusCredits} · Momentum {momentumBoosters}
        </p>
      </div>
    </Link>
  );
}

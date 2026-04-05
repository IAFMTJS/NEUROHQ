"use client";

import Link from "next/link";

type Props = {
  summary: string | null;
  emptyMessage: string;
  href: string;
};

/** Compact “main mission” summary for the dashboard bridge (left of the mission CTA). */
export function DashboardMainMissionTeaser({ summary, emptyMessage, href }: Props) {
  const line = summary?.trim() || emptyMessage;
  return (
    <Link
      href={href}
      className="bridge-main-mission-teaser glass-card glass-preserve-decoration flex min-h-[48px] flex-col justify-center rounded-xl border border-[var(--card-border)] px-3 py-2.5 text-left no-underline transition hover:border-[rgba(var(--mode-rgb),0.28)]"
    >
      <p
        className="text-[9px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: "rgba(var(--mode-rgb), 0.78)" }}
      >
        Hoofdmissie
      </p>
      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[var(--text-primary)]">{line}</p>
    </Link>
  );
}

"use client";

import Link from "next/link";
import type { TaskWithUMS } from "@/app/actions/missions-performance";
import { getMissionDifficultyRank, getMissionRankStyle } from "@/lib/mission-difficulty-rank";

type Props = {
  tasks: TaskWithUMS[];
  maxItems?: number;
};

export function HighROISection({ tasks, maxItems = 3 }: Props) {
  const byROI = [...tasks].filter((t) => t.umsBreakdown.roi > 0).sort((a, b) => b.umsBreakdown.roi - a.umsBreakdown.roi).slice(0, maxItems);
  if (byROI.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-4" aria-label="High ROI">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">High ROI (XP/tijd)</h3>
      <ul className="mt-2 space-y-1.5">
        {byROI.map((t) => {
          const rank = getMissionDifficultyRank(t.umsBreakdown.ums);
          return (
            <li key={t.id} className="flex items-center gap-2">
              <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold border ${getMissionRankStyle(rank)}`}>{rank}</span>
              <Link href="/tasks" className="text-sm font-medium text-[var(--text-primary)] hover:underline">
                {t.title ?? "Task"} — ROI {Math.round(t.umsBreakdown.roi * 100)}%
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

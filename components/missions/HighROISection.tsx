"use client";

import Link from "next/link";
import type { TaskWithUMS } from "@/app/actions/missions-performance";

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
        {byROI.map((t) => (
          <li key={t.id}>
            <Link href="/tasks" className="block text-sm font-medium text-[var(--text-primary)] hover:underline">
              {t.title ?? "Task"} — ROI {Math.round(t.umsBreakdown.roi * 100)}%
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

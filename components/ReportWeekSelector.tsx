"use client";

import Link from "next/link";

type Week = { week_start: string; week_end: string };

export function ReportWeekSelector({
  storedWeeks,
  currentWeekStart,
  selectedWeekStart,
}: {
  storedWeeks: Week[];
  currentWeekStart: string;
  selectedWeekStart: string;
}) {
  const isCurrent = selectedWeekStart === currentWeekStart;
  return (
    <nav aria-label="Select report week" className="flex flex-wrap gap-2">
      <Link
        href="/report"
        className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-neuro-blue focus:ring-offset-2 focus:ring-offset-neuro-dark ${
          isCurrent
            ? "bg-neuro-blue text-neuro-dark"
            : "border border-neuro-border bg-neuro-surface text-neuro-muted hover:bg-neuro-border/50 hover:text-neuro-silver"
        }`}
      >
        This week
      </Link>
      {storedWeeks
        .filter((w) => w.week_start !== currentWeekStart)
        .map((w) => (
          <Link
            key={w.week_start}
            href={`/report?weekStart=${encodeURIComponent(w.week_start)}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-neuro-blue focus:ring-offset-2 focus:ring-offset-neuro-dark ${
              selectedWeekStart === w.week_start
                ? "bg-neuro-blue text-neuro-dark"
                : "border border-neuro-border bg-neuro-surface text-neuro-muted hover:bg-neuro-border/50 hover:text-neuro-silver"
            }`}
          >
            {w.week_start} – {w.week_end}
          </Link>
        ))}
    </nav>
  );
}

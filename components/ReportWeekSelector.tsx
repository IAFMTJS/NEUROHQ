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
    <nav aria-label="Select report week" className="mb-4 flex flex-wrap gap-2">
      <Link
        href="/report"
        className={`rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-blue ${
          isCurrent ? "bg-neuro-blue text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
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
            className={`rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-neuro-blue ${
              selectedWeekStart === w.week_start ? "bg-neuro-blue text-white" : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
            }`}
          >
            {w.week_start} – {w.week_end}
          </Link>
        ))}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { profileInsightsHref } from "@/lib/profile-routes";

type Week = { week_start: string; week_end: string };

export function ReportWeekSelector({
  storedWeeks,
  currentWeekStart,
  selectedWeekStart,
  activeTab,
  buildWeekHref,
}: {
  storedWeeks: Week[];
  currentWeekStart: string;
  selectedWeekStart: string;
  activeTab?: string;
  /** Override link targets (e.g. profile settings insights embed). */
  buildWeekHref?: (weekStart: string | null) => string;
}) {
  const hrefForWeek = (weekStart: string | null) => {
    if (buildWeekHref) return buildWeekHref(weekStart);
    return profileInsightsHref(activeTab ?? "overview", weekStart ?? undefined);
  };

  const isCurrent = selectedWeekStart === currentWeekStart;
  return (
    <nav aria-label="Select report week" className="flex flex-wrap gap-2">
      <Link
        href={hrefForWeek(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
          isCurrent
            ? "bg-[var(--accent-focus)] text-[var(--bg-primary)]"
            : "border border-[var(--card-border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--card-border)]/50 hover:text-[var(--text-primary)]"
        }`}
      >
        This week
      </Link>
      {storedWeeks
        .filter((w) => w.week_start !== currentWeekStart)
        .map((w) => (
          <Link
            key={w.week_start}
            href={hrefForWeek(w.week_start)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
              selectedWeekStart === w.week_start
                ? "bg-[var(--accent-focus)] text-[var(--bg-primary)]"
                : "border border-[var(--card-border)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--card-border)]/50 hover:text-[var(--text-primary)]"
            }`}
          >
            {w.week_start} – {w.week_end}
          </Link>
        ))}
    </nav>
  );
}

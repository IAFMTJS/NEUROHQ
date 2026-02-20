"use client";

import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", desc: "Energy, brain status, vandaag" },
  { href: "/tasks", label: "Missions", desc: "Taken en agenda" },
  { href: "/budget", label: "Budget", desc: "Uitgaven en doelen" },
  { href: "/learning", label: "Growth", desc: "Learning-doel en sessies" },
  { href: "/strategy", label: "Strategy", desc: "Kwartaal en check-in" },
  { href: "/report", label: "Insights", desc: "Weekrapport" },
];

export function SettingsQuickLinks() {
  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Snelkoppelingen</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Ga direct naar een onderdeel.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10"
          >
            <span className="block">{l.label}</span>
            <span className="mt-0.5 block text-[10px] font-normal text-[var(--text-muted)]">{l.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

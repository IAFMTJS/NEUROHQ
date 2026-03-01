"use client";

import Link from "next/link";

const ITEMS = [
  { where: "Growth", what: "Wekelijkse learning-doel (minuten)", href: "/learning" },
  { where: "Budget", what: "Maandbudget, spaardoelen, impulsen", href: "/budget" },
  { where: "Strategy", what: "Kwartaalstrategie, key results, check-in", href: "/strategy" },
  { where: "Tijd & notificaties (hieronder)", what: "Tijdzone, push (quote), stille uren", href: "/settings#tijd-notificaties" },
  { where: "Dashboard", what: "Brain status (energy, focus, mentale belasting) voor energy budget", href: "/dashboard" },
  { where: "XP-pagina", what: "Extra missies toevoegen (vandaag of andere dag)", href: "/xp" },
];

export function SettingsWhereToConfigure() {
  return (
    <details className="card-simple overflow-hidden p-0">
      <summary className="cursor-pointer list-none px-4 py-3 text-base font-semibold text-[var(--text-primary)]">
        Waar stel ik wat in?
      </summary>
      <p className="border-t border-[var(--card-border)] px-4 py-2 text-xs text-[var(--text-muted)]">
        Overzicht waar je de belangrijkste opties vindt.
      </p>
      <ul className="border-t border-[var(--card-border)] divide-y divide-[var(--card-border)] px-4 py-2">
        {ITEMS.map((item) => (
          <li key={item.where} className="py-2">
            <Link href={item.href} className="text-sm font-medium text-[var(--accent-focus)] hover:underline">
              {item.where}
            </Link>
            <span className="text-sm text-[var(--text-muted)]"> — {item.what}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

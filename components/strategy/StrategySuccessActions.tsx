"use client";

import Link from "next/link";

const ACTIONS = [
  { label: "Vink key results af", href: "/strategy", note: "Bovenstaande checklist — houd voortgang bij." },
  { label: "Doe je strategy check-in", href: "/strategy", note: "Elke 2 weken: staat je uitvoering nog in lijn?" },
  { label: "Koppel taken aan doelen", href: "/tasks", note: "Plan taken en kies prioriteit; houd focus op wat er toe doet." },
  { label: "Bekijk Reality report", href: "/report", note: "Weekcijfers: taken, learning, budget — afgezet tegen je strategy." },
];

export function StrategySuccessActions() {
  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Van strategy naar succes</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Kernstappen: voortgang bijhouden, check-in doen, uitvoering koppelen, cijfers bekijken.
        </p>
      </div>
      <ul className="divide-y divide-[var(--card-border)] p-2">
        {ACTIONS.map((a, idx) => (
          <li key={idx} className="px-2 py-2.5">
            <Link href={a.href} className="block text-sm font-medium text-[var(--accent-focus)] hover:underline">
              {a.label}
            </Link>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">{a.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

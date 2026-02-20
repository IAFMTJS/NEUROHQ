"use client";

import type { Insight } from "@/lib/dcic/finance-engine";

const STATIC_TIPS = [
  "Betaal jezelf eerst: zet direct na loon een vast bedrag op je spaarrekening.",
  "Koop geen boodschappen met honger: je geeft dan meer uit.",
  "Vergelijk abonnementen elk halfjaar: vaak kun je korting krijgen of overstappen.",
  "Maak boodschappenlijstjes en houd je eraan om impulsaankopen te vermijden.",
  "Zet notificaties aan voor je bank: zo zie je direct wat je uitgeeft.",
  "Gebruik de 24-uurs regel: wacht een dag bij grotere aankopen.",
  "Bekijk je vaste lasten: vaak zijn er goedkopere energie- of verzekeringsaanbieders.",
  "Maak onderscheid tussen 'nodig' en 'leuk': beperk 'leuk' tot een vast budget.",
];

type Props = {
  insights?: Insight[];
};

export function SavingsTipsCard({ insights = [] }: Props) {
  const suggestionInsights = insights.filter((i) => i.type === "suggestion" || i.type === "warning");
  const tips = [...suggestionInsights.map((i) => i.message), ...STATIC_TIPS].slice(0, 8);

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Bespaartips & inzichten</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Persoonlijke inzichten en algemene tips om slimmer te besteden.
        </p>
      </div>
      <div className="p-4">
        <ul className="space-y-3">
          {tips.map((tip, idx) => (
            <li
              key={idx}
              className="flex gap-3 text-sm text-[var(--text-primary)]"
            >
              <span className="text-[var(--accent-focus)] shrink-0" aria-hidden>•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

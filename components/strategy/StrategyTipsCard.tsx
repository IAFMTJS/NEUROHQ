"use client";

const STRATEGY_TIPS = [
  "Kies één woord voor het kwartaal: het maakt beslissen makkelijker.",
  "Identity statement: schrijf alsof je het al bent ('I am someone who…').",
  "2–4 key results zijn genoeg; meer wordt vaag. Maak ze afvinkbaar.",
  "Anti-goals: benoem wat je níet doet (bijv. geen nieuwe side projects).",
  "Koppel een spaardoel zodat je voortgang in het Reality Report zichtbaar is.",
  "North star: één uitkomst die dit kwartaal een succes maakt.",
  "Kopieer van vorig kwartaal en pas aan — geen lege bladzijde.",
  "Review wekelijks: staat wat je doet nog in lijn met je strategy?",
];

export function StrategyTipsCard() {
  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Strategy tips</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Korte tips om een scherpe kwartaalstrategie te schrijven.
        </p>
      </div>
      <div className="p-4">
        <ul className="space-y-3">
          {STRATEGY_TIPS.map((tip, idx) => (
            <li key={idx} className="flex gap-3 text-sm text-[var(--text-primary)]">
              <span className="text-[var(--accent-focus)] shrink-0" aria-hidden>
                •
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

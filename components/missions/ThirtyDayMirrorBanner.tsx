"use client";

import type { ThirtyDayMirror } from "@/app/actions/thirty-day-mirror";

type Props = {
  mirror: ThirtyDayMirror | null;
};

export function ThirtyDayMirrorBanner({ mirror }: Props) {
  if (!mirror) return null;

  const { fitnessDone, fitnessTotal, focusRate, adminAvoidRate } = mirror;
  const lines: string[] = [];

  // Fitness: spiegel gedrag t.o.v. wat je belangrijk noemt.
  if (fitnessTotal >= 1) {
    const fitnessRate = fitnessDone / Math.max(1, fitnessTotal);
    const pct = Math.round(fitnessRate * 100);

    if (fitnessRate >= 0.7) {
      lines.push(
        `Je zegt dat fitness belangrijk is — en je gedrag bevestigt dat. Je voltooide ${fitnessDone}/${fitnessTotal} health missies in de voorbije 30 dagen (${pct}%).`
      );
    } else if (fitnessRate >= 0.3) {
      lines.push(
        `Je zegt dat fitness belangrijk is, maar je gedrag is wisselend. Je voltooide ${fitnessDone}/${fitnessTotal} health missies in de voorbije 30 dagen (${pct}%).`
      );
    } else {
      lines.push(
        `Je zegt dat fitness belangrijk is, maar in de praktijk gebeurt er bijna niets. Je voltooide slechts ${fitnessDone}/${fitnessTotal} health missies in de voorbije 30 dagen (${pct}%).`
      );
    }
  }

  // Discipline / focus-missies
  if (focusRate != null && !Number.isNaN(focusRate) && focusRate > 0) {
    const pct = Math.round(focusRate * 100);
    lines.push(`Je voltooit ongeveer ${pct}% van je discipline/focus missies.`);
  }

  // Administratie-avoidance
  if (adminAvoidRate != null && !Number.isNaN(adminAvoidRate) && adminAvoidRate >= 0.4) {
    lines.push(
      `Je vermijdt administratie ongeveer ${Math.round(adminAvoidRate * 100)}% van de tijd wanneer ze op je lijst staat.`
    );
  }

  if (lines.length === 0) return null;

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-surface)]/60 p-4 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Data-spiegel (laatste 30 dagen)
      </h3>
      <ul className="mt-2 space-y-1.5 text-[var(--text-primary)]">
        {lines.map((line, idx) => (
          <li key={idx}>{line}</li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">
        Dit is geen oordeel over jou als persoon — alleen over je gedragspatroon. Vraag je af: wil je dat deze cijfers zo
        blijven, of wil je dat je gedrag eerlijker wordt tegenover wat je belangrijk noemt?
      </p>
    </section>
  );
}


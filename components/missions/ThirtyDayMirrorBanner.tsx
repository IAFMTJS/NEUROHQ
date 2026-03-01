"use client";

import type { ThirtyDayMirror } from "@/app/actions/thirty-day-mirror";

type Props = {
  mirror: ThirtyDayMirror | null;
};

export function ThirtyDayMirrorBanner({ mirror }: Props) {
  if (!mirror) return null;

  const { fitnessDone, fitnessTotal, focusRate, adminAvoidRate } = mirror;
  const lines: string[] = [];

  if (fitnessTotal >= 4) {
    lines.push(
      `Je zegt dat fitness belangrijk is, maar je deed ${fitnessDone}/${fitnessTotal} health/focus missies in de voorbije 30 dagen.`
    );
  }

  if (focusRate != null && !Number.isNaN(focusRate) && focusRate > 0) {
    lines.push(`Je voltooit ongeveer ${Math.round(focusRate * 100)}% van je discipline/focus missies.`);
  }

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
        Dit is geen oordeel over jou als persoon — alleen over je gedragspatroon. Vraag je af: wil ik deze cijfers zo
        laten, of wil ik dat mijn gedrag eerlijker wordt tegenover wat ik belangrijk noem?
      </p>
    </section>
  );
}


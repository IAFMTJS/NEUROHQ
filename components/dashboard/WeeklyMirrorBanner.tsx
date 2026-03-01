"use client";

import type { ConfrontationSummary } from "@/app/actions/confrontation-summary";

type Props = {
  summary: ConfrontationSummary | null;
};

function tagLabel(tag: "household" | "administration" | "social"): string {
  if (tag === "household") return "huishouden";
  if (tag === "administration") return "administratie";
  return "sociaal";
}

export function WeeklyMirrorBanner({ summary }: Props) {
  if (!summary || !summary.topAvoided || summary.topAvoided.skipped < 3) return null;

  const { topAvoided, topCompleted } = summary;
  const now = new Date();
  const isSunday = now.getDay() === 0; // JS: 0 = Sunday

  if (!isSunday && topAvoided.skipped < 5) return null;

  return (
    <section className="mt-3 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Weekly mirror · gedrag, niet persoon
      </p>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Je vermijdt nu vooral{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {tagLabel(topAvoided.tag)} ({topAvoided.skipped}×)
        </span>
        {topCompleted && topCompleted.completed > 0 && (
          <>
            {" "}en je voltooit het vaakst{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {tagLabel(topCompleted.tag)} ({topCompleted.completed}×)
            </span>
            .
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Dit zegt niets over wie je bent — alleen over je huidige patroon. Kies vandaag één kleine actie in de
        vermeden categorie en maak dat je minimale integriteitsmoment voor deze week.
      </p>
    </section>
  );
}


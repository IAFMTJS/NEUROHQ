"use client";

import Link from "next/link";

/**
 * Explains the integrated loop: protocol (library) → missions → streams/sessions → engine XP.
 */
export function GrowthSystemLoop() {
  const steps = [
    {
      n: "1",
      title: "Protocol",
      body: "Kies een traject in de bibliotheek, zet je tier en week. Dat is je vaste inhoud (PHASES → WEEKS → sessies).",
    },
    {
      n: "2",
      title: "Missions",
      body: "Zet de actieve week naar je Missions-bord. Daar vink je af wat je echt doet — gekoppeld aan XP en discipline.",
    },
    {
      n: "3",
      title: "Streams",
      body: "25-min sessies op je skills/boek houden het ritme; consistency voedt het dashboard.",
    },
    {
      n: "4",
      title: "Engine",
      body: "Brain check-in + adaptive tier horen bij dezelfde week: lichte load = lagere protocol-tier, zwaarder = zwaardere volumes.",
    },
  ];

  return (
    <section
      id="growth-system"
      className="scroll-mt-28 rounded-xl border border-[var(--semantic-accent)]/35 bg-gradient-to-br from-[var(--semantic-accent)]/10 via-[var(--bg-elevated)]/50 to-transparent p-4 shadow-[0_0_32px_rgba(0,212,255,0.08)]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">Growth-systeem</p>
      <h2 className="mt-1 text-base font-bold text-[var(--text-primary)]">Hoe het samenwerkt</h2>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        Geen losse kaarten: protocol is de inhoud, missions de uitvoering, streams het ritme, de engine je belasting.
      </p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex gap-3 rounded-lg border border-[var(--card-border)]/80 bg-[var(--bg-primary)]/50 px-3 py-2.5"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--semantic-accent)]/20 text-sm font-bold text-[var(--semantic-accent)]"
              aria-hidden
            >
              {s.n}
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{s.title}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)]">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="#growth-protocols"
          className="inline-flex items-center rounded-lg bg-[var(--semantic-accent)]/20 px-3 py-2 text-xs font-semibold text-[var(--semantic-accent)] ring-1 ring-[var(--semantic-ring)]/40 hover:bg-[var(--semantic-accent)]/30"
        >
          Naar protocollen
        </a>
        <Link
          href="/tasks"
          className="inline-flex items-center rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--semantic-accent)]/50 hover:text-[var(--semantic-accent)]"
        >
          Open Missions
        </Link>
        <Link
          href="/strategy"
          className="inline-flex items-center rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--semantic-accent)]/50 hover:text-[var(--semantic-accent)]"
        >
          Strategy
        </Link>
      </div>
    </section>
  );
}

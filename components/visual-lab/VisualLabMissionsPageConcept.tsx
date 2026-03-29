"use client";

import { useState } from "react";

const TABS = [
  { id: "missions" as const, label: "Missies" },
  { id: "calendar" as const, label: "Kalender" },
  { id: "routine" as const, label: "Routine" },
];

const SECONDARY_MISSIONS = [
  {
    title: "Inbox: max. 20 items verwerken",
    meta: "Werk · ca. 25 min",
    hint: "Geen diepe focus",
  },
  {
    title: "Ochtendlicht protocol (10 min)",
    meta: "Gezondheid · routine",
    hint: "Lage belasting",
  },
  {
    title: "Wekelijkse review notities",
    meta: "Strategie · backlog",
    hint: "Planning",
  },
] as const;

/**
 * Alternatieve shell voor /tasks (missies): strategy-achtige kaart, zachte tab-rail,
 * pulse-strip + heldere hero-missie — mock, alleen visual lab.
 */
export function VisualLabMissionsPageConcept() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("missions");

  return (
    <section
      className="relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="missions-style-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="missions-style-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Missies · paginastyling (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Nieuw voorstel i.p.v. huidige{" "}
            <code className="rounded bg-black/30 px-1 text-[10px]">SciFiPanel</code> + hoeknodes: één grote command-kaart, pill-tabs,
            pulse-regel (open / vandaag / modus), hero-missie en compacte stapellijst. Geen live data; tabs zijn mock.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-[1] space-y-4 p-4 md:p-5">
          {/* Top bar */}
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Command</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-xl">
                Missions
              </h3>
              <p className="mt-1 max-w-xl text-[11px] leading-snug text-[var(--text-secondary)] md:text-xs">
                Focus mode · vandaag · performance engine — één duidelijke hoofdactie, rest gestapeld.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              ← HQ
            </button>
          </header>

          {/* Tabs — pill rail */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(0,0,0,0.28)] p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.35)]">
              {TABS.map((t) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-pressed={on}
                    className={[
                      "rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition",
                      on
                        ? "bg-[rgba(var(--mode-rgb),0.22)] text-[var(--semantic-accent)] shadow-[0_0_16px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
                    ].join(" ")}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">Weergave</span>
          </div>

          {tab === "missions" ? (
            <>
              {/* Pulse strip */}
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.4)] px-3 py-2.5">
                {[
                  { k: "Open", v: "3" },
                  { k: "Vandaag", v: "2 resterend" },
                  { k: "Modus", v: "Focus" },
                ].map((s, i) => (
                  <div key={s.k} className="flex items-center gap-2">
                    {i > 0 ? <span className="text-[var(--text-muted)]/40" aria-hidden>|</span> : null}
                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{s.k}</span>
                    <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{s.v}</span>
                  </div>
                ))}
                <span className="ml-auto hidden text-[9px] text-[var(--text-muted)] sm:inline">Energy budget mock · 62%</span>
              </div>

              {/* Energy bar mock */}
              <div>
                <div className="mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <span>Dag-budget (visueel)</span>
                  <span className="tabular-nums text-[var(--text-secondary)]">62%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] via-[var(--semantic-accent)] to-emerald-400/90 shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)]"
                    style={{ width: "62%" }}
                  />
                </div>
              </div>

              {/* Hero mission */}
              <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--semantic-accent),0.28)] bg-[rgba(4,12,22,0.55)] shadow-[0_0_24px_rgba(var(--mode-rgb),0.1)]">
                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--semantic-accent)] to-emerald-500/70" aria-hidden />
                <div className="p-4 pl-5 md:p-5 md:pl-6">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Hoofdmissie</p>
                  <h4 className="mt-2 text-base font-bold leading-snug text-[var(--text-primary)] md:text-lg">
                    Strategische deep-work: kwartaalplan afronden
                  </h4>
                  <p className="mt-2 max-w-prose text-[11px] leading-relaxed text-[var(--text-secondary)] md:text-xs">
                    Aanbevolen door engine · ~90 min · hoge impact — tik voor details en subtasks (concept).
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="cursor-default rounded-lg bg-[var(--semantic-accent)]/15 px-3 py-2 text-[11px] font-semibold text-[var(--semantic-accent)]">
                      Start
                    </span>
                    <span className="cursor-default rounded-lg border border-[rgba(var(--mode-rgb),0.18)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)]">
                      Uitstellen
                    </span>
                  </div>
                </div>
              </article>

              {/* Stack */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Daarna / parallel</p>
                <ul className="space-y-2">
                  {SECONDARY_MISSIONS.map((m) => (
                    <li key={m.title}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-3 text-left transition hover:border-[rgba(var(--mode-rgb),0.2)] hover:bg-[rgba(var(--mode-rgb),0.06)]"
                      >
                        <span
                          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--semantic-accent)]/70 shadow-[0_0_8px_rgba(var(--mode-rgb),0.35)]"
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{m.title}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{m.meta}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]/80">{m.hint}</p>
                        </div>
                        <span className="shrink-0 text-[var(--text-muted)]" aria-hidden>
                          ›
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="rounded-xl border border-dashed border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(0,0,0,0.15)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              {tab === "calendar" ? "Kalender-view zou hier dezelfde kaart-chrome gebruiken (mock)." : "Routine-view idem (mock)."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

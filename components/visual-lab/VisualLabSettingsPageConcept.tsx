"use client";

import type { ReactNode } from "react";

const NAV = [
  { id: "user", label: "Gebruiker", hint: "Account" },
  { id: "missions", label: "Missies", hint: "Automatisering" },
  { id: "system", label: "Systeem", hint: "Thema, budget, DCIC" },
  { id: "device", label: "Toestel", hint: "Push, agenda, export" },
] as const;

function MockToggle({ on, label }: { on: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
      <span className="text-xs font-medium text-[var(--text-primary)]">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500/55" : "bg-[var(--card-border)]"}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "left-5" : "left-0.5"}`}
        />
      </span>
    </div>
  );
}

function SectionCard({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.12)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.14)] via-[var(--bg-elevated)]/10 to-[var(--bg-primary)]/24 shadow-[0_8px_32px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <header className="border-b border-[rgba(var(--mode-rgb),0.1)] px-4 py-3 md:px-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>
      </header>
      <div className="space-y-4 p-4 md:p-5">{children}</div>
    </section>
  );
}

/**
 * Concept voor /settings: zij-navigatie, vlakke secties i.p.v. alleen &lt;details&gt;,
 * zoekbalk, en scanbare rijen — mock data, alleen visual lab.
 */
export function VisualLabSettingsPageConcept() {
  return (
    <section className="relative mb-10 space-y-5 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6" aria-labelledby="settings-concept-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="settings-concept-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Instellingen · paginaconcept
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock · geen live data</span>
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
        Huidige pagina: lange lijst met <code className="rounded bg-black/30 px-1 text-[10px]">SettingsCategory</code> als{" "}
        <code className="rounded bg-black/30 px-1 text-[10px]">&lt;details&gt;</code> + mascot boven. Hier:{" "}
        <strong className="font-medium text-[var(--text-primary)]">sticky sectienav</strong>,{" "}
        <strong className="font-medium text-[var(--text-primary)]">zoekveld</strong>, vaste kaarten, minder open/dicht — alles in één scanbare
        kolom naast een inhoudsopgave (desktop).
      </p>

      {/* Page chrome mock */}
      <header className="overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[var(--bg-elevated)]/20 px-4 py-4 md:px-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">HQ</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)]">Instellingen</h3>
            <p className="mt-1 max-w-xl text-xs text-[var(--text-secondary)]">
              Site en apparaat — engine en persona blijven op Profiel (zoals nu).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="cursor-default rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Cache legen
            </span>
            <span className="cursor-default rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.5)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Data export
            </span>
          </div>
        </div>
        <div className="relative mt-4">
          <input
            type="search"
            readOnly
            placeholder="Zoek in instellingen (concept)…"
            className="w-full rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(0,0,0,0.35)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(var(--mode-rgb),0.35)]"
            aria-label="Zoeken placeholder"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">⌕</span>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)] lg:gap-8">
        <nav
          className="mb-6 flex flex-wrap gap-2 lg:sticky lg:top-24 lg:mb-0 lg:flex-col lg:self-start lg:gap-1"
          aria-label="Secties (concept)"
        >
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#settings-concept-${item.id}`}
              className="rounded-lg border border-transparent px-3 py-2 text-left text-xs transition-colors hover:border-[rgba(var(--mode-rgb),0.2)] hover:bg-[rgba(var(--mode-rgb-deep),0.12)]"
            >
              <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
              <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">{item.hint}</span>
            </a>
          ))}
        </nav>

        <div className="min-w-0 space-y-5">
          <SectionCard id="settings-concept-user" title="Gebruiker" subtitle="Account · wat je nu als eerste details ziet">
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-black/25 p-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">commander@neurohq.app</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Persona & engine:{" "}
                <span className="text-[var(--accent-focus)]">Profiel → Engine</span> (link mock).
              </p>
              <span className="mt-3 inline-flex cursor-default rounded-lg border border-[var(--semantic-accent)]/35 bg-[var(--semantic-accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--semantic-accent)]">
                Open profiel
              </span>
            </div>
          </SectionCard>

          <SectionCard id="settings-concept-missions" title="Missies" subtitle="Automatische suggesties op je dag">
            <MockToggle on label="Auto master-missies (ochtend)" />
            <p className="text-xs text-[var(--text-muted)]">
              Dit blok bundelt wat nu onder “Missies” staat; gedrag/weekthema blijft cross-link naar Profiel.
            </p>
          </SectionCard>

          <SectionCard id="settings-concept-system" title="Systeem" subtitle="Thema, budget, DCIC, lokale tools">
            <div className="flex flex-wrap gap-2">
              {["Neuro", "Amber", "Emerald"].map((t) => (
                <span
                  key={t}
                  className={`cursor-default rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                    t === "Neuro"
                      ? "border-[rgba(var(--mode-rgb),0.45)] bg-[rgba(var(--mode-rgb-deep),0.35)] text-[var(--text-primary)]"
                      : "border-[var(--card-border)] bg-transparent text-[var(--text-muted)]"
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">XP</span> · Level <span className="tabular-nums">12</span> ·{" "}
              <span className="tabular-nums">8.420</span> totaal <span className="text-[var(--text-muted)]">(mock)</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Valuta</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">EUR</p>
              </div>
              <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Periode</p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">Maand</p>
              </div>
              <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Impuls-drempel</p>
                <p className="mt-1 text-sm font-medium tabular-nums text-[var(--text-primary)]">18%</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-[var(--text-muted)]">
              <span className="rounded border border-[var(--card-border)] px-2 py-1">DCIC-uitleg</span>
              <span className="rounded border border-[var(--card-border)] px-2 py-1">Modus test</span>
              <span className="rounded border border-[var(--card-border)] px-2 py-1">Snapshot refresh</span>
            </div>
          </SectionCard>

          <SectionCard id="settings-concept-device" title="Toestel" subtitle="Tijdzone, push, agenda’s, export, onboarding">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Tijdzone</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">Europe/Amsterdam</p>
              </div>
              <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Push</p>
                <p className="mt-1 text-sm text-[var(--text-primary)]">Ochtend · avond · quote</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Stille uren 22:00–07:00 (mock)</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg border border-[var(--card-border)] bg-[rgba(6,18,30,0.4)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)]">
                Apple Agenda
              </span>
              <span className="rounded-lg border border-[var(--card-border)] bg-[rgba(6,18,30,0.4)] px-3 py-2 text-[10px] font-semibold text-[var(--text-secondary)]">
                Google Calendar · gekoppeld
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              Help-onboarding en “waar stel ik X in?” als één onderste rij i.p.v. diep weggestopt — verlaagt support-frictie.
            </p>
            <p className="text-[10px] text-[var(--text-muted)]">
              NeuroHQ <span className="tabular-nums">v1.0.0</span> <span className="text-[var(--text-muted)]/70">(mock)</span>
            </p>
          </SectionCard>
        </div>
      </div>
    </section>
  );
}

"use client";

import { CommanderMascotPedestal } from "@/components/commander/CommanderMascotPedestal";
import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { getDashboardMascotSrc } from "@/lib/mascots";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";

const E = 68;
const F = 54;
const L = 43;

const PEDESTAL = {
  totalXP: 45_200,
  displayLevel: 12,
  budgetRemainingCents: 42_050,
  currency: "EUR",
  energyPct: E,
  focusPct: F,
  loadPct: L,
  energy1to10: 7,
  focus1to10: 5,
  load1to10: 4,
} as const;

/**
 * Strikt één viewport voor de deck-inhoud: geen overflow/scroll binnen het command deck.
 * `visual-lab-dash-noscroll` in globals.css comprimeert het pedestal zonder productie aan te raken.
 */
export function VisualLabDashboardOneScreenConcept() {
  return (
    <section
      className="relative mb-10 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-dash-one-screen-heading"
    >
      <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-2">
        <h2
          id="vl-dash-one-screen-heading"
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
        >
          Dashboard — één scherm, geen scroll in deck
        </h2>
        <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <VisualLabCommandDeck
        className="!overflow-visible"
        contentClassName="min-h-0 overflow-visible p-2 pb-6 md:p-3 md:pb-7"
      >
        <div className="visual-lab-dash-noscroll dashboard-command-bridge relative mx-auto flex h-[min(36rem,calc(90svh-9rem))] w-full max-w-[22rem] flex-col gap-1 md:max-w-[26rem] md:gap-1.5">
          {/* Kop: zelfde taal als bridge, één compacte band */}
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.12)] pb-1.5 pt-0.5">
            <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">
                Operator
              </p>
              <h3 className="text-[13px] font-bold leading-tight tracking-tight text-[var(--text-primary)] md:text-sm">
                Dashboard
              </h3>
              <p className="text-[8px] text-[var(--text-muted)]">System overview</p>
            </div>
            <div className="shrink-0 text-right text-[8px] leading-tight text-[var(--text-muted)]">
              <p className="font-medium text-[var(--text-secondary)]">Zo 5 apr</p>
              <div className="mt-1 flex justify-end gap-1">
                <span className="inline-flex items-center gap-1 rounded border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(6,18,30,0.45)] px-1.5 py-0.5 font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" aria-hidden />
                  Live
                </span>
                <span className="rounded border border-[rgba(var(--mode-rgb),0.18)] px-1.5 py-0.5 font-semibold text-[var(--text-primary)]">
                  Focus
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 space-y-0.5">
            <div className="flex justify-between text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <span>Energy pool</span>
              <span className="tabular-nums normal-case text-[var(--text-secondary)]">62%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(4,10,18,0.6)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.3)] via-[var(--semantic-accent)] to-emerald-400/80"
                style={{ width: "62%" }}
                aria-hidden
              />
            </div>
          </div>

          {/* Pedestal: geen overflow-hidden — boog tekent buiten de mascotte-box */}
          <div className="relative flex min-h-[13rem] flex-1 flex-col justify-end">
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[radial-gradient(ellipse_100%_95%_at_50%_100%,rgba(var(--mode-rgb),0.16),rgba(4,12,22,0.45))] px-1 pb-0.5 pt-1">
              <section
                className="mascot-hero mascot-hero-top relative w-full overflow-visible"
                data-commander-orbit="true"
              >
                <CommanderMascotPedestal stats={{ ...PEDESTAL }}>
                  <div className="mascot-hero-mascot-stack relative mx-auto flex w-full justify-center">
                    <img src={getDashboardMascotSrc()} alt="" className="mascot-img" aria-hidden />
                  </div>
                </CommanderMascotPedestal>
              </section>
            </div>
          </div>

          <section className="stats commander-bridge-stats flex shrink-0 items-end justify-center gap-2 md:gap-4">
            <CommanderStatRing variant="energy" value={E} size={56} />
            <CommanderStatRing variant="focus" value={F} size={56} />
            <CommanderStatRing variant="load" value={L} size={56} />
          </section>

          <p className="shrink-0 truncate px-1 text-center text-[9px] italic leading-tight text-[var(--text-secondary)]">
            &ldquo;Consistentie verslaat intensiteit op lange horizon.&rdquo;
          </p>

          <div className="grid shrink-0 grid-cols-3 divide-x divide-[rgba(var(--mode-rgb),0.08)] overflow-hidden rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(5,16,28,0.45)] text-[8px] leading-tight">
            <div className="border-l-2 border-[rgba(var(--semantic-accent),0.5)] bg-[rgba(var(--semantic-accent),0.05)] px-1.5 py-1.5">
              <p className="font-bold uppercase tracking-wide text-[var(--semantic-accent)]">Nu</p>
              <p className="mt-0.5 line-clamp-2 font-semibold text-[var(--text-primary)]">Deep-work vóór 14:00</p>
            </div>
            <div className="px-1.5 py-1.5 text-center">
              <p className="font-bold uppercase tracking-wide text-[var(--text-muted)]">Taken</p>
              <p className="font-mono text-base font-bold tabular-nums text-[var(--text-primary)]">5</p>
            </div>
            <div className="px-1.5 py-1.5">
              <p className="font-bold uppercase tracking-wide text-violet-300/90">Brain</p>
              <p className="mt-0.5 line-clamp-2 text-[var(--text-secondary)]">Check-in ok</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="commander-cta-glass flex h-9 min-h-9 shrink-0 items-center justify-center rounded-full px-4 text-[10px] font-semibold tracking-[0.08em] text-[var(--text-main)]"
            >
              Missies
            </button>
            <p className="min-w-0 flex-1 truncate text-[8px] leading-snug text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-secondary)]">Tips ·</span> inbox 2 · weektheme execution
            </p>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

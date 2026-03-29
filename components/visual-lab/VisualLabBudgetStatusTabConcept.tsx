"use client";

import { EnergyRing } from "@/components/hud-test/EnergyRing";

/**
 * Mock van de volledige Budget-tab "Status" (`overview` in BudgetTabsShell),
 * herordend als command deck: hero-ring + signaalladder + metrics + cyclusstrook.
 * Alleen visual lab — geen live data.
 */
export function VisualLabBudgetStatusTabConcept() {
  return (
    <div className="space-y-5 border-t border-[rgba(var(--mode-rgb),0.1)] pt-6">
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Status-tab · concept (overzicht)
        </h3>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Op productie staat <strong className="font-medium text-[var(--text-primary)]">Status</strong> voor{" "}
          <code className="rounded bg-black/30 px-1 text-[10px]">overview</code>: pace-toast, sync + command-pill,
          <span className="whitespace-nowrap"> </span>
          <code className="rounded bg-black/30 px-1 text-[10px]">RemainingBudgetHero</code>, vorige periode, quick log.
          Hier één scherm dat dat vertelt als één HUD — zonder echte requests.
        </p>
      </div>

      {/* Tabstrip (decoratief) */}
      <div
        className="flex flex-wrap items-center gap-2 border-b border-[var(--card-border)] pb-2"
        aria-hidden
        role="presentation"
      >
        {(
          [
            ["Status", true],
            ["Execute", false],
            ["Inzicht", false],
            ["Optimalisatie", false],
          ] as const
        ).map(([label, active]) => (
          <span
            key={label}
            className={
              active
                ? "rounded-t-lg border border-b-0 border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                : "px-3 py-2 text-sm font-medium text-[var(--text-muted)]"
            }
          >
            {label}
          </span>
        ))}
        <span className="ml-auto rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-100">
          Live cyclus
        </span>
      </div>

      {/* Inline toast — analoog aan pace / daily control */}
      <div className="rounded-xl border border-[rgba(var(--hud-amber-500-rgb),0.4)] bg-[rgba(45,30,8,0.45)] px-3 py-2.5 text-[11px] leading-snug text-amber-50 shadow-[0_0_20px_rgba(var(--hud-amber-500-rgb),0.12)]">
        <span className="font-semibold text-amber-200">Weekpace</span> — mock: je ligt iets boven het weekgemiddelde;
        discretionary uitstellen tot na het weekend verlaagt risico.
      </div>

      {/* Command card */}
      <section className="relative overflow-hidden rounded-[var(--hq-card-radius,18px)] border border-[rgba(var(--mode-rgb),0.1)] bg-gradient-to-b from-[rgba(var(--mode-rgb-deep),0.24)] via-[var(--bg-elevated)]/14 to-[var(--bg-primary)]/28 px-4 py-5 shadow-[0_12px_48px_rgba(0,0,0,0.38),0_0_28px_rgba(var(--mode-rgb),0.06)] backdrop-blur-xl sm:px-6">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(var(--mode-rgb),0.14),transparent_58%)]"
          aria-hidden
        />

        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.1)] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--mode-text-soft)]">Budget command</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Maandcyclus · resterend t.o.v. spendable</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-medium tabular-nums text-emerald-300/90">● Sync OK</span>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100">
              Stable
            </span>
          </div>
        </div>

        <div className="relative z-[1] mt-5 grid gap-8 lg:grid-cols-[minmax(0,auto)_1fr] lg:items-center lg:gap-10">
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div
                className="absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.16)_0%,transparent_62%)] blur-md"
                aria-hidden
              />
              <div className="relative drop-shadow-[0_16px_44px_rgba(0,0,0,0.5)]">
                <EnergyRing
                  softGlow
                  profileOrbit
                  budgetHub
                  centerTag="Resterend"
                  size={214}
                  progress={58}
                  label="58%"
                  value="€186,42"
                  mode="green"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Signalen</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
                <span className="mt-0.5 text-lg leading-none" aria-hidden>
                  📍
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Nog 5 dagen tot loon</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Volgende storting · 28 mrt (mock)</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
                <span className="mt-0.5 text-lg leading-none" aria-hidden>
                  🛡️
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Veilige dag · €42,10</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Zelfde betekenis als in Strategische stack-budgetcopy</p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-2.5">
                <span className="mt-0.5 text-lg leading-none" aria-hidden>
                  ⚡
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Discipline deze week · +120 XP</p>
                  <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Als motivator naast het geldbedrag</p>
                </div>
              </li>
            </ul>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {[
                ["Spendable", "€450,00"],
                ["Uitgegeven", "€263,58"],
                ["Vorige periode", "€12,20 +"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 px-2.5 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{k}</p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{v}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[var(--text-muted)]">
              Vorige periode (mock): resterend{" "}
              <span className="font-medium text-[var(--text-primary)]">€12,20</span>
            </p>
          </div>
        </div>

        {/* Cyclusstrook — extra orientatie t.o.v. alleen een ring */}
        <div className="relative z-[1] mt-6 border-t border-[rgba(var(--mode-rgb),0.1)] pt-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Cyclus (mock)
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["W1", "W2", "W3", "W4"].map((w, i) => (
              <div
                key={w}
                className={
                  i === 2
                    ? "min-w-[4.5rem] rounded-lg border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.3)] px-3 py-2 text-center shadow-[0_0_16px_rgba(var(--mode-rgb),0.2)]"
                    : "min-w-[4.5rem] rounded-lg border border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(0,0,0,0.2)] px-3 py-2 text-center text-[var(--text-muted)]"
                }
              >
                <span className="text-[10px] font-bold uppercase tracking-wide">{w}</span>
                <span className="mt-0.5 block text-[9px] tabular-nums opacity-80">{i === 2 ? "nu" : "—"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-[1] mt-5 flex flex-wrap gap-2">
          <span className="primary-btn inline-flex cursor-default items-center justify-center px-4 py-2.5 text-sm font-semibold opacity-95">
            Quick log openen
          </span>
          <span className="btn-secondary inline-flex cursor-default items-center justify-center px-4 py-2.5 text-sm font-semibold opacity-95">
            Naar Execute
          </span>
        </div>
      </section>
    </div>
  );
}

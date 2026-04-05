"use client";

import Link from "next/link";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { STRATEGY_TAB_ITEMS } from "@/components/strategy/StrategyTabsShell";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { SegmentedBar } from "@/components/visual-lab/VisualLabBars";
import { VisualLabCommandDeck } from "@/components/visual-lab/VisualLabCommandDeck";
import { tasksDeckTabClass } from "@/components/missions/tasksDeckTabClass";

const THESIS = "Buffer opbouwen en execution discipline verdiepen dit kwartaal.";
const WHY = "Minder impuls, meer herhaalbaar ritme — de engine moet kunnen vertragen zonder momentum te verliezen.";

function statusDot(pct: number, committed: boolean) {
  if (!committed) return "bg-[var(--text-muted)]/50";
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 60) return "bg-amber-400";
  return "bg-red-500/90";
}

const MOCK_DRIVERS = [
  { key: "growth", label: "Growth", sub: "Week 3 protocol · 4/5 voltooid", pct: 78, committed: true },
  { key: "budget", label: "Budget", sub: "Spaardoel Q", pct: 64, committed: true },
  { key: "xp", label: "XP", sub: "Verdiend vs kwartaaldoel", pct: 52, committed: true },
  { key: "discipline", label: "Executie", sub: "Afgerond vs skip / verzet", pct: 71, committed: true },
] as const;

const ALIGN_WEEKS = [58, 62, 55, 70, 68, 64, 72];

/**
 * Eén samenhangend strategy-scherm: kwartaal-engine (zoals Quarter Command Center), thesis + druk,
 * analyse-ring, drivers, alignment-snapshot, allocatie, CTAs — functionele leesvolgorde bovenaan.
 */
export function VisualLabStrategyBalancedConcept() {
  return (
    <section
      className="relative mb-10 scroll-mt-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.18)] p-3 md:p-4"
      aria-labelledby="vl-strategy-balanced-heading"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-3">
        <div>
          <h2
            id="vl-strategy-balanced-heading"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
          >
            Strategy · engine + thesis + acties
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Lees als de echte pagina: eerst score en pijlers, dan thesis en druk, dan visuele analyse en
            week-alignment, onderaan allocatie en harde vervolgstappen. Mock data.
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Mock
        </span>
      </div>

      <VisualLabCommandDeck contentClassName="min-h-0 gap-0 p-3 md:p-4">
        {/* Sectie-nav: compact, statisch */}
        <nav
          className="mb-3 flex flex-wrap gap-1 rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.5)] p-1"
          aria-label="Strategie-secties (zelfde labels als productie)"
        >
          {STRATEGY_TAB_ITEMS.map((t, i) => (
            <span
              key={t.id}
              className={`${tasksDeckTabClass(i === 0)} pointer-events-none cursor-default`}
            >
              {t.shortLabel}
            </span>
          ))}
        </nav>

        {/* 1 — Kwartaal-engine (afgeleid van StrategyQuarterCommandCenter) */}
        <section
          className="mb-4 rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4 shadow-[var(--shadow-card)] sm:p-5"
          aria-label="Strategy score mock"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Strategy score · Q2 2026 (mock)
              </p>
              <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-[var(--text-primary)] sm:text-4xl">
                74<span className="text-base font-semibold text-[var(--text-muted)]">%</span>
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">Blijf tempo houden.</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Strategische druk: <span className="font-semibold text-[var(--text-primary)]">Normaal</span>
              </p>
            </div>
            <div className="shrink-0 rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] px-3 py-2.5 text-xs text-[var(--text-secondary)] sm:max-w-[220px]">
              <p className="font-semibold text-[var(--text-primary)]">Contract</p>
              <p className="mt-1.5 leading-relaxed text-[11px]">
                Vier pijlers à 25%. Zelfde uitleg als live — hier zonder echte links actief.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-medium">
                <span className="text-[var(--semantic-accent)]">Missions</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--semantic-accent)]">Growth</span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--semantic-accent)]">Budget</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {MOCK_DRIVERS.map((d) => (
              <div
                key={d.key}
                className="flex items-center gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-black/5 px-3 py-2 dark:bg-white/[0.03]"
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(d.pct, d.committed)}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{d.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{d.sub}</p>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-[var(--text-primary)]">{d.pct}%</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2 — Thesis + druk | Analyse-ring */}
        <div className="mb-4 grid gap-3 lg:grid-cols-12 lg:gap-4">
          <div className="space-y-3 lg:col-span-5">
            <div className="relative rounded-[20px] border border-[var(--card-border)] bg-[var(--bg-elevated)]/95 p-4 shadow-[var(--shadow-card)]">
              <CornerNode corner="top-left" />
              <CornerNode corner="bottom-right" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Strategic thesis
              </p>
              <p className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)] md:text-base">{THESIS}</p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{WHY}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  Deadline: 47 dagen
                </span>
                <span className="rounded-md border border-[var(--card-border)] bg-[var(--bg-card)] px-2 py-1 text-[11px] text-[var(--text-primary)]">
                  Target: spaar +12% leer
                </span>
              </div>
            </div>
            <div className="rounded-[20px] border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(5,18,32,0.55)] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Strategic pressure
              </p>
              <div className="mt-3 flex items-center gap-4">
                <div
                  className="relative h-24 w-9 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(4,10,18,0.65)]"
                  style={{ boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)" }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-[var(--accent-focus)] to-emerald-400/85"
                    style={{ height: "55%" }}
                    aria-hidden
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--accent-focus)]">Normaal</p>
                  <p className="mt-1 text-[11px] leading-snug text-[var(--text-secondary)]">
                    Zelfde meter-logica als thesis hero; bij risico: amber/rood.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3 lg:col-span-7">
            <div className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.2)] px-4 py-5 md:px-6">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_0%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
                aria-hidden
              />
              <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <StrategyAnalysisSplitRing budgetHealth={64} growthHealth={78} budgetWarn={false} growthWarn={false} />
                <div className="max-w-[220px] space-y-2 text-[10px] leading-relaxed text-[var(--text-secondary)] sm:text-left">
                  <p>
                    <span className="font-semibold text-[var(--text-primary)]">Budget vs growth</span> — productiecomponent.
                  </p>
                  <p>Waarschuwingen kleuren de bogen; hier beide gezond (mock).</p>
                </div>
              </div>
            </div>

            {/* Focus-multipliers (platte weergave) */}
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.45)] px-3 py-3 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Weekly focus · domeinen
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-lg border border-[rgba(var(--semantic-accent),0.35)] bg-[rgba(var(--mode-rgb-deep),0.2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--semantic-accent)]">
                  Primair: Werk ×1.2
                </span>
                <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.18)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                  Leer ×1.0
                </span>
                <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.18)] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                  Recovery ×0.9
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 — Alignment snapshot */}
        <div className="mb-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.45)] p-3 backdrop-blur-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Alignment · laatste weken (mock)
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                Score deze week <span className="tabular-nums text-[var(--semantic-accent)]">72</span>
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(6,18,30,0.55)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              Log alignment
            </button>
          </div>
          <div className="mt-3 flex h-16 items-end gap-1.5">
            {ALIGN_WEEKS.map((h, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-[rgba(var(--mode-rgb),0.2)] to-[var(--semantic-accent)]/45"
                  style={{ height: `${h}%`, minHeight: "28%" }}
                  aria-hidden
                />
                <span className="text-[8px] font-medium text-[var(--text-muted)]">W{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 — Allocatie + CTAs */}
        <div className="space-y-3 border-t border-[rgba(var(--mode-rgb),0.12)] pt-4">
          <SegmentedBar
            label="Weekly allocation"
            caption="Werk · Leer · Recovery"
            fills={[0.44, 0.36, 0.2]}
            segmentLabels={["Werk", "Leer", "Recovery"]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              className="rounded-xl border border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb-deep),0.28)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-focus)]"
            >
              Kwartaal contract
            </button>
            <button
              type="button"
              className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-100/95"
            >
              Weekreview starten
            </button>
            <Link
              href="/strategy"
              className="text-center text-[10px] text-[var(--semantic-accent)] underline-offset-2 hover:underline sm:text-right"
            >
              Naar live Strategy →
            </Link>
          </div>
        </div>
      </VisualLabCommandDeck>
    </section>
  );
}

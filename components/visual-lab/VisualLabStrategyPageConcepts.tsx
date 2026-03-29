"use client";

import { useState, type ReactNode } from "react";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import type { StrategyTabId } from "@/components/strategy/StrategyTabsShell";
import {
  dashboardHubTabButtonClass,
  dashboardHubTabStripClass,
} from "@/components/layout/dashboardHubTabStyles";

const STRATEGY_TABS: { id: StrategyTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "focus", label: "Focus & budget" },
  { id: "alignment", label: "Alignment & momentum" },
  { id: "review", label: "Review & archief" },
];

const MOCK_DOMAINS = [
  { id: "w", label: "Werk", weight: 42, allocation: 38 },
  { id: "h", label: "Gezondheid", weight: 24, allocation: 22 },
  { id: "r", label: "Relaties", weight: 18, allocation: 20 },
  { id: "g", label: "Groei", weight: 16, allocation: 20 },
] as const;

/** Matcht Overview-splitring: één bron voor KPI-regels + tab Focus. */
const OVERVIEW_BUDGET_HEALTH = 62;
const OVERVIEW_GROWTH_HEALTH = 74;

function SplitHealthFirstCard() {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-gradient-to-br from-[rgba(8,26,42,0.94)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.14)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_28px_rgba(var(--mode-rgb),0.08)] md:p-5">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.12),transparent_58%)]"
        aria-hidden
      />
      <div className="relative flex flex-col items-stretch gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex flex-col items-center justify-center gap-2 md:shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]/95">Split health</p>
          <StrategyAnalysisSplitRing
            budgetHealth={OVERVIEW_BUDGET_HEALTH}
            growthHealth={OVERVIEW_GROWTH_HEALTH}
            budgetWarn
            growthWarn={false}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3 text-center md:text-left">
          <p className="text-sm font-semibold leading-snug text-[var(--text-primary)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.15)]">
            Budgetdruk vs. groei-speling — eerste signaal op Overview.
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            <span className="rounded-lg border border-[rgba(var(--hud-amber-500-rgb),0.4)] bg-[rgba(45,30,8,0.35)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--hud-amber-500)]">
              Budget · {OVERVIEW_BUDGET_HEALTH}%
            </span>
            <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.28)] bg-[rgba(var(--mode-rgb-deep),0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]">
              Groei · {OVERVIEW_GROWTH_HEALTH}%
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
            Zelfde component als Strategy → Analyse op productie. Waarschuwing op budgetboog is hier bewust aan (mock).
          </p>
        </div>
      </div>
    </article>
  );
}

function MockStrategyWeekBudgetStrip() {
  const cap = 420;
  const spent = 312;
  const pct = Math.round((spent / cap) * 100);
  const softCapPct = 85;
  return (
    <div className="space-y-3 rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(6,18,30,0.48)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--semantic-accent)]">Strategisch weekbudget</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">Mock · koppeling naar /budget-gedrag: burn vs. plan, geen live data.</p>
        </div>
        <span className="shrink-0 rounded-md border border-[rgba(var(--hud-amber-500-rgb),0.35)] bg-[rgba(45,28,6,0.4)] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[var(--hud-amber-500)]">
          Soft hold
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Besteed</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-[var(--text-primary)]">€{spent}</p>
        </div>
        <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Resterend</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-emerald-300">€{cap - spent}</p>
        </div>
        <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 px-2 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Weekplafond</p>
          <p className="mt-1 text-sm font-bold tabular-nums text-[var(--text-primary)]">€{cap}</p>
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          <span>Week burn</span>
          <span className="tabular-nums text-[var(--text-secondary)]">
            {pct}% · reset over 2 d
          </span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
          <div
            className="pointer-events-none absolute bottom-0 top-0 w-px bg-[rgba(var(--hud-amber-500-rgb),0.85)] shadow-[0_0_8px_rgba(var(--hud-amber-500-rgb),0.5)]"
            style={{ left: `calc(${softCapPct}% - 0.5px)` }}
            title="Soft cap"
            aria-hidden
          />
          <div
            className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] via-[var(--semantic-accent)] to-[var(--hud-amber-500)] shadow-[0_0_14px_rgba(var(--hud-amber-500-rgb),0.25)]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          Amber lijn = soft cap ({softCapPct}%). Boven dit punt verhoogt de engine friction op impuls-spend (concept-copy).
        </p>
      </div>
      <ul className="space-y-2 border-t border-[rgba(var(--mode-rgb),0.1)] pt-3">
        {[
          { label: "Vaste lasten", sub: "Mock", val: "€ 245" },
          { label: "Variabel (eten, rit)", sub: "Op trace", val: "€ 52" },
          { label: "Discretionair / groei", sub: "Side-project risk", val: "€ 15 rest" },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-2 rounded-lg border border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(4,12,22,0.35)] px-2.5 py-2"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--text-primary)]">{row.label}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{row.sub}</p>
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--text-secondary)]">{row.val}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockReviewBanner() {
  return (
    <div className="rounded-xl border border-[rgba(var(--hud-amber-500-rgb),0.45)] bg-gradient-to-r from-[rgba(45,30,8,0.5)] to-[rgba(12,24,42,0.85)] px-3 py-3 shadow-[0_0_24px_rgba(var(--hud-amber-500-rgb),0.12)] md:flex md:items-center md:justify-between md:gap-4 md:px-4">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--hud-amber-500)]">Weekreview open</p>
        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Rond review af om week 13 te vergrendelen</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">Mock · zonder review schuift de engine frictie op planning.</p>
      </div>
      <span className="mt-3 inline-flex cursor-default rounded-lg bg-[var(--semantic-accent)]/18 px-3 py-2 text-[11px] font-semibold text-[var(--semantic-accent)] md:mt-0">
        Naar review
      </span>
    </div>
  );
}

function OverviewPanels() {
  return (
    <div className="space-y-4">
      <SplitHealthFirstCard />

      <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--semantic-accent),0.22)] bg-[rgba(6,18,30,0.5)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--semantic-accent)] to-emerald-500/60" aria-hidden />
        <div className="p-4 pl-5 md:p-5 md:pl-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Actieve thesis</p>
          <h4 className="mt-2 text-base font-bold leading-snug text-[var(--text-primary)] md:text-lg">
            Bouw schuld af · quote-run Q2 · geen impuls-hardware
          </h4>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            <span className="rounded-md border border-[rgba(var(--mode-rgb),0.14)] bg-black/20 px-2 py-1 tabular-nums text-[var(--text-secondary)]">
              Druk: healthy
            </span>
            <span className="rounded-md border border-[rgba(var(--mode-rgb),0.14)] bg-black/20 px-2 py-1 tabular-nums text-[var(--text-secondary)]">
              Deadline · 14 jun
            </span>
            <span className="rounded-md border border-[rgba(var(--mode-rgb),0.14)] bg-black/20 px-2 py-1 tabular-nums text-[var(--text-secondary)]">
              KPI · burn −18%
            </span>
          </div>
        </div>
      </article>

      <section className="relative overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-gradient-to-br from-[rgba(8,26,42,0.92)] via-[var(--bg-elevated)]/88 to-[rgba(var(--mode-rgb-deep),0.12)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] md:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Analyse</p>
        <p className="mt-2 text-sm font-semibold leading-snug text-[var(--text-primary)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.2)] md:text-base">
          Focus wint op herstel — budgetgezondheid zakt licht door side-projects.
        </p>
        <ul className="mt-3 space-y-1.5">
          {[
            "Werkcluster: 3 missies op trace · 1 risico (inbox)",
            "Recovery 2× gepland · engine beveelt korte walk vóór 17:00",
            "Growth: leer-streak actief · geen nieuwe cursus tot quote-run klaar is",
          ].map((line) => (
            <li key={line} className="flex gap-2.5 text-xs text-[var(--text-secondary)] md:text-sm">
              <span
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--semantic-accent)] shadow-[0_0_8px_rgba(var(--mode-rgb),0.45)]"
                aria-hidden
              />
              <span className="min-w-0 leading-snug">{line}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            <span>Missies week</span>
            <span className="tabular-nums text-[var(--text-secondary)]">71%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
            <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.25)] via-[var(--semantic-accent)] to-[#34d399] shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)]" />
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { k: "Alignment", v: "78%", hint: "vs. plan" },
          { k: "Momentum", v: "+12", hint: "4 d rolling" },
          { k: "Drift", v: "4%", hint: "binnen band" },
        ].map((c) => (
          <div
            key={c.k}
            className="rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.4)] px-3 py-3 text-center md:px-4"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{c.k}</p>
            <p className="mt-2 text-lg font-bold tabular-nums text-[var(--text-primary)]">{c.v}</p>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{c.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FocusBudgetPanel() {
  return (
    <div className="space-y-4">
      <MockStrategyWeekBudgetStrip />

      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Tijdsallocatie per domein (mock)</p>
      <div className="flex flex-wrap gap-2">
        {MOCK_DOMAINS.map((d) => (
          <span
            key={d.id}
            className="rounded-full border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(var(--mode-rgb-deep),0.15)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--semantic-accent)]"
          >
            {d.label} ×{d.weight}%
          </span>
        ))}
      </div>
      <ul className="space-y-3">
        {MOCK_DOMAINS.map((d) => (
          <li key={d.id} className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] p-3">
            <div className="mb-1.5 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              <span>{d.label}</span>
              <span className="tabular-nums text-[var(--text-secondary)]">{d.allocation}% doel</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] via-[var(--semantic-accent)] to-emerald-400/85 shadow-[0_0_12px_rgba(var(--mode-rgb),0.28)]"
                style={{ width: `${d.allocation}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-black/25 px-3 py-2.5 text-[11px] leading-relaxed text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Neuro-hint (mock):</span> kortere werkblokken op dinsdag — hoge belasting in profiel.
      </div>
    </div>
  );
}

function AlignmentPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.4)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Gepland vs. gedaan · week 13 (mock)</p>
        <div className="mt-4 flex h-32 items-end justify-between gap-2 px-1">
          {[
            { l: "W", p: 72, a: 64 },
            { l: "G", p: 48, a: 52 },
            { l: "R", p: 22, a: 18 },
            { l: "Gr", p: 18, a: 22 },
          ].map((b) => (
            <div key={b.l} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full max-w-[44px] items-end justify-center gap-0.5 rounded-md bg-black/30 px-1 pb-1 pt-2">
                <div
                  className="w-[42%] rounded-sm bg-[var(--semantic-accent)]/55 shadow-[0_0_10px_rgba(var(--mode-rgb),0.25)]"
                  style={{ height: `${b.p}%` }}
                  title="planned"
                />
                <div
                  className="w-[42%] rounded-sm bg-emerald-400/45"
                  style={{ height: `${b.a}%` }}
                  title="actual"
                />
              </div>
              <span className="text-[9px] font-bold text-[var(--text-muted)]">{b.l}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-[var(--text-muted)]">Cyaan = plan · groen = actual (concept)</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { domain: "Werk", pct: 72, tone: "ok" as const },
          { domain: "Gezondheid", pct: 41, tone: "warn" as const },
          { domain: "Relaties", pct: 55, tone: "ok" as const },
          { domain: "Groei", pct: 38, tone: "warn" as const },
        ].map((m) => (
          <div
            key={m.domain}
            className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-2.5"
          >
            <span className="text-xs font-medium text-[var(--text-primary)]">{m.domain}</span>
            <span
              className={`text-xs font-bold tabular-nums ${
                m.tone === "warn" ? "text-[var(--hud-amber-500)]" : "text-emerald-300"
              }`}
            >
              {m.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewPanel() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.4)] p-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Fase</p>
        <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Uitvoering · week 3 van 8</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
          <div className="h-full w-[40%] rounded-full bg-[var(--semantic-accent)]/85 shadow-[0_0_12px_rgba(var(--mode-rgb),0.3)]" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="cursor-default rounded-lg bg-[var(--semantic-accent)]/15 px-3 py-2 text-[11px] font-semibold text-[var(--semantic-accent)]">
          Start weekreview
        </span>
        <span className="cursor-default rounded-lg border border-[rgba(var(--mode-rgb),0.18)] px-3 py-2 text-[11px] font-medium text-[var(--text-secondary)]">
          Bekijk archief
        </span>
      </div>
      <ul className="space-y-2">
        {[
          { title: "Q1 · schuldafbraak sprint", meta: "Afgerond · jan–mrt" },
          { title: "Winter · energie-reset", meta: "Gearchiveerd" },
        ].map((row) => (
          <li key={row.title}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] px-3 py-3 text-left hover:border-[rgba(var(--mode-rgb),0.2)]"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{row.title}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{row.meta}</p>
              </div>
              <span className="text-[var(--text-muted)]" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Strategy hub — productie-achtige **Growth/Strategy** tab-rail (rounded pills) binnen cinematic panel.
 */
export function VisualLabStrategyHubPageConcept() {
  const [tab, setTab] = useState<StrategyTabId>("overview");

  const panels: Record<StrategyTabId, ReactNode> = {
    overview: <OverviewPanels />,
    focus: <FocusBudgetPanel />,
    alignment: <AlignmentPanel />,
    review: <ReviewPanel />,
  };

  return (
    <section
      className="relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="strategy-hub-visual-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="strategy-hub-visual-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Strategie · hub-tabs (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Tab-strip matcht <code className="rounded bg-black/30 px-1 text-[10px]">dashboardHubTab*</code> zoals op /strategy (volledige hub). Mock inhoud per tab.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div className="dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(var(--mode-rgb),0.14),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-[1] flex flex-col gap-0 p-4 md:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Theater</p>
              <h3 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                Strategy
              </h3>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              ← HQ
            </button>
          </header>

          <div className="mt-3 space-y-3">
            <MockReviewBanner />
          </div>

          <div role="tablist" aria-label="Strategie-secties (concept)" className={`${dashboardHubTabStripClass()} mt-3 rounded-xl`}>
            {STRATEGY_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={dashboardHubTabButtonClass(tab === t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="mt-4 min-h-[120px] space-y-4" aria-labelledby={`strategy-tab-${tab}`}>
            {panels[tab]}
          </div>

          <footer className="mt-6 border-t border-[rgba(var(--mode-rgb),0.1)] pt-4 text-[10px] leading-relaxed text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-secondary)]">Engine-instellingen</span> · onderaan pagina op productie; hier weggelaten voor
            visuele focus op tabs + inhoud.
          </footer>
        </div>
      </div>
    </section>
  );
}

/**
 * Strategy command-scroll — **mini tab-rail** (sticky-stijl) zoals simplified / missions visual lab.
 */
export function VisualLabStrategyCommandScrollPageConcept() {
  const [tab, setTab] = useState<StrategyTabId>("overview");

  const tabBtn = (id: StrategyTabId) =>
    `dashboard-mini-btn ${tab === id ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`;

  const panels: Record<StrategyTabId, ReactNode> = {
    overview: <OverviewPanels />,
    focus: <FocusBudgetPanel />,
    alignment: <AlignmentPanel />,
    review: <ReviewPanel />,
  };

  return (
    <section
      className="relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="strategy-command-visual-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="strategy-command-visual-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Strategie · command-scroll tabs (concept)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Zelfde tab-volgorde als /strategy; chrome matcht <code className="rounded bg-black/30 px-1 text-[10px]">dashboard-mini-btn</code> (tasks /
            budget / simplified hubs). Inhoud gedeeld met hub-concept hierboven.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div className="dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_100%,rgba(var(--mode-rgb-deep),0.12),transparent_50%)]"
          aria-hidden
        />

        <div className="relative z-[1] flex flex-col gap-0 p-4 md:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Command</p>
              <h3 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                Strategy
              </h3>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              Rapport
            </button>
          </header>

          <div className="dashboard-top-strip mt-3">
            <div className="dashboard-top-strip-track" role="tablist" aria-label="Strategie (command scroll)">
              {STRATEGY_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={tabBtn(t.id)}
                >
                  {t.id === "focus" ? "Focus" : t.id === "alignment" ? "Align" : t.id === "review" ? "Review" : "Overview"}
                </button>
              ))}
              <span className="dashboard-mini-strip-label">Tabs</span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <MockReviewBanner />
          </div>

          <div role="tabpanel" className="mt-2 min-h-[120px] space-y-4" aria-labelledby={`strategy-cmd-tab-${tab}`}>
            {panels[tab]}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { TasksTabId } from "@/components/missions/TasksTabsShell";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { profileEngineHref } from "@/lib/profile-routes";

/** Matches `TasksTabsShell` `tabClass` when `fillViewport` + no command deck. */
function legacyTabClass(active: boolean): string {
  return `dashboard-mini-btn ${
    active ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"
  }`;
}

const MOCK_VIEW_MODES = ["focus", "plan", "backlog"] as const;
const MOCK_DONE_TODAY = [
  { title: "Inbox zero (ochtend)", meta: "~12 min" },
  { title: "Sync call notities", meta: "Werk" },
] as const;

const MOCK_CAL_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MOCK_CAL_CELLS = [
  null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  28, 29, 30,
] as const;

const MOCK_ROUTINE_BLOCKS = [
  { t: "06:30", label: "Light + hydration", done: true, current: false },
  { t: "08:00", label: "Deep-work block (plan)", done: false, current: true },
  { t: "12:30", label: "Walk / recovery", done: false, current: false },
] as const;

function SimplifiedMainMissionHero() {
  return (
    <section className="glass-card glass-preserve-decoration relative !rounded-xl !p-0" aria-label="Hoofdmissie (mock)">
      <div
        className="absolute left-0 top-0 z-[1] h-full w-1 bg-gradient-to-b from-[var(--semantic-accent)] to-emerald-500/70"
        aria-hidden
      />
      <div className="relative z-10 space-y-3 p-4 pl-5 sm:p-5 sm:pl-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Main mission</p>
        <h3 className="mt-2 text-base font-bold leading-snug text-[var(--text-primary)] md:text-lg">
          Brain dump (mock)
        </h3>
        <p className="mt-2 max-w-prose text-[11px] leading-relaxed text-[var(--text-secondary)] md:text-xs">
          Aanbevolen door engine Â· Â±5 min Â· hoge impact â€” lab: zelfde oppervlak als simplified{" "}
          <code className="rounded bg-black/30 px-1 text-[10px]">/tasks</code>.
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
    </section>
  );
}

function SimplifiedMockCalendar() {
  const grid = [...MOCK_CAL_CELLS] as ((typeof MOCK_CAL_CELLS)[number] | null)[];
  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        <span>March 2026</span>
        <span className="tabular-nums text-[var(--text-secondary)]">Mock</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {MOCK_CAL_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {grid.map((cell, i) =>
          cell === null ? (
            <div key={`e-${i}`} className="aspect-square rounded-md bg-transparent" />
          ) : (
            <div
              key={cell}
              className={[
                "flex aspect-square items-center justify-center rounded-md border text-[11px] font-semibold tabular-nums",
                cell === 29
                  ? "border-[rgba(var(--semantic-accent),0.45)] bg-[var(--semantic-accent)]/12 text-[var(--semantic-accent)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.12)] ring-1 ring-[rgba(var(--semantic-accent),0.25)]"
                  : "border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] text-[var(--text-secondary)]",
              ].join(" ")}
            >
              {cell}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function SimplifiedMockRoutine() {
  return (
    <div className="space-y-3 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Vaste dagstructuur (mock)</p>
      <ul className="space-y-2">
        {MOCK_ROUTINE_BLOCKS.map((row) => (
          <li
            key={row.t}
            className={[
              "flex items-center gap-3 rounded-xl border px-3 py-2.5",
              row.current
                ? "border-[rgba(var(--semantic-accent),0.35)] bg-[rgba(var(--semantic-accent),0.08)]"
                : "border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)]",
            ].join(" ")}
          >
            <span className="w-12 shrink-0 text-[10px] font-bold tabular-nums text-[var(--text-muted)]">{row.t}</span>
            <span className="min-w-0 flex-1 text-sm font-medium text-[var(--text-primary)]">{row.label}</span>
            <span
              className={[
                "shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                row.done ? "bg-emerald-500/20 text-emerald-300" : "bg-black/25 text-[var(--text-muted)]",
              ].join(" ")}
            >
              {row.done ? "Done" : row.current ? "Now" : "Todo"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Archived reference layout (pre–command-deck unification): legacy top-strip tabs + SciFiPanel per tab.
 */
export function VisualLabMissionsSimplifiedConcept() {
  const [topTab, setTopTab] = useState<TasksTabId>("missions");
  const [mockViewMode, setMockViewMode] = useState<(typeof MOCK_VIEW_MODES)[number]>("focus");
  const [mockDoneOpen, setMockDoneOpen] = useState(false);

  return (
    <section
      className="visual-lab-missions-simplified dashboard-cinematic relative mb-10 space-y-4 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.22)] p-4 md:p-6"
      aria-labelledby="missions-simplified-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="missions-simplified-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Missies Â· simplified (mock)
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Referentie voor de eerdere simplified-layout: <code className="rounded bg-black/30 px-1 text-[10px]">dashboard-top-strip</code>{" "}
            + per tab <code className="rounded bg-black/30 px-1 text-[10px]">SciFiPanel</code> met hoeknodes. Live{" "}
            <code className="rounded bg-black/30 px-1 text-[10px]">/tasks</code> gebruikt nu dezelfde command deck als standaard,
            ook met simplified preference (alleen viewport/scroll verschilt).
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div
        className="flex min-h-[28rem] flex-1 flex-col rounded-lg border border-dashed border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(2,8,16,0.25)] p-2 sm:p-3"
        data-visual-lab="missions-simplified-shell"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="dashboard-top-strip mt-0 shrink-0 px-1 sm:px-2">
            <div className="dashboard-top-strip-track" role="navigation" aria-label="Tasks tabs (simplified mock)">
              <button
                type="button"
                className={legacyTabClass(topTab === "missions")}
                aria-current={topTab === "missions" ? "page" : undefined}
                onClick={() => setTopTab("missions")}
              >
                Missions
              </button>
              <button
                type="button"
                className={legacyTabClass(topTab === "calendar")}
                aria-current={topTab === "calendar" ? "page" : undefined}
                onClick={() => setTopTab("calendar")}
              >
                Calendar
              </button>
              <button
                type="button"
                className={legacyTabClass(topTab === "routine")}
                aria-current={topTab === "routine" ? "page" : undefined}
                onClick={() => setTopTab("routine")}
              >
                Routine
              </button>
              <span className="dashboard-mini-strip-label">View</span>
            </div>
          </div>

          <div className="mt-2 flex min-h-0 flex-1 flex-col gap-0 px-0 sm:px-1">
            {topTab === "missions" ? (
              <SciFiPanel
                variant="flat-glass"
                className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
                bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-3 p-4 sm:p-5 md:p-6"
              >
                <CornerNode corner="top-left" />
                <CornerNode corner="top-right" />
                <div className="flex shrink-0 justify-end">
                  <Link
                    href="/dashboard"
                    className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
                  >
                    HQ
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] pb-1">
                  <div className="w-full space-y-4">
                    <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
                      <div
                        className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start"
                        role="tablist"
                        aria-label="Missieweergave (mock)"
                      >
                        {MOCK_VIEW_MODES.map((m) => (
                          <button
                            key={m}
                            type="button"
                            role="tab"
                            aria-selected={mockViewMode === m}
                            onClick={() => setMockViewMode(m)}
                            className={`vl-deck-pill rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                              mockViewMode === m
                                ? "vl-deck-pill-active border-[rgba(var(--mode-rgb),0.35)] bg-[rgba(var(--mode-rgb),0.12)] text-[var(--accent-focus)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.2)]"
                                : "border-transparent text-[var(--text-muted)] hover:border-[var(--card-border)] hover:bg-[var(--bg-surface)]/60 hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {m === "focus" ? "Vandaag" : m}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        aria-expanded={mockDoneOpen}
                        onClick={() => setMockDoneOpen((o) => !o)}
                        className="vl-deck-chip rounded-full border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/40 px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition hover:border-[var(--card-border)] hover:bg-[var(--bg-surface)]/70 hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                      >
                        Voltooid vandaag ({MOCK_DONE_TODAY.length})
                      </button>
                    </div>

                    {mockDoneOpen ? (
                      <div className="glass-card !rounded-xl !p-3">
                        <ul className="space-y-2">
                          {MOCK_DONE_TODAY.map((d) => (
                            <li
                              key={d.title}
                              className="flex items-start gap-3 rounded-lg border border-[rgba(var(--mode-rgb),0.08)] bg-black/20 px-3 py-2"
                            >
                              <span
                                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-emerald-500/50 bg-emerald-500/20 text-[10px] text-emerald-200"
                                aria-hidden
                              >
                                âœ“
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium leading-snug text-[var(--text-muted)] line-through">{d.title}</p>
                                <p className="text-[10px] text-[var(--text-muted)]/90">{d.meta}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <SimplifiedMainMissionHero />

                    <div className="card-simple flex flex-wrap items-center gap-2 !rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Open</span>
                        <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">1</span>
                      </div>
                      <span className="text-[var(--text-muted)]/40" aria-hidden>
                        |
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Today</span>
                        <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">0 left</span>
                      </div>
                      <span className="text-[var(--text-muted)]/40" aria-hidden>
                        |
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mode</span>
                        <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">Focus</span>
                      </div>
                      <span className="ml-auto hidden text-[9px] tabular-nums text-[var(--text-muted)] sm:inline">Energy budget Â· 62%</span>
                    </div>

                    <div className="space-y-1" aria-label="Energy vandaag (mock)">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
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

                    <button
                      type="button"
                      className="primary-btn min-h-[48px] w-full cursor-default !normal-case !tracking-normal shadow-[0_0_18px_rgba(var(--mode-rgb),0.35)]"
                    >
                      + Missie toevoegen
                    </button>
                  </div>
                </div>
                <p className="shrink-0 pt-1 text-center text-[11px] text-[var(--text-muted)]">
                  <Link href="/tasks?tab=calendar" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                    Calendar, routine &amp; backlog
                  </Link>
                  {" Â· "}
                  <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                    Turn off simplified
                  </Link>
                </p>
                <p className="pb-0.5 text-center text-xs text-[var(--text-muted)]">All systems active</p>
              </SciFiPanel>
            ) : null}

            {topTab === "calendar" ? (
              <SciFiPanel
                variant="flat-glass"
                className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
                bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-0 p-0"
              >
                <CornerNode corner="top-left" />
                <CornerNode corner="top-right" />
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--card-border)]/40 px-4 py-3">
                  <h2 className="hq-h2 min-w-0 flex-1 text-[var(--text-primary)]">Calendar</h2>
                  <Link
                    href="/dashboard"
                    className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
                  >
                    HQ
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
                  <SimplifiedMockCalendar />
                </div>
                <p className="shrink-0 border-t border-[var(--card-border)]/40 px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
                  <Link href="/tasks?tab=missions" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                    Missions
                  </Link>
                  {" Â· "}
                  <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                    Turn off simplified
                  </Link>
                </p>
              </SciFiPanel>
            ) : null}

            {topTab === "routine" ? (
              <SciFiPanel
                variant="flat-glass"
                className="hq-card-enter relative flex min-h-0 w-full flex-1 flex-col overflow-hidden dashboard-active-mission"
                bodyClassName="relative z-10 flex min-h-0 flex-1 flex-col gap-0 p-0"
              >
                <CornerNode corner="top-left" />
                <CornerNode corner="top-right" />
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--card-border)]/40 px-4 py-3">
                  <h2 className="hq-h2 min-w-0 flex-1 text-[var(--text-primary)]">Routines</h2>
                  <Link
                    href="/dashboard"
                    className="shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] underline-offset-2 hover:underline"
                  >
                    HQ
                  </Link>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-3 py-3">
                  <SimplifiedMockRoutine />
                </div>
                <p className="shrink-0 border-t border-[var(--card-border)]/40 px-4 py-2 text-center text-[11px] text-[var(--text-muted)]">
                  <Link href="/tasks?tab=missions" className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                    Missions
                  </Link>
                  {" Â· "}
                  <Link href={profileEngineHref("modes")} className="text-[var(--accent-focus)] underline-offset-2 hover:underline">
                    Turn off simplified
                  </Link>
                </p>
              </SciFiPanel>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

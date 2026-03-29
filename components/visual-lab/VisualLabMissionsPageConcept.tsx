"use client";

import type { TasksTabId } from "@/components/missions/TasksTabsShell";
import { useState } from "react";

const TABS: { id: TasksTabId; label: string }[] = [
  { id: "missions", label: "Missions" },
  { id: "calendar", label: "Calendar" },
  { id: "routine", label: "Routine" },
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

const MOCK_CAL_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MOCK_CAL_CELLS = [
  null, null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
  25, 26, 27, 28, 29, 30,
] as const;

type CalCell = (typeof MOCK_CAL_CELLS)[number];
const MOCK_CAL_GRID: (CalCell | null)[] = [...MOCK_CAL_CELLS];

const MOCK_ROUTINE_BLOCKS = [
  { t: "06:30", label: "Light + hydration", done: true, current: false },
  { t: "08:00", label: "Deep-work block (plan)", done: false, current: true },
  { t: "12:30", label: "Walk / recovery", done: false, current: false },
  { t: "17:00", label: "Inbox sweep", done: false, current: false },
] as const;

function MainMissionHero() {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[rgba(var(--semantic-accent),0.28)] bg-[rgba(4,12,22,0.55)] shadow-[0_0_24px_rgba(var(--mode-rgb),0.1)]">
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[var(--semantic-accent)] to-emerald-500/70" aria-hidden />
      <div className="p-4 pl-5 md:p-5 md:pl-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--semantic-accent)]">Main mission</p>
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
  );
}

function MockCalendarPanel() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        <span>March 2026</span>
        <span className="tabular-nums text-[var(--text-secondary)]">Mock month</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
        {MOCK_CAL_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
        {MOCK_CAL_GRID.map((cell, i) =>
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
      <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
        Zelfde tab-strip als Missions; inhoud = maandraster — <span className="text-[var(--text-secondary)]">29</span> = vandaag (mock).
      </p>
    </div>
  );
}

function MockRoutinePanel() {
  return (
    <div className="space-y-3">
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
 * Alternatieve shell voor /tasks (missies): strategy-achtige kaart, tab-strip zoals TasksTabsShell,
 * hoofdmissie direct onder tabs, daarna pulse + budget + stapel — mock, alleen visual lab.
 */
export function VisualLabMissionsPageConcept() {
  const [tab, setTab] = useState<TasksTabId>("missions");

  const tabBtn = (id: TasksTabId) =>
    `dashboard-mini-btn ${tab === id ? "dashboard-mini-btn-primary" : "dashboard-mini-btn-secondary"}`;

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
            Tab-rail matcht <code className="rounded bg-black/30 px-1 text-[10px]">TasksTabsShell</code>; op Missions staat de hoofdmissie direct onder
            de tabs. Overige blokken en andere tabs zijn mock.
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock</span>
      </div>

      <div
        className="dashboard-cinematic relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.12),transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-[1] flex flex-col gap-0 p-4 md:p-5">
          {/* Top bar — onder de hero op missions mist context; hier compact zodat tab+hero het canvas domineren */}
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Command</p>
              <h3 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
                Tasks overview
              </h3>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              ← HQ
            </button>
          </header>

          {/* Tabs — zelfde track als productie */}
          <div className="dashboard-top-strip mt-3">
            <div className="dashboard-top-strip-track" role="tablist" aria-label="Tasks view">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={tabBtn(t.id)}
                >
                  {t.label}
                </button>
              ))}
              <span className="dashboard-mini-strip-label">View</span>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {tab === "missions" ? (
              <>
                <MainMissionHero />

                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.4)] px-3 py-2.5">
                  {[
                    { k: "Open", v: "3" },
                    { k: "Today", v: "2 left" },
                    { k: "Mode", v: "Focus" },
                  ].map((s, i) => (
                    <div key={s.k} className="flex items-center gap-2">
                      {i > 0 ? <span className="text-[var(--text-muted)]/40" aria-hidden>|</span> : null}
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{s.k}</span>
                      <span className="text-xs font-semibold tabular-nums text-[var(--text-primary)]">{s.v}</span>
                    </div>
                  ))}
                  <span className="ml-auto hidden text-[9px] text-[var(--text-muted)] sm:inline">Energy budget mock · 62%</span>
                </div>

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
            ) : null}

            {tab === "calendar" ? (
              <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] p-4">
                <MockCalendarPanel />
              </div>
            ) : null}

            {tab === "routine" ? (
              <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)] p-4">
                <MockRoutinePanel />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

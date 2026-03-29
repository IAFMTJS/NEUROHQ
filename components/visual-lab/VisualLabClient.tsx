"use client";

import { useState } from "react";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";
import {
  demoToastSnapshotInfoEn,
  demoToastSpendLockBlockedEn,
  demoToastWeeklyBurnWarningEn,
} from "@/lib/ui/budget-guardrail-toasts";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { ZoneBandBar } from "@/components/visual-lab/VisualLabBars";
import { PolygonHudMeter } from "@/components/visual-lab/VisualLabPolygonMeters";
import { VisualLabHexMesh } from "@/components/visual-lab/VisualLabHexMesh";
import { VisualLabShapeEnergyRing } from "@/components/visual-lab/VisualLabShapeEnergyRing";
import { VisualLabMissionsPageConcept } from "@/components/visual-lab/VisualLabMissionsPageConcept";
import {
  VisualLabNotificationsPageConcept,
  VisualLabProfilePageConcept,
} from "@/components/visual-lab/VisualLabUserPageConcepts";
import { VisualLabStrategyPageConcept } from "@/components/visual-lab/VisualLabStrategyPageConcepts";
import {
  VISUAL_LAB_UI_BACKDROP_ORDER,
  VISUAL_LAB_UI_BACKDROP_PRESETS,
  type VisualLabUiBackdropId,
} from "@/components/visual-lab/visualLabUiBackdropPresets";
import { VisualLabPageShell } from "@/components/visual-lab/VisualLabPageShell";
import {
  VISUAL_LAB_PAGE_SHELL_ORDER,
  VISUAL_LAB_PAGE_SHELL_PRESETS,
  type VisualLabPageShellId,
} from "@/components/visual-lab/visualLabPageShellPresets";

/** Shared mock rows for ring kitchen (circle + polygon outlines). */
const RING_KITCHEN_SAMPLES = [
  {
    size: 88,
    progress: 84,
    mode: "green-peak" as const,
    label: "Peak",
    value: "84%",
  },
  {
    size: 104,
    progress: 48,
    mode: "default" as const,
    label: "Budget",
    value: "48%",
  },
  {
    size: 96,
    progress: 24,
    mode: "high-alert" as const,
    label: "Drain",
    value: "24%",
  },
  {
    size: 92,
    progress: 100,
    mode: "locked" as const,
    label: "Lock",
    value: "Hold",
  },
];

const MOCK_STATUS = [
  {
    id: "sync",
    label: "State sync",
    value: "Live",
    tone: "ok" as const,
    pulse: true,
  },
  {
    id: "budget",
    label: "Budget gate",
    value: "Soft hold",
    tone: "warn" as const,
    pulse: false,
  },
  {
    id: "lock",
    label: "Spend lock",
    value: "Blocked",
    tone: "blocked" as const,
    pulse: false,
  },
  {
    id: "learn",
    label: "Learning streak",
    value: "4 / 7 d",
    tone: "neutral" as const,
    pulse: false,
  },
  {
    id: "tasks",
    label: "Today stack",
    value: "6 open",
    tone: "warn" as const,
    pulse: true,
  },
  {
    id: "engine",
    label: "Engine mode",
    value: "Focus",
    tone: "ok" as const,
    pulse: false,
  },
];

const MOCK_SIGNALS = [
  { label: "Cognitive load", pct: 72 },
  { label: "Execution pressure", pct: 44 },
  { label: "Recovery buffer", pct: 28 },
];

function toneClasses(tone: (typeof MOCK_STATUS)[number]["tone"]) {
  switch (tone) {
    case "ok":
      return "border-[rgba(52,211,153,0.45)] shadow-[0_0_20px_rgba(52,211,153,0.18),inset_0_1px_0_rgba(255,255,255,0.06)]";
    case "warn":
      return "border-[rgba(var(--hud-amber-500-rgb),0.5)] shadow-[0_0_22px_rgba(var(--hud-amber-500-rgb),0.2),inset_0_1px_0_rgba(255,255,255,0.05)]";
    case "blocked":
      return "border-[rgba(248,113,113,0.55)] shadow-[0_0_24px_rgba(248,113,113,0.22),inset_0_1px_0_rgba(255,255,255,0.04)]";
    default:
      return "border-[rgba(var(--mode-rgb),0.22)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";
  }
}

function ledClasses(tone: (typeof MOCK_STATUS)[number]["tone"]) {
  switch (tone) {
    case "ok":
      return "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.85),0_0_6px_rgba(52,211,153,0.55)]";
    case "warn":
      return "bg-[var(--hud-amber-500)] shadow-[0_0_16px_rgba(var(--hud-amber-500-rgb),0.65)]";
    case "blocked":
      return "bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.7)]";
    default:
      return "bg-[var(--semantic-accent)]/80 shadow-[0_0_14px_rgba(var(--mode-rgb),0.5)]";
  }
}

export function VisualLabClient() {
  const [uiBackdrop, setUiBackdrop] =
    useState<VisualLabUiBackdropId>("strategyAnalysis");
  const activeBackdrop = VISUAL_LAB_UI_BACKDROP_PRESETS[uiBackdrop];
  const [pageShell, setPageShell] = useState<VisualLabPageShellId>(
    "hubFlatDashboard",
  );

  return (
    <VisualLabPageShell variant={pageShell}>
      <article
        className={`${activeBackdrop.shell} p-5 md:p-7`}
        aria-label={`Visual lab panel: ${activeBackdrop.label}`}
      >
        {activeBackdrop.radialClass ? (
          <div className={activeBackdrop.radialClass} aria-hidden />
        ) : null}

        <div className="relative z-[1]">
          <header className="relative mb-8 border-b border-[rgba(var(--mode-rgb),0.14)] pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--semantic-accent)]/90">
              Sandbox
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.2)] md:text-2xl">
              Visual lab
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Kies hieronder een{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                page shell
              </span>{" "}
              (volledige achtergrond + buitencontainer) om te vergelijken; zeg
              daarna welke optie je globaal wilt doorvoeren. Daarna: UI-panel
              shells, command decks (
              <code className="rounded bg-black/25 px-1 text-[11px]">
                VisualLabCommandDeck
              </code>
              , zelfde taal als{" "}
              <code className="rounded bg-black/25 px-1 text-[11px]">
                TasksTabsShell
              </code>
              ), lab-ringen, balken, polygon, hex, toasts — mock data.
            </p>
          </header>

          <section
            className="relative mb-10"
            aria-labelledby="page-shell-examples-heading"
          >
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2
                id="page-shell-examples-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                Page shell examples
              </h2>
              <span className="max-w-md text-right text-[10px] leading-snug text-[var(--text-muted)]">
                Actief:{" "}
                <span className="font-semibold text-[var(--text-secondary)]">
                  {VISUAL_LAB_PAGE_SHELL_PRESETS[pageShell].label}
                </span>
              </span>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
              Elke kaart wisselt de{" "}
              <span className="text-[var(--text-primary)]">hele pagina</span>.
              Presets staan in{" "}
              <code className="rounded bg-black/25 px-1 text-[10px]">
                visualLabPageShellPresets.ts
              </code>{" "}
              +{" "}
              <code className="rounded bg-black/25 px-1 text-[10px]">
                VisualLabPageShell.tsx
              </code>
              ; nebula-variant gebruikt{" "}
              <code className="rounded bg-black/25 px-1 text-[10px]">
                .visual-lab-shell-nebula-root
              </code>{" "}
              in{" "}
              <code className="rounded bg-black/25 px-1 text-[10px]">
                globals.css
              </code>
              .
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {VISUAL_LAB_PAGE_SHELL_ORDER.map((id) => {
                const p = VISUAL_LAB_PAGE_SHELL_PRESETS[id];
                const selected = pageShell === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPageShell(id)}
                    className={[
                      "group relative min-h-[7.5rem] overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hud-body-bg)]",
                      selected
                        ? "border-[color:color-mix(in_oklch,var(--semantic-accent),transparent_35%)] ring-2 ring-[rgba(var(--mode-rgb),0.22)]"
                        : "border-[rgba(var(--mode-rgb),0.16)] hover:border-[rgba(var(--mode-rgb),0.26)]",
                    ].join(" ")}
                  >
                    <span
                      className={`${p.thumbClass} absolute inset-0`}
                      aria-hidden
                    />
                    <span className="relative z-[1] flex h-full min-h-[7.5rem] flex-col justify-end bg-gradient-to-t from-[rgba(4,10,18,0.95)] via-[rgba(4,10,18,0.55)] to-transparent p-3">
                      <span className="text-[11px] font-bold leading-snug text-[var(--text-primary)]">
                        {p.label}
                      </span>
                      <span className="mt-1 line-clamp-2 text-[10px] leading-snug text-[var(--text-muted)]">
                        {p.description}
                      </span>
                      <span className="mt-1.5 line-clamp-2 border-t border-[rgba(var(--mode-rgb),0.12)] pt-1.5 text-[9px] leading-snug text-[var(--text-muted)]/90">
                        ≈ {p.matchesApp}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            className="relative mb-10"
            aria-labelledby="ui-backdrops-heading"
          >
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2
                id="ui-backdrops-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                UI panel shells
              </h2>
              <span className="max-w-xs text-right text-[10px] leading-snug text-[var(--text-muted)]">
                Achtergrond van dit artikel — default = Strategy Analyse-kaart
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {VISUAL_LAB_UI_BACKDROP_ORDER.map((id) => {
                const p = VISUAL_LAB_UI_BACKDROP_PRESETS[id];
                const selected = uiBackdrop === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setUiBackdrop(id)}
                    className={[
                      "group relative h-[5.5rem] overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--semantic-accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hud-body-bg)]",
                      selected
                        ? "border-[color:color-mix(in_oklch,var(--semantic-accent),transparent_35%)] ring-2 ring-[rgba(var(--mode-rgb),0.22)]"
                        : "border-[rgba(var(--mode-rgb),0.16)] hover:border-[rgba(var(--mode-rgb),0.26)]",
                    ].join(" ")}
                  >
                    <span
                      className={`${p.shell} absolute inset-0`}
                      aria-hidden
                    />
                    {p.radialClass ? (
                      <span
                        className={`${p.radialClass} absolute inset-0`}
                        aria-hidden
                      />
                    ) : null}
                    <span className="relative z-[1] flex h-full flex-col justify-end bg-gradient-to-t from-[rgba(4,10,18,0.92)] via-[rgba(4,10,18,0.45)] to-transparent p-2.5">
                      <span className="text-[10px] font-bold leading-tight text-[var(--text-primary)]">
                        {p.label}
                      </span>
                      <span className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-[var(--text-muted)]">
                        {p.source}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="relative mb-8 border-b border-[rgba(var(--mode-rgb),0.1)] pb-5">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Pagina-command decks
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
              Mock-ups die dezelfde opbouw gebruiken als live dashboard:
              cinematic kaart, Command-header, HUD-tab rail, inhoud met{" "}
              <code className="rounded bg-black/30 px-1 text-[10px]">
                space-y-6
              </code>
              .
            </p>
          </div>

          <VisualLabMissionsPageConcept />

          <VisualLabStrategyPageConcept />

          <VisualLabProfilePageConcept />

          <VisualLabNotificationsPageConcept />

          <section
            className="relative mb-10 w-full space-y-4 md:-mx-4 md:w-[calc(100%+2rem)] md:max-w-[calc(100%+2rem)] md:px-4"
            aria-labelledby="status-lattice-heading"
          >
            <div className="flex items-end justify-between gap-3">
              <h2
                id="status-lattice-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                Status lattice
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Mock · 6 tiles
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
              {MOCK_STATUS.map((s) => (
                <div
                  key={s.id}
                  className={`relative flex min-h-[104px] flex-col justify-between rounded-xl border bg-[rgba(6,18,30,0.55)] p-3 backdrop-blur-sm sm:min-h-[108px] ${toneClasses(s.tone)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      {s.label}
                    </span>
                    <span
                      className={`h-4 w-4 shrink-0 rounded-full ring-2 ring-black/20 ${ledClasses(s.tone)} ${s.pulse ? "animate-pulse" : ""}`}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                    {s.value}
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
                    <div
                      className={
                        s.tone === "blocked"
                          ? "h-full w-[18%] rounded-full bg-gradient-to-r from-red-600/90 to-red-400/80"
                          : s.tone === "warn"
                            ? "h-full w-[55%] rounded-full bg-gradient-to-r from-amber-700/90 to-[var(--hud-amber-500)]"
                            : s.tone === "ok"
                              ? "h-full w-[88%] rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.35)] to-emerald-400/90"
                              : "h-full w-[40%] rounded-full bg-[rgba(var(--mode-rgb),0.35)]"
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            className="relative mb-10"
            aria-labelledby="pipeline-heading"
          >
            <h2
              id="pipeline-heading"
              className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
            >
              Decision pipeline (diagram)
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.65)] p-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
              <svg
                viewBox="0 0 520 140"
                className="mx-auto h-auto w-full min-w-[480px]"
                role="img"
                aria-label="Mock pipeline from inputs to action"
              >
                <defs>
                  <linearGradient
                    id="vl-node"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(0,212,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(0,136,255,0.08)" />
                  </linearGradient>
                  <filter
                    id="vl-glow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur stdDeviation="1.2" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {[
                  { x: 24, label: "Sense" },
                  { x: 148, label: "Context" },
                  { x: 272, label: "Decide" },
                  { x: 396, label: "Act" },
                ].map((n, i, arr) => (
                  <g key={n.label}>
                    {i < arr.length - 1 ? (
                      <line
                        x1={n.x + 78}
                        y1={58}
                        x2={arr[i + 1].x + 6}
                        y2={58}
                        stroke="rgba(0,212,255,0.35)"
                        strokeWidth="2"
                        strokeDasharray="4 6"
                      />
                    ) : null}
                    <rect
                      x={n.x}
                      y={28}
                      width={96}
                      height={60}
                      rx="10"
                      fill="url(#vl-node)"
                      stroke="rgba(0,212,255,0.45)"
                      strokeWidth="1"
                      filter="url(#vl-glow)"
                    />
                    <text
                      x={n.x + 48}
                      y={62}
                      textAnchor="middle"
                      fill="rgba(229,231,235,0.92)"
                      fontSize="12"
                      fontFamily="var(--font-sans), system-ui, sans-serif"
                      fontWeight="600"
                    >
                      {n.label}
                    </text>
                  </g>
                ))}
                <rect
                  x={180}
                  y={102}
                  width={160}
                  height="28"
                  rx="6"
                  fill="rgba(251,191,36,0.12)"
                  stroke="rgba(251,191,36,0.35)"
                />
                <text
                  x={260}
                  y="121"
                  textAnchor="middle"
                  fill="rgba(253,230,138,0.95)"
                  fontSize="10"
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                  fontWeight="600"
                  letterSpacing="0.08em"
                >
                  GUARDRAIL CHECK (MOCK)
                </text>
              </svg>
            </div>
          </section>

          <section
            className="relative mb-10 space-y-4"
            aria-labelledby="signals-heading"
          >
            <h2
              id="signals-heading"
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
            >
              Signal strips
            </h2>
            {MOCK_SIGNALS.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <span>{row.label}</span>
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {row.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.25)] via-[var(--semantic-accent)] to-[#34d399] shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)]"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </section>

          <section
            className="relative mb-10 space-y-5"
            aria-labelledby="ring-kitchen-heading"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id="ring-kitchen-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                Ring kitchen
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Circle · hex · diamond
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Circle (EnergyRing)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(4,12,22,0.45)] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex min-w-[min(100%,720px)] flex-wrap items-end justify-center gap-8 md:gap-10">
                  {RING_KITCHEN_SAMPLES.map((r) => (
                    <div
                      key={`circle-${r.label}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <EnergyRing
                        size={r.size}
                        progress={r.progress}
                        label={r.label}
                        value={r.value}
                        mode={r.mode}
                        softGlow
                      />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {r.size}px · {r.mode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Hex outline
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(4,12,22,0.45)] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex min-w-[min(100%,720px)] flex-wrap items-end justify-center gap-8 md:gap-10">
                  {RING_KITCHEN_SAMPLES.map((r) => (
                    <div
                      key={`hex-${r.label}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <VisualLabShapeEnergyRing
                        shape="hex"
                        size={r.size}
                        progress={r.progress}
                        label={r.label}
                        value={r.value}
                        mode={r.mode}
                        softGlow
                      />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {r.size}px · {r.mode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Diamond outline
              </h3>
              <div className="overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(4,12,22,0.45)] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex min-w-[min(100%,720px)] flex-wrap items-end justify-center gap-8 md:gap-10">
                  {RING_KITCHEN_SAMPLES.map((r) => (
                    <div
                      key={`diamond-${r.label}`}
                      className="flex flex-col items-center gap-2"
                    >
                      <VisualLabShapeEnergyRing
                        shape="diamond"
                        size={r.size}
                        progress={r.progress}
                        label={r.label}
                        value={r.value}
                        mode={r.mode}
                        softGlow
                      />
                      <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                        {r.size}px · {r.mode}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                CommanderStatRing (compact)
              </h3>
              <div className="flex flex-wrap items-end justify-center gap-8 rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.35)] px-4 py-5">
                <CommanderStatRing variant="energy" value={72} size={102} />
                <CommanderStatRing variant="focus" value={38} size={102} />
                <CommanderStatRing variant="load" value={76} size={102} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Strategy split ring (demo)
              </h3>
              <div className="relative flex flex-wrap items-center justify-center gap-6 overflow-hidden rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] px-4 py-6 shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.14),transparent_55%)]"
                  aria-hidden
                />
                <div className="relative flex flex-wrap items-center justify-center gap-6">
                  <StrategyAnalysisSplitRing
                    budgetHealth={58}
                    growthHealth={79}
                    budgetWarn
                    growthWarn={false}
                  />
                  <StrategyAnalysisSplitRing
                    budgetHealth={82}
                    growthHealth={44}
                    budgetWarn={false}
                    growthWarn
                  />
                </div>
                <div className="relative max-w-[200px] text-[10px] leading-relaxed text-[var(--text-secondary)]">
                  Same component as Strategy → Analyse. Values and warn flags
                  change arc length and gradients; this strip used to sit on a
                  flat dark panel, which made glows look stronger than on the
                  real card.
                </div>
              </div>
            </div>
          </section>

          <section
            className="relative mb-10 space-y-5"
            aria-labelledby="bars-advanced-heading"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id="bars-advanced-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                Bar alternatives
              </h2>
              <span className="max-w-md text-right text-[10px] leading-snug text-[var(--text-muted)]">
                Zone-band lab · nieuwe balken
              </span>
            </div>
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.35)] p-4 md:p-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Lab · zone aan de rand
              </p>
              <ZoneBandBar
                label="Druk-indicator (niet op productie)"
                caption="94 — lezing in de hoge band"
                pct={94}
                bandFootLabels={["Strak", "Doel", "Ruim"]}
              />
            </div>
          </section>

          <section
            className="relative mb-10 space-y-5"
            aria-labelledby="polygon-heading"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id="polygon-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                Polygon meters
              </h2>
              <span className="text-[10px] text-[var(--text-muted)]">
                Trace = outline dash · Fill = clipped level · Hex apart
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Outline trace
              </h3>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <PolygonHudMeter
                  variant="square"
                  label="Square"
                  value="Sync"
                  pct={76}
                  style="ring"
                />
                <PolygonHudMeter
                  variant="triangle"
                  label="Triangle"
                  value="Yield"
                  pct={52}
                  style="ring"
                />
                <PolygonHudMeter
                  variant="diamond"
                  label="Diamond"
                  value="Pulse"
                  pct={34}
                  style="ring"
                />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Interior fill
              </h3>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                <PolygonHudMeter
                  variant="square"
                  label="Square"
                  value="Tank A"
                  pct={64}
                  style="fill"
                />
                <PolygonHudMeter
                  variant="triangle"
                  label="Triangle"
                  value="Tank B"
                  pct={41}
                  style="fill"
                />
                <PolygonHudMeter
                  variant="diamond"
                  label="Diamond"
                  value="Tank D"
                  pct={27}
                  style="fill"
                />
              </div>
            </div>
            <div className="space-y-3 border-t border-[rgba(var(--mode-rgb),0.12)] pt-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  Hex
                </h3>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  Mesh 88% trace · Tank C 60% fill
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-10 sm:gap-16">
                <PolygonHudMeter
                  variant="hex"
                  label="Hex"
                  value="Mesh"
                  pct={88}
                  style="ring"
                />
                <PolygonHudMeter
                  variant="hex"
                  label="Hex"
                  value="Tank C"
                  pct={60}
                  style="fill"
                />
              </div>
            </div>
          </section>

          <section
            className="relative mb-10 space-y-3"
            aria-labelledby="hex-mesh-heading"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2
                id="hex-mesh-heading"
                className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
              >
                Hex mesh
              </h2>
              <span className="text-[10px] text-[var(--text-muted)]">
                Honeycomb · 60% cells filled
              </span>
            </div>
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(4,12,22,0.45)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <VisualLabHexMesh fillPct={60} />
            </div>
          </section>

          <section
            className="relative space-y-4"
            aria-labelledby="toast-heading"
          >
            <h2
              id="toast-heading"
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
            >
              Toast previews + live triggers
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Static shells mimic Sonner placement; buttons call the same
              guardrail helpers used on Budget (English demos here).
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-[rgba(var(--hud-amber-500-rgb),0.35)] bg-gradient-to-br from-[rgba(45,30,8,0.55)] to-[rgba(12,20,42,0.92)] p-3 shadow-[0_0_20px_rgba(var(--hud-amber-500-rgb),0.12)]">
                <div className="flex items-start gap-3">
                  <NeuroToastIcon variant="warning" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Warning (static)
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Soft guardrail: you can still proceed, but the engine
                      increases friction on spend.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(248,113,113,0.45)] bg-gradient-to-br from-[rgba(40,12,12,0.5)] to-[rgba(12,20,42,0.94)] p-3 shadow-[0_0_24px_rgba(248,113,113,0.18)]">
                <div className="flex items-start gap-3">
                  <NeuroToastIcon variant="error" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      Blocked (static)
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Hard stop: action is not available until the lock clock
                      clears.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                className="primary-btn px-4 py-2.5 text-xs"
                onClick={demoToastWeeklyBurnWarningEn}
              >
                Fire warning toast
              </button>
              <button
                type="button"
                className="primary-btn px-4 py-2.5 text-xs"
                onClick={demoToastSpendLockBlockedEn}
              >
                Fire blocked toast
              </button>
              <button
                type="button"
                className="btn-secondary px-4 py-2.5 text-xs"
                onClick={demoToastSnapshotInfoEn}
              >
                Fire info toast
              </button>
            </div>
          </section>

          <footer className="relative mt-10 border-t border-[rgba(var(--mode-rgb),0.12)] pt-5 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Standalone route · /visual-lab
          </footer>
        </div>
      </article>
    </VisualLabPageShell>
  );
}

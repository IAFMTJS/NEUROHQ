"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { NeuroToastIcon } from "@/components/brand/NeuroToastIcon";
import { EnergyRing } from "@/components/hud-test/EnergyRing";
import { CommanderStatRing } from "@/components/commander/CommanderStatRing";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";
import { SegmentedBar, ZoneBandBar } from "@/components/visual-lab/VisualLabBars";
import { PolygonHudMeter } from "@/components/visual-lab/VisualLabPolygonMeters";

const MOCK_STATUS = [
  { id: "sync", label: "State sync", value: "Live", tone: "ok" as const, pulse: true },
  { id: "budget", label: "Budget gate", value: "Soft hold", tone: "warn" as const, pulse: false },
  { id: "lock", label: "Spend lock", value: "Blocked", tone: "blocked" as const, pulse: false },
  { id: "learn", label: "Learning streak", value: "4 / 7 d", tone: "neutral" as const, pulse: false },
  { id: "tasks", label: "Today stack", value: "6 open", tone: "warn" as const, pulse: true },
  { id: "engine", label: "Engine mode", value: "Focus", tone: "ok" as const, pulse: false },
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
      return "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]";
    case "warn":
      return "bg-[var(--hud-amber-500)] shadow-[0_0_12px_rgba(var(--hud-amber-500-rgb),0.55)]";
    case "blocked":
      return "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.65)]";
    default:
      return "bg-[var(--semantic-accent)]/80 shadow-[0_0_10px_rgba(var(--mode-rgb),0.4)]";
  }
}

export function VisualLabClient() {
  const showWarningToast = useCallback(() => {
    neuroToast.warning("Approaching weekly burn cap — pace discretionary spend.", { duration: 5_000 });
  }, []);

  const showBlockedToast = useCallback(() => {
    toast.error("Action blocked: lock window active until 06:00.", {
      className: "hq-toast hq-toast-prepayday hq-toast-prepayday-critical",
      icon: <NeuroToastIcon variant="error" />,
      duration: 6_000,
    });
  }, []);

  const showInfoToast = useCallback(() => {
    neuroToast.info("Snapshot saved to local preview queue (mock).", { duration: 4_000 });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--hud-body-bg)] px-[var(--page-padding-x)] py-8 text-[var(--text-main)]">
      <div className="pointer-events-none fixed inset-0 opacity-[var(--spotlight-opacity)] saturate-[var(--spotlight-saturation)] blur-[var(--spotlight-blur)] [background:var(--spotlight)]" aria-hidden />

      <div className="relative mx-auto max-w-5xl">
        <article className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/95 to-[rgba(var(--mode-rgb-deep),0.12)] p-5 shadow-[var(--hud-elevation-panel),0_0_40px_rgba(var(--mode-rgb),0.1),inset_0_1px_0_rgba(255,255,255,0.06)] md:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(var(--mode-rgb),0.16),transparent_55%)]"
            aria-hidden
          />

          <header className="relative mb-8 border-b border-[rgba(var(--mode-rgb),0.14)] pb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--semantic-accent)]/90">Sandbox</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.2)] md:text-2xl">
              Visual lab
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              Mock HUD: rings, split ring, segmented and zone bars, polygon meters (trace + fill), lattice, flow diagram, strips, toasts. No live data.
            </p>
          </header>

          <section className="relative mb-10 space-y-4" aria-labelledby="status-lattice-heading">
            <div className="flex items-end justify-between gap-3">
              <h2 id="status-lattice-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Status lattice
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Mock · 6 tiles</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MOCK_STATUS.map((s) => (
                <div
                  key={s.id}
                  className={`relative flex min-h-[92px] flex-col justify-between rounded-xl border bg-[rgba(6,18,30,0.55)] p-3 backdrop-blur-sm ${toneClasses(s.tone)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{s.label}</span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${ledClasses(s.tone)} ${s.pulse ? "animate-pulse" : ""}`}
                      aria-hidden
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{s.value}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/30">
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

          <section className="relative mb-10" aria-labelledby="pipeline-heading">
            <h2 id="pipeline-heading" className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Decision pipeline (diagram)
            </h2>
            <div className="overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.18)] bg-[rgba(4,12,22,0.65)] p-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)]">
              <svg viewBox="0 0 520 140" className="mx-auto h-auto w-full min-w-[480px]" role="img" aria-label="Mock pipeline from inputs to action">
                <defs>
                  <linearGradient id="vl-node" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(0,212,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(0,136,255,0.08)" />
                  </linearGradient>
                  <filter id="vl-glow" x="-20%" y="-20%" width="140%" height="140%">
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
                    <text x={n.x + 48} y={62} textAnchor="middle" fill="rgba(229,231,235,0.92)" fontSize="12" fontFamily="var(--font-sans), system-ui, sans-serif" fontWeight="600">
                      {n.label}
                    </text>
                  </g>
                ))}
                <rect x={180} y={102} width={160} height="28" rx="6" fill="rgba(251,191,36,0.12)" stroke="rgba(251,191,36,0.35)" />
                <text x={260} y="121" textAnchor="middle" fill="rgba(253,230,138,0.95)" fontSize="10" fontFamily="var(--font-sans), system-ui, sans-serif" fontWeight="600" letterSpacing="0.08em">
                  GUARDRAIL CHECK (MOCK)
                </text>
              </svg>
            </div>
          </section>

          <section className="relative mb-10 space-y-4" aria-labelledby="signals-heading">
            <h2 id="signals-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Signal strips
            </h2>
            {MOCK_SIGNALS.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  <span>{row.label}</span>
                  <span className="tabular-nums text-[var(--text-secondary)]">{row.pct}%</span>
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

          <section className="relative mb-10 space-y-5" aria-labelledby="ring-kitchen-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="ring-kitchen-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Ring kitchen (EnergyRing)
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Sizes + modes</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(4,12,22,0.45)] px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex min-w-[min(100%,720px)] flex-wrap items-end justify-center gap-8 md:gap-10">
                {[
                  { size: 88, progress: 84, mode: "green-peak" as const, label: "Peak", value: "84%" },
                  { size: 104, progress: 48, mode: "default" as const, label: "Budget", value: "48%" },
                  { size: 96, progress: 24, mode: "high-alert" as const, label: "Drain", value: "24%" },
                  { size: 92, progress: 100, mode: "locked" as const, label: "Lock", value: "Hold" },
                ].map((r) => (
                  <div key={r.label} className="flex flex-col items-center gap-2">
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

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">CommanderStatRing (compact)</h3>
              <div className="flex flex-wrap items-end justify-center gap-8 rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.35)] px-4 py-5">
                <CommanderStatRing variant="energy" value={72} size={102} />
                <CommanderStatRing variant="focus" value={38} size={102} />
                <CommanderStatRing variant="load" value={76} size={102} />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Strategy split ring (mock)</h3>
              <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(4,12,22,0.35)] px-4 py-6">
                <StrategyAnalysisSplitRing budgetHealth={58} growthHealth={79} budgetWarn growthWarn={false} />
                <StrategyAnalysisSplitRing budgetHealth={82} growthHealth={44} budgetWarn={false} growthWarn />
                <div className="max-w-[200px] text-[10px] leading-relaxed text-[var(--text-secondary)]">
                  Left arc = budget health (warms when tight). Right arc = growth. Pair shows how the real strategy card balances two pressures.
                </div>
              </div>
            </div>
          </section>

          <section className="relative mb-10 space-y-6 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(4,12,22,0.25)] p-4 md:p-5" aria-labelledby="bars-advanced-heading">
            <h2 id="bars-advanced-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Bar alternatives
            </h2>
            <SegmentedBar
              label="Segmented · pay-cycle phases"
              caption="Mock fill per slice"
              fills={[1, 1, 0.62, 0.15, 0]}
              segmentLabels={["W1", "W2", "W3", "W4", "Buf"]}
            />
            <ZoneBandBar label="Zone band + marker" caption="Reading 72% (mock)" pct={72} />
            <ZoneBandBar label="Same band, edge reading" caption="Reading 94% (mock)" pct={94} />
          </section>

          <section className="relative mb-10 space-y-5" aria-labelledby="polygon-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="polygon-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Polygon meters
              </h2>
              <span className="text-[10px] text-[var(--text-muted)]">Trace = outline dash · Fill = clipped level</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Outline trace</h3>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <PolygonHudMeter variant="square" label="Square" value="Sync" pct={76} style="ring" />
                <PolygonHudMeter variant="triangle" label="Triangle" value="Yield" pct={52} style="ring" />
                <PolygonHudMeter variant="hex" label="Hex" value="Mesh" pct={88} style="ring" />
                <PolygonHudMeter variant="diamond" label="Diamond" value="Pulse" pct={34} style="ring" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Interior fill</h3>
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <PolygonHudMeter variant="square" label="Square" value="Tank A" pct={64} style="fill" />
                <PolygonHudMeter variant="triangle" label="Triangle" value="Tank B" pct={41} style="fill" />
                <PolygonHudMeter variant="hex" label="Hex" value="Tank C" pct={91} style="fill" />
                <PolygonHudMeter variant="diamond" label="Diamond" value="Tank D" pct={27} style="fill" />
              </div>
            </div>
          </section>

          <section className="relative space-y-4" aria-labelledby="toast-heading">
            <h2 id="toast-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Toast previews + live triggers
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">Static shells mimic Sonner placement; buttons use the real toaster.</p>

            <div className="space-y-3">
              <div className="rounded-xl border border-[rgba(var(--hud-amber-500-rgb),0.35)] bg-gradient-to-br from-[rgba(45,30,8,0.55)] to-[rgba(12,20,42,0.92)] p-3 shadow-[0_0_20px_rgba(var(--hud-amber-500-rgb),0.12)]">
                <div className="flex items-start gap-3">
                  <NeuroToastIcon variant="warning" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Warning (static)</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Soft guardrail: you can still proceed, but the engine increases friction on spend.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[rgba(248,113,113,0.45)] bg-gradient-to-br from-[rgba(40,12,12,0.5)] to-[rgba(12,20,42,0.94)] p-3 shadow-[0_0_24px_rgba(248,113,113,0.18)]">
                <div className="flex items-start gap-3">
                  <NeuroToastIcon variant="error" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Blocked (static)</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                      Hard stop: action is not available until the lock clock clears.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="button" className="primary-btn px-4 py-2.5 text-xs" onClick={showWarningToast}>
                Fire warning toast
              </button>
              <button type="button" className="primary-btn px-4 py-2.5 text-xs" onClick={showBlockedToast}>
                Fire blocked toast
              </button>
              <button type="button" className="btn-secondary px-4 py-2.5 text-xs" onClick={showInfoToast}>
                Fire info toast
              </button>
            </div>
          </section>

          <footer className="relative mt-10 border-t border-[rgba(var(--mode-rgb),0.12)] pt-5 text-center text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Standalone route · /visual-lab
          </footer>
        </article>
      </div>
    </div>
  );
}

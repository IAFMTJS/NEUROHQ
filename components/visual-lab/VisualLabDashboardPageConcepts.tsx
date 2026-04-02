"use client";

import { getDashboardMascotSrc } from "@/lib/mascots";
import { VISUAL_LAB_PEDESTAL_MOCK } from "@/components/visual-lab/VisualLabPedestalHalfRingAlternatives";

const ANGLES = [
  Math.PI + Math.PI / 18,
  (3 * Math.PI) / 4,
  Math.PI / 4,
  -Math.PI / 18,
] as const;
const SWEEP: 0 | 1 = 0;
const VB = { w: 400, h: 210, cx: 200, cy: 10 };

function polar(cx: number, cy: number, r: number, t: number) {
  return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
}

function segmentPaths(cx: number, cy: number, r: number): string[] {
  const pts = ANGLES.map((t) => polar(cx, cy, r, t));
  return [0, 1, 2].map((i) => {
    const a = pts[i];
    const b = pts[i + 1];
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 ${SWEEP} ${b.x} ${b.y}`;
  });
}

function annularSlice(cx: number, cy: number, rIn: number, rOut: number, t0: number, t1: number): string {
  const p1o = polar(cx, cy, rOut, t0);
  const p2o = polar(cx, cy, rOut, t1);
  const p2i = polar(cx, cy, rIn, t1);
  const p1i = polar(cx, cy, rIn, t0);
  const innerSweep = (1 - SWEEP) as 0 | 1;
  return [
    `M ${p1o.x} ${p1o.y}`,
    `A ${rOut} ${rOut} 0 0 ${SWEEP} ${p2o.x} ${p2o.y}`,
    `L ${p2i.x} ${p2i.y}`,
    `A ${rIn} ${rIn} 0 0 ${innerSweep} ${p1i.x} ${p1i.y}`,
    "Z",
  ].join(" ");
}

const PATH_LEN = 100;
const COL_E = "rgba(34, 211, 238, 0.96)";
const COL_F = "rgba(167, 139, 250, 0.97)";
const COL_L = "rgba(251, 146, 60, 0.95)";
const squashG = "translate(0,0) scale(1 0.58)";
const squashOrigin = { transformOrigin: `${VB.cx}px 68px` as const };

/** Buitenrand donkere bedding voor flux-rails (moet vóór component staan). */
const FLUX_RADII = [178, 166, 154] as const;
const FLUX_R_INNER = FLUX_RADII[2] - 36;
const FLUX_R_OUTER = FLUX_RADII[0] + 28;

/**
 * Nieuwe ring-idea A: drie **parallelle** bogen (verschillende straal), elk draagt één metric —
 * oogt als gestapelde flux-rails onder de commander.
 */
function DashboardRingFluxRails({ uid }: { uid: string }) {
  const { energyPct: e, focusPct: f, loadPct: l } = VISUAL_LAB_PEDESTAL_MOCK;
  const ePct = Math.min(100, Math.max(0, e));
  const fPct = Math.min(100, Math.max(0, f));
  const lPct = Math.min(100, Math.max(0, l));
  const radii = FLUX_RADII;
  const pcts = [ePct, fPct, lPct];
  const cols = [COL_E, COL_F, COL_L];

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className="mx-auto block w-full max-w-[400px] overflow-visible"
      aria-hidden
    >
      <defs>
        <filter id={`${uid}-flux-blur`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g transform={squashG} style={squashOrigin}>
        {/* donkere bedding */}
        <path
          d={[0, 1, 2]
            .map((i) => annularSlice(VB.cx, VB.cy, FLUX_R_INNER, FLUX_R_OUTER, ANGLES[i], ANGLES[i + 1]))
            .join(" ")}
          fill="rgba(0,0,0,0.4)"
          stroke="none"
        />
        {[ANGLES[1], ANGLES[2]].map((theta) => {
          const a = polar(VB.cx, VB.cy, FLUX_R_INNER + 4, theta);
          const b = polar(VB.cx, VB.cy, FLUX_R_OUTER - 4, theta);
          return (
            <line
              key={theta}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(0,0,0,0.65)"
              strokeWidth={3.5}
            />
          );
        })}
        {radii.map((r, i) => {
          const d = segmentPaths(VB.cx, VB.cy, r)[i];
          return (
            <path
              key={r}
              d={d}
              fill="none"
              stroke={cols[i]}
              strokeWidth={9 + i * 0.6}
              strokeLinecap="round"
              pathLength={PATH_LEN}
              strokeDasharray={`${Math.max(0.35, (pcts[i] / 100) * PATH_LEN)} ${PATH_LEN}`}
              filter={`url(#${uid}-flux-blur)`}
            />
          );
        })}
      </g>
    </svg>
  );
}

/**
 * Nieuwe ring-idea B: **Arena-kom** — elliptisch platform, brede chrome boog, drie vaste wiggen
 * met “koplamps” op de binnenrand (ander silhouet dan productie).
 */
function DashboardRingArenaBowl({ uid }: { uid: string }) {
  const { energyPct: e, focusPct: f, loadPct: l } = VISUAL_LAB_PEDESTAL_MOCK;
  const ePct = Math.min(100, Math.max(0, e));
  const fPct = Math.min(100, Math.max(0, f));
  const lPct = Math.min(100, Math.max(0, l));
  const R = 168;
  const inner = R - 42;
  const outer = R + 26;
  const paths = segmentPaths(VB.cx, VB.cy, R);
  const gid = `${uid}-arena-grad`;

  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      className="mx-auto block w-full max-w-[400px] overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(var(--mode-rgb),0.22)" />
          <stop offset="100%" stopColor="rgb(var(--hud-dark-4-rgb))" stopOpacity={0.75} />
        </linearGradient>
      </defs>
      <ellipse
        cx={VB.cx}
        cy={138}
        rx={158}
        ry={30}
        fill={`url(#${gid})`}
        stroke="rgba(var(--mode-rgb),0.25)"
        strokeWidth={1}
      />
      <g transform={`translate(0,4) ${squashG}`} style={squashOrigin}>
        {[0, 1, 2].map((i) => (
          <path
            key={`w-${i}`}
            d={annularSlice(VB.cx, VB.cy, inner + 6, outer - 4, ANGLES[i], ANGLES[i + 1])}
            fill={
              i === 0
                ? "rgba(34, 211, 238, 0.14)"
                : i === 1
                  ? "rgba(167, 139, 250, 0.16)"
                  : "rgba(251, 146, 60, 0.12)"
            }
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={1}
          />
        ))}
        {[ANGLES[1], ANGLES[2]].map((theta) => {
          const a = polar(VB.cx, VB.cy, inner + 8, theta);
          const b = polar(VB.cx, VB.cy, outer - 6, theta);
          return (
            <line
              key={theta}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgb(var(--mode-rgb))"
              strokeWidth={1.5}
              opacity={0.75}
            />
          );
        })}
        <path
          d={paths.join(" ")}
          fill="none"
          stroke="rgba(var(--mode-rgb),0.42)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {paths.map((d, i) => {
          const pct = i === 0 ? ePct : i === 1 ? fPct : lPct;
          const col = i === 0 ? COL_E : i === 1 ? COL_F : COL_L;
          return (
            <path
              key={`p-${i}`}
              d={d}
              fill="none"
              stroke={col}
              strokeWidth={22}
              strokeLinecap="round"
              pathLength={PATH_LEN}
              strokeDasharray={`${Math.max(0.35, (pct / 100) * PATH_LEN)} ${PATH_LEN}`}
              style={{ filter: "drop-shadow(0 0 8px rgba(0,0,0,0.5))" }}
            />
          );
        })}
      </g>
    </svg>
  );
}

function MascotOnBand({ className = "" }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none relative z-[2] mx-auto flex max-w-[272px] justify-center ${className}`}
      aria-hidden
    >
      <img
        src={getDashboardMascotSrc()}
        alt=""
        className="h-[min(8.5rem,36vw)] max-h-[150px] w-auto object-contain object-bottom sm:h-[9.25rem] sm:max-h-[162px]"
        style={{
          filter:
            "drop-shadow(0 20px 32px rgba(0,0,0,0.55)) drop-shadow(0 0 28px rgba(var(--mode-rgb),0.14))",
        }}
      />
    </div>
  );
}

function MockMetricCaps() {
  const { energyPct, focusPct, loadPct } = VISUAL_LAB_PEDESTAL_MOCK;
  return (
    <div className="flex flex-wrap justify-center gap-2 text-[10px] font-semibold tabular-nums">
      <span className="rounded-full border border-cyan-400/35 bg-cyan-400/10 px-3 py-1 text-cyan-100">
        E {Math.round(energyPct)}%
      </span>
      <span className="rounded-full border border-violet-400/35 bg-violet-400/10 px-3 py-1 text-violet-100">
        F {Math.round(focusPct)}%
      </span>
      <span className="rounded-full border border-amber-400/35 bg-amber-400/12 px-3 py-1 text-amber-100">
        L {Math.round(loadPct)}%
      </span>
    </div>
  );
}

/** Concept A — single-column “aurora command”: breed hero + flux-rails ring */
function VisualLabDashboardConceptA() {
  const uid = "db-concept-a";
  return (
    <article
      className="rounded-[var(--hud-radius-lg)] border border-[rgba(var(--mode-rgb),0.16)] p-4 shadow-[var(--hud-card-rim)] md:p-5"
      style={{ background: "var(--hud-surface-card)" }}
    >
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(var(--mode-rgb),0.1)] pb-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">
            Full page mock A
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Aurora command deck
          </h3>
        </div>
        <span className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Stable · mock
        </span>
      </header>

      <div
        className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.12)]"
        style={{
          background:
            "linear-gradient(165deg, rgba(var(--mode-rgb-deep),0.12) 0%, rgba(var(--hud-dark-3-rgb),0.75) 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: "var(--hud-light-top)" }} />
        <div className="relative px-4 pb-2 pt-5 md:px-6">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            System overview
          </p>
          <div className="relative -mb-[min(3.75rem,18vw)] mt-2">
            <DashboardRingFluxRails uid={uid} />
          </div>
          <MascotOnBand className="-mt-2" />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 pb-4 pt-1">
            <MockMetricCaps />
            <span className="text-[10px] text-[var(--text-muted)]">Lv 7 · €185 rest</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="glass-card glass-preserve-decoration rounded-xl p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--semantic-accent)]">
            Brain status
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Check-in aanbevolen</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
            Mock kaart — zelfde plek als live `BrainStatusCard` stroom.
          </p>
        </div>
        <div className="glass-card glass-preserve-decoration rounded-xl p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-400/90">Active mission</p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Kwartaalplan afronden</p>
          <p className="mt-1 text-[11px] text-[var(--text-secondary)]">~90 min · deep work (concept)</p>
        </div>
      </div>

      <div className="mt-4 rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb-deep),0.15)] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
        Naar missies — primary CTA (mock)
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
        <span className="font-semibold text-[var(--text-secondary)]">Ring-idee:</span> drie bogen op
        oplopende straal; elke rail = één resource. Geen productiecode — alleen visual lab.
      </p>
    </article>
  );
}

/** Concept B — split “nexus”: links copy/stats, rechts arena-bowl ring */
function VisualLabDashboardConceptB() {
  const uid = "db-concept-b";
  return (
    <article
      className="rounded-[var(--hud-radius-lg)] border border-[rgba(var(--mode-rgb),0.16)] p-4 shadow-[var(--hud-card-rim)] md:p-5"
      style={{ background: "var(--hud-surface-card)" }}
    >
      <header className="mb-4 border-b border-[rgba(var(--mode-rgb),0.1)] pb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">
          Full page mock B
        </p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-[var(--text-primary)]">
          Split nexus layout
        </h3>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,400px)] lg:items-start">
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Dashboard</h4>
            <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Maandag 30 maart</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
              Linkerkolom richt zich op context en kaarten; rechts een vast command‑paneel met mascotte +
              arena‑kom (ander silhouet dan A).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MockMetricCaps />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(var(--hud-dark-3-rgb),0.45)] p-3">
              <p className="text-[9px] font-bold uppercase text-[var(--text-muted)]">Momentum</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--text-primary)]">+12%</p>
            </div>
            <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(var(--hud-dark-3-rgb),0.45)] p-3">
              <p className="text-[9px] font-bold uppercase text-[var(--text-muted)]">Streak</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-[var(--semantic-accent)]">9 dagen</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 text-[11px] leading-snug text-[var(--text-secondary)]">
            &ldquo;Kleine stappen op een rustige ochtend winnen van heldere plannen op een chaotische
            middag.&rdquo;
            <span className="mt-2 block text-[10px] text-[var(--text-muted)]">— Mock quote</span>
          </div>
        </div>

        <div
          className="relative rounded-2xl border border-[rgba(var(--mode-rgb),0.15)] p-4"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(var(--mode-rgb),0.14), transparent 55%), rgba(var(--hud-dark-4-rgb),0.65)",
          }}
        >
          <p className="text-center text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Commander · arena
          </p>
          <div className="relative -mb-[min(3.5rem,17vw)] mt-3">
            <DashboardRingArenaBowl uid={uid} />
          </div>
          <MascotOnBand />
          <div className="mt-2 flex justify-center gap-2 text-[9px] text-[var(--text-muted)]">
            <span>XP 42/60</span>
            <span>·</span>
            <span>Budget €185</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {["DCIC", "Learning", "Budget"].map((label) => (
          <div
            key={label}
            className="rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-black/20 px-3 py-2.5 text-center text-[10px] font-semibold text-[var(--text-secondary)]"
          >
            {label} strip
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
        <span className="font-semibold text-[var(--text-secondary)]">Ring-idee:</span> elliptisch
        voetstuk + drie getinte wiggen + brede chrome rand; dikke segment‑stroke voor % (arena‑kom).
      </p>
    </article>
  );
}

export function VisualLabDashboardPageConcepts() {
  return (
    <section
      className="relative mb-10 w-full space-y-5"
      aria-labelledby="visual-lab-dashboard-full-heading"
    >
      <div>
        <h2
          id="visual-lab-dashboard-full-heading"
          className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
        >
          Dashboard — volledige pagina (2 concepten)
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Twee end‑to‑end lay-outs voor{" "}
          <code className="rounded bg-black/30 px-1 text-[10px]">/dashboard</code>: hero + status +
          kaarten + CTA, elk met een{" "}
          <span className="font-semibold text-[var(--text-primary)]">eigen half‑ring onder de mascotte</span>{" "}
          (los van de losse ring‑raster hieronder). Mock data:{" "}
          {VISUAL_LAB_PEDESTAL_MOCK.energyPct}% / {VISUAL_LAB_PEDESTAL_MOCK.focusPct}% /{" "}
          {VISUAL_LAB_PEDESTAL_MOCK.loadPct}% E/F/L.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <VisualLabDashboardConceptA />
        <VisualLabDashboardConceptB />
      </div>
    </section>
  );
}

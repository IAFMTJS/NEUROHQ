"use client";

import { getMascotSrcForPage } from "@/lib/mascots";
import { VISUAL_LAB_PEDESTAL_MOCK } from "@/components/visual-lab/VisualLabPedestalHalfRingAlternatives";
import { dashboardCommandDeckOuterClass } from "@/components/layout/DashboardCommandDeckFrame";

/** Zelfde boog als live `CommanderMascotPedestal` (productie). */
const ANGLES = [
  Math.PI + Math.PI / 18,
  (3 * Math.PI) / 4,
  Math.PI / 4,
  -Math.PI / 18,
] as const;
const SWEEP: 0 | 1 = 0;
const CX = 200;
const CY = 0;
const R_MID = 204;
const R_INNER = R_MID - 38;
const R_OUTER = R_MID + 30;
const VB_W = 400;
const VB_H = 200;
const PATH_LEN = 100;

function polar(cx: number, cy: number, r: number, t: number) {
  return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
}

function annularSectorD(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  theta1: number,
  theta2: number,
  sweep: 0 | 1,
): string {
  const p1o = polar(cx, cy, rOuter, theta1);
  const p2o = polar(cx, cy, rOuter, theta2);
  const p2i = polar(cx, cy, rInner, theta2);
  const p1i = polar(cx, cy, rInner, theta1);
  const large = 0;
  const innerSweep = (1 - sweep) as 0 | 1;
  return [
    `M ${p1o.x} ${p1o.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${p2o.x} ${p2o.y}`,
    `L ${p2i.x} ${p2i.y}`,
    `A ${rInner} ${rInner} 0 ${large} ${innerSweep} ${p1i.x} ${p1i.y}`,
    "Z",
  ].join(" ");
}

const SEG_SECTOR_D = [0, 1, 2].map((i) =>
  annularSectorD(CX, CY, R_INNER, R_OUTER, ANGLES[i], ANGLES[i + 1], SWEEP),
);

const PTS = ANGLES.map((t) => polar(CX, CY, R_MID, t));
const SEG_PATHS = [0, 1, 2].map((i) => {
  const a = PTS[i];
  const b = PTS[i + 1];
  return `M ${a.x} ${a.y} A ${R_MID} ${R_MID} 0 0 ${SWEEP} ${b.x} ${b.y}`;
});

const OUTER_RIM_D = [0, 1, 2]
  .map((i) => {
    const a = polar(CX, CY, R_OUTER, ANGLES[i]);
    const b = polar(CX, CY, R_OUTER, ANGLES[i + 1]);
    return `M ${a.x} ${a.y} A ${R_OUTER} ${R_OUTER} 0 0 ${SWEEP} ${b.x} ${b.y}`;
  })
  .join(" ");

function SegmentDividers({ rIn, rOut }: { rIn: number; rOut: number }) {
  return (
    <>
      {[ANGLES[1], ANGLES[2]].map((theta) => {
        const a = polar(CX, CY, rIn, theta);
        const b = polar(CX, CY, rOut, theta);
        return (
          <line
            key={theta}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(0,0,0,0.55)"
            strokeWidth={3.5}
          />
        );
      })}
      {[ANGLES[1], ANGLES[2]].map((theta) => {
        const a = polar(CX, CY, rIn + 2, theta);
        const b = polar(CX, CY, rOut - 2, theta);
        return (
          <line
            key={`a-${theta}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="rgba(var(--mode-rgb),0.4)"
            strokeWidth={1.2}
          />
        );
      })}
    </>
  );
}

const chipClass =
  "rounded-lg border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(6,18,30,0.72)] px-2 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md";

function MockCommandHeader() {
  return (
    <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[rgba(var(--mode-rgb),0.18)] pb-3">
      <div className="min-w-0 border-l-2 border-[rgba(var(--semantic-accent),0.55)] pl-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Command</p>
        <h2 className="mt-0.5 text-base font-bold tracking-tight text-[var(--text-primary)] [text-shadow:0_0_14px_rgba(var(--mode-rgb),0.18)] md:text-lg">
          Dashboard
        </h2>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">System overview</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-sm" aria-hidden>
          🔔
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(var(--mode-rgb),0.22)] bg-[rgba(6,18,30,0.5)] text-sm" aria-hidden>
          ⚙
        </span>
        <span className="rounded-xl border border-[rgba(var(--mode-rgb),0.24)] bg-[rgba(6,18,30,0.55)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          ← HQ
        </span>
      </div>
    </header>
  );
}

function MockIconRail() {
  const icons = ["⌖", "✦", "📍", "◉"];
  return (
    <div className="flex flex-col justify-center gap-2.5 py-4 pl-1">
      {icons.map((icon, i) => (
        <div
          key={i}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(var(--mode-rgb),0.3)] bg-[rgba(var(--mode-rgb-deep),0.12)] text-sm shadow-[0_0_14px_rgba(var(--mode-rgb),0.15)]"
          aria-hidden
        >
          {icon}
        </div>
      ))}
    </div>
  );
}

function MockStatRings() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const rows = [
    { label: "Energy", pct: mock.energyPct },
    { label: "Focus", pct: mock.focusPct },
    { label: "Load", pct: mock.loadPct },
  ] as const;
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-4 sm:gap-6">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-col items-center gap-1.5 text-center">
          <div
            className="relative flex h-[100px] w-[100px] items-center justify-center rounded-full border-2 border-[rgba(var(--mode-rgb),0.35)]"
            style={{
              background: `conic-gradient(rgb(var(--mode-rgb)) 0% ${r.pct}%, rgba(255,255,255,0.08) ${r.pct}% 100%)`,
            }}
          >
            <div className="flex h-[76px] w-[76px] flex-col items-center justify-center rounded-full bg-[rgba(8,20,34,0.92 )]">
              <span className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{Math.round(r.pct)}%</span>
            </div>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">{r.label}</span>
          <span className="text-[10px] tabular-nums text-[var(--text-secondary)]">
            {(r.pct / 10).toFixed(1)}/10
          </span>
        </div>
      ))}
    </div>
  );
}

/** Ring zoals live pedestal + extra “chrome lip” (binnenrand highlight). */
function RingWithChromeLip({ uid, donutSquash = 0.66 }: { uid: string; donutSquash?: number }) {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const e = Math.min(100, Math.max(0, mock.energyPct));
  const f = Math.min(100, Math.max(0, mock.focusPct));
  const l = Math.min(100, Math.max(0, mock.loadPct));
  const W_SIDE = 44;
  const W_CENTER = 52;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="block h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${uid}-bowl`} cx="50%" cy="100%" r="78%" fx="50%" fy="100%">
          <stop offset="0%" stopColor="rgba(var(--mode-rgb),0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.3)" />
        </radialGradient>
      </defs>
      <g transform={`translate(${CX} ${CY}) scale(1 ${donutSquash}) translate(${-CX} ${-CY})`}>
        <ellipse cx={CX} cy={198} rx={R_MID - 8} ry={20} fill={`url(#${uid}-bowl)`} opacity={0.2} />
        {SEG_SECTOR_D.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={
              i === 0
                ? "rgba(34,211,238,0.11)"
                : i === 1
                  ? "rgba(167,139,250,0.13)"
                  : "rgba(251,146,60,0.09)"
            }
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={0.75}
          />
        ))}
        <SegmentDividers rIn={R_INNER + 2} rOut={R_OUTER - 2} />
        {/* Chrome lip: iets binnen de buitenrand */}
        <path
          d={OUTER_RIM_D}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.5}
          transform={`translate(0, -3)`}
        />
        <path
          d={OUTER_RIM_D}
          fill="none"
          stroke="rgba(var(--mode-rgb),0.42)"
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.65}
        />
        <path
          d={SEG_PATHS[0]}
          fill="none"
          stroke="rgba(34,211,238,0.95)"
          strokeWidth={W_SIDE}
          strokeLinecap="round"
          pathLength={PATH_LEN}
          strokeDasharray={`${Math.max(0.35, (e / 100) * PATH_LEN)} ${PATH_LEN}`}
        />
        <path
          d={SEG_PATHS[1]}
          fill="none"
          stroke="rgba(167,139,250,0.97)"
          strokeWidth={W_CENTER}
          strokeLinecap="round"
          pathLength={PATH_LEN}
          strokeDasharray={`${Math.max(0.35, (f / 100) * PATH_LEN)} ${PATH_LEN}`}
        />
        <path
          d={SEG_PATHS[2]}
          fill="none"
          stroke="rgba(251,146,60,0.95)"
          strokeWidth={W_SIDE}
          strokeLinecap="round"
          pathLength={PATH_LEN}
          strokeDasharray={`${Math.max(0.35, (l / 100) * PATH_LEN)} ${PATH_LEN}`}
        />
      </g>
    </svg>
  );
}

/**
 * Platter-ring: bredere ellips, lagere “tilt”; chips in rij onder boog (alternaties voor HUD op band).
 */
function RingPlatterWide({ uid }: { uid: string }) {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const e = Math.min(100, Math.max(0, mock.energyPct));
  const f = Math.min(100, Math.max(0, mock.focusPct));
  const l = Math.min(100, Math.max(0, mock.loadPct));
  const cx = 200;
  const cy = 12;
  const r = 175;
  const inner = r - 46;
  const outer = r + 28;
  const paths = [0, 1, 2].map((i) => {
    const pts = ANGLES.map((t) => polar(cx, cy, r, t));
    const a = pts[i];
    const b = pts[i + 1];
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 ${SWEEP} ${b.x} ${b.y}`;
  });

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`${uid}-platter`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(var(--mode-rgb),0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </linearGradient>
      </defs>
      <g transform="translate(0,0) scale(1 0.52)" style={{ transformOrigin: "200px 70px" }}>
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={annularSectorD(cx, cy, inner, outer, ANGLES[i], ANGLES[i + 1], SWEEP)}
            fill={`url(#${uid}-platter)`}
            opacity={0.35 + i * 0.04}
          />
        ))}
        {[ANGLES[1], ANGLES[2]].map((theta) => {
          const a = polar(cx, cy, inner + 4, theta);
          const b = polar(cx, cy, outer - 4, theta);
          return (
            <line
              key={theta}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgb(var(--mode-rgb))"
              strokeWidth={1.5}
              opacity={0.65}
            />
          );
        })}
        {paths.map((d, i) => {
          const pct = i === 0 ? e : i === 1 ? f : l;
          const col = i === 0 ? "#22d3ee" : i === 1 ? "#c4b5fd" : "#fb923c";
          return (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={col}
              strokeWidth={20}
              strokeLinecap="round"
              pathLength={PATH_LEN}
              strokeDasharray={`${Math.max(0.35, (pct / 100) * PATH_LEN)} ${PATH_LEN}`}
              opacity={0.92}
            />
          );
        })}
      </g>
    </svg>
  );
}

function XpBudgetChips() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const neg = mock.budgetRemainingCents < 0;
  const amt = Math.abs(mock.budgetRemainingCents / 100);
  return (
    <>
      <div
        className={`${chipClass} absolute left-[4%] top-[58%] z-[3] w-[min(30%,7.5rem)] sm:left-[6%]`}
      >
        <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-cyan-200/80">Scan</span>
        <span className="mt-0.5 block text-[11px] font-bold text-[var(--text-primary)]">OK</span>
      </div>
      <div
        className={`${chipClass} absolute left-1/2 top-[52%] z-[3] w-[min(42%,11rem)] -translate-x-1/2`}
      >
        <span className="block text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">XP</span>
        <span className="mt-0.5 block text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
          Lv {mock.displayLevel}
        </span>
        <span className="mt-0.5 block text-[10px] tabular-nums text-[var(--text-secondary)]">
          {xpProgressLabel(mock)}
        </span>
      </div>
      <div
        className={`${chipClass} absolute right-[4%] top-[58%] z-[3] w-[min(34%,8rem)] text-right sm:right-[6%]`}
      >
        <span className="block text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--text-muted)]">Budget</span>
        <span className="mt-0.5 block text-[13px] font-bold tabular-nums text-[var(--text-primary)]">
          {neg ? "−" : ""}€{amt.toFixed(0)}
        </span>
        <span className="mt-0.5 block text-[10px] text-[var(--text-secondary)]">{neg ? "over" : "rest"}</span>
      </div>
    </>
  );
}

function xpProgressLabel(mock: typeof VISUAL_LAB_PEDESTAL_MOCK) {
  const cur = mock.totalXP % 1000;
  return `${cur}/1000`;
}

/** Idee 1 — Zelfde hiërarchie als screenshot: perspectief + chips op de boog + chrome lip. */
function ScreenshotIdeaDeckParity() {
  const uid = "ss-deck-1-b8278d04-39ff-4d38-9fb4-f1ca12ef3a1f";
  return (
    <article
      className="overflow-hidden rounded-2xl p-0"
      style={{ background: "var(--hud-surface-card)" }}
    >
      <div className={`${dashboardCommandDeckOuterClass} !rounded-2xl !shadow-none`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_0%,rgba(var(--mode-rgb),0.14),transparent_58%)]" />
        <div className="relative z-[1] space-y-4 p-4 md:p-5">
          <MockCommandHeader />

          <div className="grid grid-cols-[1fr_auto] gap-1 sm:gap-3">
            <div className="relative min-w-0">
              <div
                className="relative mx-auto flex max-w-[min(420px,100%)] justify-center"
                style={{ perspective: "980px", perspectiveOrigin: "50% 90%" }}
              >
                <div className="relative z-[14] -mb-10 flex w-full justify-center px-1 sm:-mb-12">
                  <img
                    src={getMascotSrcForPage("dashboard")}
                    alt=""
                    className="relative z-[2] h-[min(9.5rem,40vw)] max-h-[168px] w-auto object-contain object-bottom sm:max-h-[180px]"
                    style={{
                      filter:
                        "drop-shadow(0 18px 36px rgba(0,0,0,0.55)) drop-shadow(0 0 28px rgba(var(--mode-rgb),0.12))",
                    }}
                    aria-hidden
                  />
                </div>
                <div
                  className="absolute bottom-0 left-1/2 z-[1] w-[108%] max-w-none -translate-x-1/2"
                  style={{
                    transform: "translateX(-50%) rotateX(50deg) rotateZ(-4deg) skewX(-4deg)",
                    transformOrigin: "center bottom",
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    className="mx-auto w-full max-w-[400px]"
                    style={{ transform: "scaleY(1.2)", transformOrigin: "top center" }}
                  >
                    <RingWithChromeLip uid={uid} />
                  </div>
                </div>
                <XpBudgetChips />
              </div>

              <p className="mt-1 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Mascotte op band · HUD-blokken op de boog (mock)
              </p>
              <MockStatRings />
            </div>
            <MockIconRail />
          </div>

          <div className="glass-card glass-preserve-decoration mx-auto w-full max-w-lg rounded-xl !p-3 text-center">
            <p
              className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "rgba(var(--mode-rgb),0.78)" }}
            >
              Daily quote
            </p>
            <p className="text-[12px] italic leading-snug text-[var(--text-primary)]">
              &ldquo;Where id was, ego shall be.&rdquo;
            </p>
            <p className="mt-1 text-[10px]" style={{ color: "rgba(var(--mode-rgb),0.7)" }}>
              — Sigmund Freud
            </p>
          </div>

          <div className="rounded-full border border-[rgba(var(--mode-rgb),0.28)] bg-gradient-to-b from-[rgba(255,255,255,0.08)] to-[rgba(6,18,30,0.75)] py-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            Start missie
          </div>

          <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-secondary)]">Nabij live layout:</span> command header, mascotte
            boven perspectief-ring, driedeling + XP/Budget chips, verticale icon-rail, stat-rings, quote, CTA. Nieuwe
            twist: dubbele &ldquo;chrome lip&rdquo; op de buitenrand.
          </p>
        </div>
      </div>
    </article>
  );
}

/** Idee 2 — Platte “runway”: geen 3D-tilt; bredere platter-boog; chips onder de boog. */
function ScreenshotIdeaPlatterRunway() {
  const uid = "ss-deck-2-a11e7c2f-4c3e-4a2b-9d5e-3f2b1a0c9d8e";
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const neg = mock.budgetRemainingCents < 0;
  const amt = Math.abs(mock.budgetRemainingCents / 100);
  return (
    <article
      className="overflow-hidden rounded-2xl p-0"
      style={{ background: "var(--hud-surface-card)" }}
    >
      <div className={`${dashboardCommandDeckOuterClass} !rounded-2xl !shadow-none`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_12%,rgba(var(--mode-rgb-deep),0.12),transparent_55%)]" />
        <div className="relative z-[1] space-y-4 p-4 md:p-5">
          <MockCommandHeader />

          <div className="grid grid-cols-[1fr_auto] gap-1 sm:gap-3">
            <div className="min-w-0">
              <div className="relative mx-auto max-w-[440px]">
                <div className="relative z-[2] -mb-8 flex justify-center sm:-mb-9">
                  <img
                    src={getMascotSrcForPage("dashboard")}
                    alt=""
                    className="h-[min(8.75rem,38vw)] max-h-[158px] w-auto object-contain object-bottom"
                    style={{ filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.5))" }}
                    aria-hidden
                  />
                </div>
                <div className="relative z-[1] -mt-2 w-full px-2">
                  <RingPlatterWide uid={uid} />
                </div>
              </div>

              <div className="relative z-[3] -mt-3 flex flex-wrap items-start justify-center gap-2 px-1">
                <div className={chipClass}>
                  <span className="block text-[8px] font-semibold uppercase text-cyan-200/80">Energy lane</span>
                  <span className="text-[11px] font-bold text-[var(--text-primary)]">{Math.round(mock.energyPct)}%</span>
                </div>
                <div className={chipClass}>
                  <span className="block text-[8px] font-semibold uppercase text-[var(--text-muted)]">XP</span>
                  <span className="text-[13px] font-bold tabular-nums">Lv {mock.displayLevel}</span>
                  <span className="block text-[10px] tabular-nums text-[var(--text-secondary)]">{xpProgressLabel(mock)}</span>
                </div>
                <div className={`${chipClass} text-right`}>
                  <span className="block text-[8px] font-semibold uppercase text-[var(--text-muted)]">Budget</span>
                  <span className="text-[13px] font-bold tabular-nums">
                    {neg ? "−" : ""}€{amt.toFixed(0)}
                  </span>
                  <span className="block text-[10px] text-[var(--text-secondary)]">{neg ? "over" : "rest"}</span>
                </div>
              </div>

              <p className="mt-3 text-center text-[10px] text-[var(--text-muted)]">
                Platte boog (hoge ellips); HUD als rij <em>onder</em> de band — minder visuele diepte, meer leesruimte.
              </p>
              <MockStatRings />
            </div>
            <MockIconRail />
          </div>

          <div className="glass-card glass-preserve-decoration mx-auto max-w-lg rounded-xl !p-3 text-center">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Daily quote</p>
            <p className="text-[12px] italic text-[var(--text-primary)]">
              &ldquo;Small moves on a calm morning beat shiny plans at noon.&rdquo;
            </p>
          </div>
          <div className="rounded-full border border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb-deep),0.2)] py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.12em]">
            Start missie
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-secondary)]">Alternatief voor screenshot:</span> minder
            perspectief, bredere &ldquo;runway&rdquo;, metrics als horizontale strook i.p.v. zwevend op de curve.
          </p>
        </div>
      </div>
    </article>
  );
}

export function VisualLabDashboardScreenshotIdeas() {
  return (
    <section className="relative mb-10 w-full space-y-4" aria-labelledby="vl-dash-ss-heading">
      <div>
        <h2 id="vl-dash-ss-heading" className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Dashboard · gebaseerd op huidige scherm
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--text-secondary)]">
          Twee voorstellen die de <span className="font-semibold text-[var(--text-primary)]">zelfde blokken</span> volgen
          als productie: Command-header, mascotte op de halve boog, driedelige statusband, XP/Budget HUD, icon-rail
          rechts, drie stat-rings, quote en primaire CTA — met <span className="font-semibold text-[var(--text-primary)]">nieuwe</span> ring-
          en chip-keuzes.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ScreenshotIdeaDeckParity />
        <ScreenshotIdeaPlatterRunway />
      </div>
    </section>
  );
}

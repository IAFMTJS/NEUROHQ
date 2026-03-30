"use client";

import type { ReactNode } from "react";
import { getMascotSrcForPage } from "@/lib/mascots";
import type { CommanderMascotPedestalStats } from "@/components/commander/CommanderMascotPedestal";

/** Mock stats — zelfde shape als live dashboard-pedestal */
export const VISUAL_LAB_PEDESTAL_MOCK: CommanderMascotPedestalStats = {
  totalXP: 4_620,
  displayLevel: 7,
  budgetRemainingCents: 18_500,
  currency: "EUR",
  energyPct: 72,
  focusPct: 55,
  loadPct: 38,
};

/** Zelfde hoeken als `CommanderMascotPedestal` — Energy | Focus | Load */
const ANGLES = [
  Math.PI + Math.PI / 18,
  (3 * Math.PI) / 4,
  Math.PI / 4,
  -Math.PI / 18,
] as const;

const SWEEP: 0 | 1 = 0;
const CX = 200;
const CY = 8;
/** Centerline radius */
const R = 162;
/** Brede band: dikke annulus rond centerline */
const BAND_INNER = R - 40;
const BAND_OUTER = R + 32;
/** Dikke “trede” voor stroke-gebaseerde vulling op centerline */
const BAND_STROKE = 56;
const MID_STROKE = 50;

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

function annularSlice(
  cx: number,
  cy: number,
  rIn: number,
  rOut: number,
  t0: number,
  t1: number,
): string {
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

/** Scheiding tussen de 3 segmenten (hoeken 1 en 2 op de polylijn). */
function SegmentDividers({
  rIn,
  rOut,
  stroke,
  strokeWidth,
  opacity = 1,
}: {
  rIn: number;
  rOut: number;
  stroke: string;
  strokeWidth: number;
  opacity?: number;
}) {
  const thetas: number[] = [ANGLES[1], ANGLES[2]];
  return (
    <>
      {thetas.map((theta) => {
        const a = polar(CX, CY, rIn, theta);
        const b = polar(CX, CY, rOut, theta);
        return (
          <line
            key={theta}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            opacity={opacity}
          />
        );
      })}
    </>
  );
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

const PATH_LEN = 100;
const E_COLOR = "rgba(34, 211, 238, 0.96)";
const F_COLOR = "rgba(167, 139, 250, 0.97)";
const L_COLOR = "rgba(251, 146, 60, 0.95)";

const squash = { transformOrigin: "200px 64px" as const };
const squashTrans = "translate(0,0) scale(1 0.58)";

/**
 * Mascotte hoger op het podium; brede band eronder.
 */
function MascotStandingOnRing({
  ring,
  ringOverlapClass = "-mb-[min(6rem,34vw)] sm:-mb-[6.65rem]",
}: {
  ring: ReactNode;
  ringOverlapClass?: string;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[min(300px,92vw)] select-none"
      aria-hidden
    >
      <div className={`relative z-[1] w-full ${ringOverlapClass}`}>{ring}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[min(2.45rem,12.5vw)] z-[2] flex justify-center sm:bottom-[min(2.75rem,11vw)]">
        <img
          src={getMascotSrcForPage("dashboard")}
          alt=""
          className="h-[min(9rem,36vw)] max-h-[148px] w-auto max-w-[min(248px,82%)] object-contain object-bottom sm:h-[min(9.75rem,34vw)] sm:max-h-[162px]"
          style={{
            filter:
              "drop-shadow(0 18px 32px rgba(0,0,0,0.58)) drop-shadow(0 0 28px rgba(var(--mode-rgb),0.14))",
          }}
        />
      </div>
    </div>
  );
}

function MetricLegend({ e, f, l }: { e: number; f: number; l: number }) {
  return (
    <div className="mt-3 flex justify-center gap-4 border-t border-[rgba(var(--mode-rgb),0.1)] pt-2.5 text-[9px] font-medium tabular-nums tracking-wide text-[var(--text-muted)]">
      <span className="text-[color-mix(in_srgb,rgb(var(--mode-rgb)),white_22%)]">
        E {Math.round(e)}%
      </span>
      <span className="text-violet-300/85">F {Math.round(f)}%</span>
      <span className="text-[color-mix(in_srgb,var(--hud-amber-500),white_18%)]">
        L {Math.round(l)}%
      </span>
    </div>
  );
}

function LabCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[var(--hud-radius-md)] border border-[rgba(var(--mode-rgb),0.14)] p-4 backdrop-blur-md"
      style={{
        background: "var(--hud-surface-card)",
        boxShadow: "var(--hud-card-rim), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-[var(--hud-radius-md)] opacity-[0.55]"
        style={{ background: "var(--hud-light-top)" }}
        aria-hidden
      />
      <div className="relative mb-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-2.5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-1 text-[10px] leading-snug text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

type RingProps = { stats: CommanderMascotPedestalStats; uid: string };

function pctsOf(stats: CommanderMascotPedestalStats) {
  return [
    clampPct(stats.energyPct),
    clampPct(stats.focusPct),
    clampPct(stats.loadPct),
  ] as const;
}

/** 01 — Drie blokken: brede gevulde wijzers + harde scheiding */
function VariantTriBlock({ stats, uid }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const base = [
    `rgba(var(--mode-rgb),0.14)`,
    `rgba(var(--mode-rgb-deep),0.16)`,
    `rgba(var(--hud-amber-500-rgb),0.13)`,
  ];
  const stroke = [E_COLOR, F_COLOR, L_COLOR];
  const pcts = [e, f, l];
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 198" className="mx-auto block w-full overflow-visible">
          <defs>
            <filter id={`${uid}-blk`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={squashTrans} style={squash}>
            {[0, 1, 2].map((i) => (
              <path
                key={`z-${i}`}
                d={annularSlice(CX, CY, BAND_INNER, BAND_OUTER, ANGLES[i], ANGLES[i + 1])}
                fill={base[i]}
                stroke="rgba(0,0,0,0.35)"
                strokeWidth={1}
              />
            ))}
            <SegmentDividers
              rIn={BAND_INNER + 2}
              rOut={BAND_OUTER - 2}
              stroke="rgba(0,0,0,0.65)"
              strokeWidth={4}
            />
            <SegmentDividers
              rIn={BAND_INNER + 2}
              rOut={BAND_OUTER - 2}
              stroke="rgba(var(--mode-rgb),0.5)"
              strokeWidth={1.25}
              opacity={0.9}
            />
            {paths.map((d, i) => (
              <path
                key={`p-${i}`}
                d={d}
                fill="none"
                stroke={stroke[i]}
                strokeWidth={BAND_STROKE}
                strokeLinecap="butt"
                pathLength={PATH_LEN}
                strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
                filter={`url(#${uid}-blk)`}
              />
            ))}
          </g>
        </svg>
      }
    />
  );
}

/** 02 — Gleuf + slot: donkere kloof tussen de drie banen */
function VariantSlottedLanes({ stats }: RingProps) {
  const pcts = pctsOf(stats);
  const gapRad = 0.055;
  const inner = BAND_INNER + 6;
  const outer = BAND_OUTER - 4;
  const trimEnds = (t0: number, t1: number) => {
    if (t0 > t1) return [t0 - gapRad, t1 + gapRad] as const;
    return [t0 + gapRad, t1 - gapRad] as const;
  };
  const colors = [E_COLOR, F_COLOR, L_COLOR];
  return (
    <MascotStandingOnRing
      ringOverlapClass="-mb-[min(5.95rem,33.5vw)] sm:-mb-[6.5rem]"
      ring={
        <svg viewBox="0 0 400 198" className="mx-auto block w-full overflow-visible">
          <g transform={squashTrans} style={squash}>
            <path
              d={[0, 1, 2]
                .map((i) => annularSlice(CX, CY, inner - 4, outer + 6, ANGLES[i], ANGLES[i + 1]))
                .join(" ")}
              fill="rgba(0,0,0,0.32)"
              stroke="none"
            />
            {[0, 1, 2].map((i) => {
              const [a0, a1] = trimEnds(ANGLES[i], ANGLES[i + 1]);
              const d = annularSlice(CX, CY, inner, outer, a0, a1);
              const pct = pcts[i];
              const arcR = (inner + outer) / 2;
              const p0 = polar(CX, CY, arcR, a0);
              const p1 = polar(CX, CY, arcR, a1);
              const track = `M ${p0.x} ${p0.y} A ${arcR} ${arcR} 0 0 ${SWEEP} ${p1.x} ${p1.y}`;
              const midAng = (a0 + a1) / 2;
              const label = polar(CX, CY, arcR - 8, midAng);
              return (
                <g key={i}>
                  <path d={d} fill="rgba(var(--hud-dark-3-rgb),0.55)" stroke="none" />
                  <path
                    d={track}
                    fill="none"
                    stroke={colors[i]}
                    strokeWidth={MID_STROKE}
                    strokeLinecap="round"
                    pathLength={PATH_LEN}
                    strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                    opacity={0.95}
                  />
                  <text
                    x={label.x}
                    y={label.y + 4}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.35)"
                    fontSize={9}
                    fontWeight={700}
                  >
                    {i === 0 ? "E" : i === 1 ? "F" : "L"}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      }
    />
  );
}

/** 03 — Commander-strip: productie-achtig, brede annulus per derde + rand */
function VariantCommanderStrip({ stats }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const tint = [
    "rgba(34, 211, 238, 0.11)",
    "rgba(167, 139, 250, 0.13)",
    "rgba(251, 146, 60, 0.1)",
  ];
  const pcts = [e, f, l];
  const stroke = [E_COLOR, F_COLOR, L_COLOR];
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 198" className="mx-auto block w-full overflow-visible">
          <g transform={squashTrans} style={squash}>
            {[0, 1, 2].map((i) => (
              <path
                key={`a-${i}`}
                d={annularSlice(CX, CY, BAND_INNER, BAND_OUTER, ANGLES[i], ANGLES[i + 1])}
                fill={tint[i]}
              />
            ))}
            <SegmentDividers
              rIn={BAND_INNER}
              rOut={BAND_OUTER}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={2}
            />
            <path
              d={[0, 1, 2]
                .map((i) => {
                  const a = polar(CX, CY, BAND_OUTER, ANGLES[i]);
                  const b = polar(CX, CY, BAND_OUTER, ANGLES[i + 1]);
                  return `M ${a.x} ${a.y} A ${BAND_OUTER} ${BAND_OUTER} 0 0 ${SWEEP} ${b.x} ${b.y}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(var(--mode-rgb),0.38)"
              strokeWidth={6}
              strokeLinecap="round"
            />
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={stroke[i]}
                strokeWidth={i === 1 ? BAND_STROKE - 6 : BAND_STROKE - 10}
                strokeLinecap="round"
                pathLength={PATH_LEN}
                strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
                style={{
                  filter:
                    "drop-shadow(0 0 10px rgba(var(--mode-rgb),0.35)) drop-shadow(0 0 20px rgba(0,0,0,0.35))",
                }}
              />
            ))}
          </g>
        </svg>
      }
    />
  );
}

/** 04 — Meridian gloed: smalle lichtscheiding + drie donkere vakken */
function VariantMeridianGlow({ stats, uid }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const pcts = [e, f, l];
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 198" className="mx-auto block w-full overflow-visible">
          <defs>
            <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="x" />
              <feMerge>
                <feMergeNode in="x" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform={squashTrans} style={squash}>
            {[0, 1, 2].map((i) => (
              <path
                key={`v-${i}`}
                d={annularSlice(CX, CY, BAND_INNER, BAND_OUTER, ANGLES[i], ANGLES[i + 1])}
                fill="rgba(var(--hud-dark-2-rgb),0.75)"
                stroke="rgba(var(--mode-rgb),0.08)"
                strokeWidth={1}
              />
            ))}
            <SegmentDividers
              rIn={BAND_INNER + 3}
              rOut={BAND_OUTER - 3}
              stroke="rgb(var(--mode-rgb))"
              strokeWidth={2}
              opacity={0.85}
            />
            <SegmentDividers
              rIn={BAND_INNER + 3}
              rOut={BAND_OUTER - 3}
              stroke="white"
              strokeWidth={0.75}
              opacity={0.35}
            />
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR}
                strokeWidth={BAND_STROKE - 8}
                strokeLinecap="round"
                pathLength={PATH_LEN}
                strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
                filter={`url(#${uid}-glow)`}
              />
            ))}
          </g>
        </svg>
      }
    />
  );
}

/** 05 — Tegels: elk derde licht randje (ingelijste tegel) */
function VariantBeveledTiles({ stats }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const pcts = [e, f, l];
  const hi = [
    "rgba(255,255,255,0.12)",
    "rgba(167, 139, 250, 0.1)",
    "rgba(255,255,255,0.08)",
  ];
  return (
    <MascotStandingOnRing
      ringOverlapClass="-mb-[min(5.9rem,33vw)] sm:-mb-[6.45rem]"
      ring={
        <svg viewBox="0 0 400 198" className="mx-auto block w-full overflow-visible">
          <g transform={squashTrans} style={squash}>
            {[0, 1, 2].map((i) => (
              <path
                key={`t-${i}`}
                d={annularSlice(CX, CY, BAND_INNER, BAND_OUTER, ANGLES[i], ANGLES[i + 1])}
                fill="rgba(var(--hud-dark-4-rgb),0.88)"
                stroke={hi[i]}
                strokeWidth={1.5}
              />
            ))}
            <SegmentDividers
              rIn={BAND_INNER + 1}
              rOut={BAND_OUTER - 1}
              stroke="rgba(0,0,0,0.55)"
              strokeWidth={5}
            />
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR}
                strokeWidth={MID_STROKE}
                strokeLinecap="round"
                pathLength={PATH_LEN}
                strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
              />
            ))}
          </g>
        </svg>
      }
    />
  );
}

/** 06 — Omhullende mantel: één buitenrand, binnen drie harde kleurvlakken */
function VariantHullMantle({ stats }: RingProps) {
  const pcts = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const pcts = [e, f, l];
  const fillHue = [
    "rgba(34, 211, 238, 0.2)",
    "rgba(167, 139, 250, 0.22)",
    "rgba(251, 146, 60, 0.18)",
  ];
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 198" className="mx-auto block w-full overflow-visible">
          <g transform={squashTrans} style={squash}>
            {[0, 1, 2].map((i) => (
              <path
                key={`h-${i}`}
                d={annularSlice(CX, CY, BAND_INNER + 8, BAND_OUTER - 2, ANGLES[i], ANGLES[i + 1])}
                fill={fillHue[i]}
              />
            ))}
            <SegmentDividers
              rIn={BAND_INNER + 10}
              rOut={BAND_OUTER - 4}
              stroke="rgba(0,0,0,0.45)"
              strokeWidth={3}
            />
            <path
              d={[0, 1, 2]
                .map((i) => {
                  const a = polar(CX, CY, BAND_OUTER - 2, ANGLES[i]);
                  const b = polar(CX, CY, BAND_OUTER - 2, ANGLES[i + 1]);
                  return `M ${a.x} ${a.y} A ${BAND_OUTER - 2} ${BAND_OUTER - 2} 0 0 ${SWEEP} ${b.x} ${b.y}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(var(--mode-rgb),0.45)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="white"
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.12}
              />
            ))}
            {paths.map((d, i) => (
              <path
                key={`m-${i}`}
                d={d}
                fill="none"
                stroke={i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR}
                strokeWidth={BAND_STROKE - 12}
                strokeLinecap="round"
                pathLength={PATH_LEN}
                strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
              />
            ))}
          </g>
        </svg>
      }
    />
  );
}

const VARIANTS: Array<{
  title: string;
  subtitle: string;
  Cmp: (p: RingProps) => ReactNode;
}> = [
  {
    title: "01 · Tri-block",
    subtitle: "Drie brede vakken, harde scheiding, dikke vooruitgang.",
    Cmp: VariantTriBlock,
  },
  {
    title: "02 · Slotted lanes",
    subtitle: "Zichtbare spleten tussen E / F / L; smalle curve per lane.",
    Cmp: VariantSlottedLanes,
  },
  {
    title: "03 · Commander strip",
    subtitle: "Dicht bij live pedestal: getint per derde + brede strokes.",
    Cmp: VariantCommanderStrip,
  },
  {
    title: "04 · Meridian glow",
    subtitle: "Lichtlijst op de twee grenzen; HUD‑achtige scheiding.",
    Cmp: VariantMeridianGlow,
  },
  {
    title: "05 · Beveled tiles",
    subtitle: "Elk derde als ingelijste tegel met schaduw tussenstuk.",
    Cmp: VariantBeveledTiles,
  },
  {
    title: "06 · Hull mantle",
    subtitle: "Één buitenmantel; binnen drie homogene zones + kernstrip.",
    Cmp: VariantHullMantle,
  },
];

export function VisualLabPedestalHalfRingAlternatives() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
  const [e, f, l] = pctsOf(mock);
  return (
    <section
      className="relative mb-10 w-full space-y-4"
      aria-labelledby="pedestal-half-ring-alts-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="pedestal-half-ring-alts-heading"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]"
          >
            Dashboard · half-ring onder mascotte
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--text-secondary)]">
            Mascotte hoger; <span className="font-semibold text-[var(--text-primary)]">brede band</span>{" "}
            met duidelijke <span className="font-semibold text-[var(--text-primary)]">driedeling</span>{" "}
            (Energy · Focus · Load). Mock: {e}% / {f}% / {l}%.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          6 variants · 3-way + wide
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {VARIANTS.map(({ title, subtitle, Cmp }, i) => (
          <LabCard key={title} title={title} subtitle={subtitle}>
            <Cmp stats={mock} uid={`vl-ped-${i}`} />
            <MetricLegend e={e} f={f} l={l} />
          </LabCard>
        ))}
      </div>
    </section>
  );
}

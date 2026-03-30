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

/** Zelfde hoeken als `CommanderMascotPedestal` (onderste boog, drie segmenten). */
const ANGLES = [
  Math.PI + Math.PI / 18,
  (3 * Math.PI) / 4,
  Math.PI / 4,
  -Math.PI / 18,
] as const;

function polar(cx: number, cy: number, r: number, t: number) {
  return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
}

function segmentPaths(cx: number, cy: number, r: number): string[] {
  const pts = ANGLES.map((t) => polar(cx, cy, r, t));
  return [0, 1, 2].map((i) => {
    const a = pts[i];
    const b = pts[i + 1];
    return `M ${a.x} ${a.y} A ${r} ${r} 0 0 0 ${b.x} ${b.y}`;
  });
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

function MascotStub() {
  return (
    <div className="flex justify-center pb-1">
      <img
        src={getMascotSrcForPage("dashboard")}
        alt=""
        className="pointer-events-none h-[4.5rem] w-auto max-w-[min(200px,55vw)] object-contain object-bottom opacity-[0.97] sm:h-[5.25rem]"
        aria-hidden
      />
    </div>
  );
}

function MetricLegend({ e, f, l }: { e: number; f: number; l: number }) {
  return (
    <div className="mt-2 flex justify-center gap-3 text-[9px] tabular-nums text-[var(--text-muted)]">
      <span className="text-cyan-300/90">E {Math.round(e)}%</span>
      <span className="text-violet-300/90">F {Math.round(f)}%</span>
      <span className="text-amber-300/90">L {Math.round(l)}%</span>
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
    <div className="flex flex-col rounded-2xl border border-[rgba(var(--mode-rgb),0.16)] bg-[rgba(6,16,28,0.72)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
      <div className="mb-3 border-b border-[rgba(var(--mode-rgb),0.1)] pb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-1 text-[10px] leading-snug text-[var(--text-muted)]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

type RingProps = { stats: CommanderMascotPedestalStats };

const PATH_LEN = 100;
const squashStyle = { transformOrigin: "120px 40px" as const };

/** 1 — Drie concentrische bogen: elk segment één kleur, radius verschilt */
function DesignStackedCrescents({ stats }: RingProps) {
  const e = clampPct(stats.energyPct);
  const f = clampPct(stats.focusPct);
  const l = clampPct(stats.loadPct);
  const cx = 120;
  const cy = 6;
  const radii = [88, 74, 60];
  const pcts = [e, f, l];
  const colors = [
    "rgba(34, 211, 238, 0.9)",
    "rgba(167, 139, 250, 0.92)",
    "rgba(251, 146, 60, 0.9)",
  ];
  return (
    <div>
      <MascotStub />
      <svg viewBox="0 0 240 108" className="mx-auto block w-full max-w-[260px]" aria-hidden>
        <defs>
          <filter id="vl-cres-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(0,0) scale(1 0.68)" style={squashStyle}>
          {radii.map((r, ri) => {
            const segs = segmentPaths(cx, cy, r);
            const d = segs[ri];
            const pct = pcts[ri];
            return (
              <path
                key={r}
                d={d}
                fill="none"
                stroke={colors[ri]}
                strokeWidth={5.2 - ri * 0.35}
                strokeLinecap="round"
                pathLength={PATH_LEN}
                strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                opacity={0.65 + ri * 0.1}
                filter="url(#vl-cres-glow)"
              />
            );
          })}
        </g>
      </svg>
      <MetricLegend e={e} f={f} l={l} />
    </div>
  );
}

/** 2 — Holle rail: brede donkere bedding + smallere gekleurde vulling per segment */
function DesignGrooveRail({ stats }: RingProps) {
  const e = clampPct(stats.energyPct);
  const f = clampPct(stats.focusPct);
  const l = clampPct(stats.loadPct);
  const cx = 120;
  const cy = 8;
  const rMid = 82;
  const paths = segmentPaths(cx, cy, rMid);
  const trackW = 22;
  const fillW = 12;
  const pcts = [e, f, l];
  const fills = [
    "rgba(34, 211, 238, 0.88)",
    "rgba(167, 139, 250, 0.9)",
    "rgba(251, 146, 60, 0.88)",
  ];
  return (
    <div>
      <MascotStub />
      <svg viewBox="0 0 240 112" className="mx-auto block w-full max-w-[260px]" aria-hidden>
        <g transform="scale(1 0.7)" style={squashStyle}>
          {paths.map((d, i) => (
            <path
              key={`t-${i}`}
              d={d}
              fill="none"
              stroke="rgba(15,23,42,0.75)"
              strokeWidth={trackW + 8}
              strokeLinecap="round"
            />
          ))}
          {paths.map((d, i) => (
            <path
              key={`f-${i}`}
              d={d}
              fill="none"
              stroke={fills[i]}
              strokeWidth={fillW}
              strokeLinecap="round"
              pathLength={PATH_LEN}
              strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
              style={
                i === 1
                  ? { filter: "drop-shadow(0 0 8px rgba(167, 139, 250, 0.4))" }
                  : undefined
              }
            />
          ))}
        </g>
      </svg>
      <MetricLegend e={e} f={f} l={l} />
    </div>
  );
}

/** 3 — “Bak” onder de mascotte: drie zuilen in een kom-vorm */
function DesignSegmentTray({ stats }: RingProps) {
  const e = clampPct(stats.energyPct) / 100;
  const f = clampPct(stats.focusPct) / 100;
  const l = clampPct(stats.loadPct) / 100;
  const cx = 120;
  const cy = 96;
  const w = 118;
  const h = 40;
  const yTop = cy - h;
  return (
    <div>
      <MascotStub />
      <svg viewBox="0 0 240 118" className="mx-auto block w-full max-w-[260px]" aria-hidden>
        <defs>
          <linearGradient id="vl-tray-v" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(var(--mode-rgb),0.14)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.38)" />
          </linearGradient>
        </defs>
        <path
          d={`M ${cx - w} ${yTop + 6} Q ${cx} ${cy + 18} ${cx + w} ${yTop + 6} L ${cx + w * 0.62} ${cy} L ${cx - w * 0.62} ${cy} Z`}
          fill="url(#vl-tray-v)"
          stroke="rgba(186, 230, 253, 0.2)"
          strokeWidth={1.25}
        />
        {[
          { x: cx - w * 0.72, wd: w * 0.36, c: "rgba(34, 211, 238, 0.52)", p: e },
          { x: cx - w * 0.12, wd: w * 0.36, c: "rgba(167, 139, 250, 0.48)", p: f },
          { x: cx + w * 0.48, wd: w * 0.32, c: "rgba(251, 146, 60, 0.46)", p: l },
        ].map((z, i) => (
          <rect
            key={i}
            x={z.x}
            y={cy - h * z.p}
            width={z.wd}
            height={h * z.p + 1}
            rx={5}
            fill={z.c}
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
          />
        ))}
      </svg>
      <MetricLegend e={e * 100} f={f * 100} l={l * 100} />
    </div>
  );
}

/** 4 — Dunne contour + drie baken-knoppen (grootte ~ pct) op segment-midden */
function DesignBeaconNodes({ stats }: RingProps) {
  const cx = 120;
  const cy = 10;
  const r = 84;
  const mids = [
    (ANGLES[0] + ANGLES[1]) / 2,
    (ANGLES[1] + ANGLES[2]) / 2,
    (ANGLES[2] + ANGLES[3]) / 2,
  ];
  const e = clampPct(stats.energyPct);
  const f = clampPct(stats.focusPct);
  const l = clampPct(stats.loadPct);
  const pcts = [e, f, l];
  const cols = ["#22d3ee", "#a78bfa", "#fb923c"];
  const paths = segmentPaths(cx, cy, r);
  return (
    <div>
      <MascotStub />
      <svg viewBox="0 0 240 110" className="mx-auto block w-full max-w-[260px]" aria-hidden>
        <g transform="scale(1 0.68)" style={squashStyle}>
          <path
            d={paths.join(" ")}
            fill="none"
            stroke="rgba(148, 163, 184, 0.32)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {mids.map((t, i) => {
            const p = polar(cx, cy, r, t);
            const rad = 4 + (pcts[i] / 100) * 10;
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={rad + 5} fill={cols[i]} opacity={0.15} />
                <circle cx={p.x} cy={p.y} r={rad} fill={cols[i]} />
              </g>
            );
          })}
        </g>
      </svg>
      <MetricLegend e={e} f={f} l={l} />
    </div>
  );
}

/** 5 — Één doorlopende gradient-strook als ene pad (samengevoegde boog), drie kleur-stops via masker van drie korte strokes */
function DesignAuroraStrip({ stats }: RingProps) {
  const e = clampPct(stats.energyPct);
  const f = clampPct(stats.focusPct);
  const l = clampPct(stats.loadPct);
  const cx = 120;
  const cy = 8;
  const r = 84;
  const paths = segmentPaths(cx, cy, r);
  const pcts = [e, f, l];
  const strokeW = 14;
  return (
    <div>
      <MascotStub />
      <svg viewBox="0 0 240 112" className="mx-auto block w-full max-w-[260px]" aria-hidden>
        <defs>
          <linearGradient id="vl-aurora" x1="0%" y1="100%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgb(34,211,238)" />
            <stop offset="50%" stopColor="rgb(167,139,250)" />
            <stop offset="100%" stopColor="rgb(251,146,60)" />
          </linearGradient>
        </defs>
        <g transform="scale(1 0.68)" style={squashStyle}>
          <path
            d={paths.join(" ")}
            fill="none"
            stroke="rgba(15,23,42,0.6)"
            strokeWidth={strokeW + 8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {paths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="url(#vl-aurora)"
              strokeWidth={strokeW}
              strokeLinecap="round"
              pathLength={PATH_LEN}
              strokeDasharray={`${(pcts[i] / 100) * PATH_LEN} ${PATH_LEN}`}
              opacity={0.92}
            />
          ))}
        </g>
      </svg>
      <MetricLegend e={e} f={f} l={l} />
    </div>
  );
}

/** 6 — HUD-brackets: hoekige “frame” + drie mini-balken in boog-opstelling */
function DesignBracketHud({ stats }: RingProps) {
  const e = clampPct(stats.energyPct);
  const f = clampPct(stats.focusPct);
  const l = clampPct(stats.loadPct);
  const cx = 120;
  const cy = 78;
  return (
    <div>
      <MascotStub />
      <svg viewBox="0 0 240 100" className="mx-auto block w-full max-w-[260px]" aria-hidden>
        <path
          d={`M 28 52 L 28 84 Q 28 94 38 94 L 88 94 M 152 94 L 202 94 Q 212 94 212 84 L 212 52`}
          fill="none"
          stroke="rgba(186, 230, 253, 0.35)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {[
          { x: 52, pct: e, c: "rgba(34, 211, 238, 0.85)", label: "E" },
          { x: 120, pct: f, c: "rgba(167, 139, 250, 0.88)", label: "F" },
          { x: 188, pct: l, c: "rgba(251, 146, 60, 0.85)", label: "L" },
        ].map((b, i) => {
          const barH = 36 * (b.pct / 100);
          return (
            <g key={i}>
              <rect
                x={b.x - 9}
                y={cy - barH}
                width={18}
                height={barH + 4}
                rx={4}
                fill={b.c}
                opacity={0.35}
              />
              <rect
                x={b.x - 6}
                y={cy - barH}
                width={12}
                height={barH}
                rx={3}
                fill={b.c}
              />
              <text
                x={b.x}
                y={cy + 14}
                textAnchor="middle"
                fill="rgba(148,163,184,0.85)"
                fontSize={9}
                fontWeight={700}
              >
                {b.label}
              </text>
            </g>
          );
        })}
        <ellipse
          cx={cx}
          cy={cy + 10}
          rx={72}
          ry={10}
          fill="rgba(var(--mode-rgb),0.06)"
          stroke="rgba(var(--mode-rgb),0.12)"
          strokeWidth={1}
        />
      </svg>
      <MetricLegend e={e} f={f} l={l} />
    </div>
  );
}

export function VisualLabPedestalHalfRingAlternatives() {
  const mock = VISUAL_LAB_PEDESTAL_MOCK;
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
            Zes alternatieven voor de resource-bocht (Energy / Focus / Load) zoals op het
            dashboard bij{" "}
            <code className="rounded bg-black/30 px-1 text-[10px]">CommanderMascotPedestal</code>
            . Mock: {mock.energyPct}% / {mock.focusPct}% / {mock.loadPct}%.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Visual lab · 6 variants
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <LabCard
          title="01 · Stack crescents"
          subtitle="Drie bogen, elk eigen radius; leest als radarlagen."
        >
          <DesignStackedCrescents stats={mock} />
        </LabCard>
        <LabCard
          title="02 · Groove rail"
          subtitle="Diepe bedding + smalle vulling; high-contrast ‘rail’."
        >
          <DesignGrooveRail stats={mock} />
        </LabCard>
        <LabCard
          title="03 · Segment tray"
          subtitle="Kom-vorm met zuilen; minder cirkel, meer console."
        >
          <DesignSegmentTray stats={mock} />
        </LabCard>
        <LabCard
          title="04 · Beacon nodes"
          subtitle="Contour + knopen; grootte volgt sterkte."
        >
          <DesignBeaconNodes stats={mock} />
        </LabCard>
        <LabCard
          title="05 · Aurora strip"
          subtitle="Gradient langs de boog; productie-segmenten als mask."
        >
          <DesignAuroraStrip stats={mock} />
        </LabCard>
        <LabCard
          title="06 · Bracket HUD"
          subtitle="Hoekige HUD + verticale meters; sci‑fi display."
        >
          <DesignBracketHud stats={mock} />
        </LabCard>
      </div>
    </section>
  );
}

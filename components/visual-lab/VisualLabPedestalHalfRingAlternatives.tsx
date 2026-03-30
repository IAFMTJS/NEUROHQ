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

/** Zelfde hoeken als `CommanderMascotPedestal` (onderste boog · Energy | Focus | Load). */
const ANGLES = [
  Math.PI + Math.PI / 18,
  (3 * Math.PI) / 4,
  Math.PI / 4,
  -Math.PI / 18,
] as const;

const SWEEP: 0 | 1 = 0;
const CX = 200;
const CY = 8;
const R = 162;

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

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

const PATH_LEN = 100;
const E_COLOR = "rgba(34, 211, 238, 0.95)";
const F_COLOR = "rgba(167, 139, 250, 0.96)";
const L_COLOR = "rgba(251, 146, 60, 0.94)";

/**
 * Mascotte staat op de boog: voeten raken het middensegment (Focus), ring in de laag erachter.
 * `ringOverlapClass` tune per variant (dikte van de band verschilt).
 */
function MascotStandingOnRing({
  ring,
  ringOverlapClass = "-mb-[min(5.25rem,30vw)] sm:-mb-[5.75rem]",
}: {
  ring: ReactNode;
  ringOverlapClass?: string;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[min(300px,92vw)] select-none"
      aria-hidden
    >
      <div
        className={`relative z-[1] w-full ${ringOverlapClass}`}
      >
        {ring}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[min(1.35rem,7vw)] z-[2] flex justify-center sm:bottom-[min(1.5rem,6vw)]">
        <img
          src={getMascotSrcForPage("dashboard")}
          alt=""
          className="h-[min(8.75rem,34vw)] max-h-[140px] w-auto max-w-[min(240px,78%)] object-contain object-bottom sm:h-[min(9.5rem,32vw)] sm:max-h-[152px]"
          style={{
            filter:
              "drop-shadow(0 16px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 24px rgba(var(--mode-rgb),0.12))",
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
        <p className="mt-1 text-[10px] leading-snug text-[var(--text-secondary)]">
          {subtitle}
        </p>
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

/** 01 — Glazen podium: gevulde band + mode-rgb rand (dicht bij productie, compacter) */
function VariantGlassPodium({ stats, uid }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const inner = R - 20;
  const outer = R + 14;
  const fills = [
    `rgba(var(--mode-rgb),${0.07 + e * 0.0004})`,
    `rgba(var(--mode-rgb-deep),${0.09 + f * 0.00035})`,
    `rgba(var(--hud-amber-500-rgb),${0.08 + l * 0.0003})`,
  ];
  return (
    <MascotStandingOnRing
      ringOverlapClass="-mb-[min(5rem,29vw)] sm:-mb-[5.5rem]"
      ring={
        <svg
          viewBox="0 0 400 190"
          className="mx-auto block w-full overflow-visible"
        >
          <defs>
            <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(0,0) scale(1 0.58)" style={{ transformOrigin: "200px 64px" }}>
            {[0, 1, 2].map((i) => {
              const d = annularSlice(CX, CY, inner, outer, ANGLES[i], ANGLES[i + 1]);
              return (
                <path
                  key={`b-${i}`}
                  d={d}
                  fill={fills[i]}
                  stroke="rgba(var(--mode-rgb),0.12)"
                  strokeWidth={1}
                  filter={`url(#${uid}-soft)`}
                />
              );
            })}
            {paths.map((d, i) => {
              const pct = [e, f, l][i];
              const stroke = i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR;
              const w = i === 1 ? 40 : 32;
              return (
                <path
                  key={`s-${i}`}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={w}
                  strokeLinecap="round"
                  pathLength={PATH_LEN}
                  strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                  style={{
                    filter:
                      i === 1
                        ? "drop-shadow(0 0 10px rgba(var(--mode-rgb),0.45)) drop-shadow(0 0 18px rgba(var(--mode-rgb),0.2))"
                        : "drop-shadow(0 0 8px rgba(0,0,0,0.35))",
                  }}
                />
              );
            })}
            <path
              d={[0, 1, 2]
                .map((i) => {
                  const a = polar(CX, CY, outer, ANGLES[i]);
                  const b = polar(CX, CY, outer, ANGLES[i + 1]);
                  return `M ${a.x} ${a.y} A ${outer} ${outer} 0 0 ${SWEEP} ${b.x} ${b.y}`;
                })
                .join(" ")}
              fill="none"
              stroke="rgba(var(--mode-rgb),0.35)"
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.65}
            />
          </g>
        </svg>
      }
    />
  );
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

/** 02 — Command neon: scherpe dubbele rand, HUD-glow */
function VariantCommandNeon({ stats, uid }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 190" className="mx-auto block w-full overflow-visible">
          <defs>
            <linearGradient id={`${uid}-nx`} x1="0%" y1="100%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--mode-rgb))" stopOpacity={0.55} />
              <stop offset="50%" stopColor="rgb(var(--mode-rgb-deep))" stopOpacity={0.7} />
              <stop offset="100%" stopColor="rgb(var(--mode-rgb))" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <g transform="translate(0,0) scale(1 0.58)" style={{ transformOrigin: "200px 64px" }}>
            <path
              d={paths.join(" ")}
              fill="none"
              stroke={`url(#${uid}-nx)`}
              strokeWidth={26}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.22}
            />
            {paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke="rgba(0,0,0,0.55)"
                strokeWidth={18}
                strokeLinecap="round"
              />
            ))}
            {paths.map((d, i) => {
              const pct = [e, f, l][i];
              const stroke = i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR;
              return (
                <path
                  key={`f-${i}`}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={11}
                  strokeLinecap="round"
                  pathLength={PATH_LEN}
                  strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(var(--mode-rgb),0.4)) drop-shadow(0 0 16px rgba(var(--mode-rgb),0.15))",
                  }}
                />
              );
            })}
          </g>
        </svg>
      }
    />
  );
}

/** 03 — Inset deck: diepte + inner shadow (gegraveerde boog) */
function VariantInsetDeck({ stats }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  return (
    <MascotStandingOnRing
      ringOverlapClass="-mb-[min(5.1rem,29vw)] sm:-mb-[5.6rem]"
      ring={
        <div
          className="mx-auto rounded-[var(--hud-radius-lg)] pt-2"
          style={{ boxShadow: "var(--hud-depth-inset)" }}
        >
          <svg viewBox="0 0 400 176" className="mx-auto block w-full overflow-visible">
            <g transform="translate(0,0) scale(1 0.56)" style={{ transformOrigin: "200px 60px" }}>
              <path
                d={paths.join(" ")}
                fill="none"
                stroke="rgba(var(--hud-dark-3-rgb),0.9)"
                strokeWidth={44}
                strokeLinecap="round"
              />
              {paths.map((d, i) => {
                const pct = [e, f, l][i];
                const stroke = i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR;
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={15}
                    strokeLinecap="round"
                    pathLength={PATH_LEN}
                    strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                    opacity={0.88}
                  />
                );
              })}
            </g>
          </svg>
        </div>
      }
    />
  );
}

/** 04 — Spotlight: zachte vlek onder voeten + subtiele boog */
function VariantSpotlit({ stats, uid }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 200" className="mx-auto block w-full overflow-visible">
          <defs>
            <radialGradient id={`${uid}-spot`} cx="50%" cy="42%" r="55%">
              <stop offset="0%" stopColor="rgba(var(--mode-rgb),0.35)" />
              <stop offset="55%" stopColor="rgba(var(--mode-rgb-deep),0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <ellipse cx={200} cy={118} rx={138} ry={36} fill={`url(#${uid}-spot)`} opacity={0.85} />
          <g transform="translate(0,0) scale(1 0.58)" style={{ transformOrigin: "200px 70px" }}>
            {paths.map((d, i) => (
              <path
                key={`g-${i}`}
                d={d}
                fill="none"
                stroke="rgba(var(--mode-rgb),0.15)"
                strokeWidth={28}
                strokeLinecap="round"
              />
            ))}
            {paths.map((d, i) => {
              const pct = [e, f, l][i];
              const stroke = i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR;
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={12}
                  strokeLinecap="round"
                  pathLength={PATH_LEN}
                  strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                  opacity={0.92}
                />
              );
            })}
          </g>
        </svg>
      }
    />
  );
}

/** 05 — Ultra-minimaal: één band, mode-rgb alleen in middenaccent */
function VariantMinimalTread({ stats }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  return (
    <MascotStandingOnRing
      ringOverlapClass="-mb-[min(4.85rem,28vw)] sm:-mb-[5.35rem]"
      ring={
        <svg viewBox="0 0 400 184" className="mx-auto block w-full overflow-visible">
          <g transform="translate(0,0) scale(1 0.56)" style={{ transformOrigin: "200px 62px" }}>
            <path
              d={paths.join(" ")}
              fill="none"
              stroke="rgba(var(--mode-rgb),0.2)"
              strokeWidth={8}
              strokeLinecap="round"
            />
            {paths.map((d, i) => {
              const pct = [e, f, l][i];
              const stroke =
                i === 1 ? "rgb(var(--mode-rgb))" : i === 0 ? E_COLOR : L_COLOR;
              return (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={5}
                  strokeLinecap="round"
                  pathLength={PATH_LEN}
                  strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                  opacity={i === 1 ? 1 : 0.85}
                />
              );
            })}
          </g>
        </svg>
      }
    />
  );
}

/** 06 — Elevated plate: elliptisch platform + boog als opstaande rand */
function VariantElevatedPlate({ stats, uid }: RingProps) {
  const [e, f, l] = pctsOf(stats);
  const paths = segmentPaths(CX, CY, R);
  const gid = `${uid}-plate`;
  return (
    <MascotStandingOnRing
      ring={
        <svg viewBox="0 0 400 210" className="mx-auto block w-full overflow-visible">
          <defs>
            <linearGradient id={gid} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="rgba(var(--mode-rgb),0.18)" />
              <stop offset="100%" stopColor="rgb(var(--hud-dark-4-rgb))" stopOpacity={0.85} />
            </linearGradient>
          </defs>
          <ellipse
            cx={200}
            cy={138}
            rx={152}
            ry={28}
            fill={`url(#${gid})`}
            stroke="rgba(var(--mode-rgb),0.22)"
            strokeWidth={1}
            style={{ filter: "var(--hud-glow-subtle)" }}
          />
          <g transform="translate(0,6) scale(1 0.58)" style={{ transformOrigin: "200px 64px" }}>
            {paths.map((d, i) => (
              <path
                key={`bk-${i}`}
                d={d}
                fill="none"
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={22}
                strokeLinecap="round"
                opacity={0.6}
              />
            ))}
            {paths.map((d, i) => {
              const pct = [e, f, l][i];
              const stroke = i === 0 ? E_COLOR : i === 1 ? F_COLOR : L_COLOR;
              return (
                <path
                  key={`fr-${i}`}
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={10}
                  strokeLinecap="round"
                  pathLength={PATH_LEN}
                  strokeDasharray={`${(pct / 100) * PATH_LEN} ${PATH_LEN}`}
                />
              );
            })}
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
    title: "01 · Glass podium",
    subtitle: "HUD-glas, mode-rgb basis, voeten op het middensegment.",
    Cmp: VariantGlassPodium,
  },
  {
    title: "02 · Command neon",
    subtitle: "Dubbele rand + stack-glow, strak commander‑hub.",
    Cmp: VariantCommandNeon,
  },
  {
    title: "03 · Inset deck",
    subtitle: "Diepte-inzet; boog als gleuf in het paneel.",
    Cmp: VariantInsetDeck,
  },
  {
    title: "04 · Spotlight",
    subtitle: "Zachte nebula-vlek onder de mascotte, cinema‑HUD.",
    Cmp: VariantSpotlit,
  },
  {
    title: "05 · Minimal tread",
    subtitle: "Dunne mode-rgb contour; rustig dashboard.",
    Cmp: VariantMinimalTread,
  },
  {
    title: "06 · Elevated plate",
    subtitle: "Elliptisch voetstuk + boog als rand — letterlijk ‘op de ring’.",
    Cmp: VariantElevatedPlate,
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
            Nieuwe richting: de mascotte{" "}
            <span className="font-semibold text-[var(--text-primary)]">staat op</span>{" "}
            de boog — voeten op het middensegment (Focus), Energy links, Load
            rechts. Styling sluit aan bij HUD-tokens (
            <code className="rounded bg-black/30 px-1 text-[10px]">--hud-surface-card</code>,{" "}
            <code className="rounded bg-black/30 px-1 text-[10px]">--mode-rgb</code>, rims).
            Mock: {e}% / {f}% / {l}%.
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          6 variants · stand-on-ring
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

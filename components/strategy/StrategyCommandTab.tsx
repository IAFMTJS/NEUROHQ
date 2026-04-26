import type { QuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import {
  buildPillarCardModel,
  getPillarFeedbackStatus,
} from "@/lib/strategy/command-pillar-summaries";
import type { PillarCardModel } from "@/lib/strategy/command-pillar-summaries";
import {
  EXECUTION_BEHAVIOR_LABELS_NL,
  normalizeExecutionBehaviorFocus,
} from "@/lib/strategy/execution-behavior";

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

/** Annular sector in SVG coords (0° = right, clockwise); we pass standard math angles from top = -90°. */
function annularSectorPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startDeg: number,
  endDeg: number
) {
  const a1 = deg2rad(startDeg);
  const a2 = deg2rad(endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  const x0 = cx + rInner * Math.cos(a1);
  const y0 = cy + rInner * Math.sin(a1);
  const x1 = cx + rOuter * Math.cos(a1);
  const y1 = cy + rOuter * Math.sin(a1);
  const x2 = cx + rOuter * Math.cos(a2);
  const y2 = cy + rOuter * Math.sin(a2);
  const x3 = cx + rInner * Math.cos(a2);
  const y3 = cy + rInner * Math.sin(a2);
  return `M ${x0} ${y0} L ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x0} ${y0} Z`;
}

function pillarStatusClass(committed: boolean, pct: number) {
  if (!committed) return "bg-[var(--text-muted)]/45";
  if (pct >= 80) return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]";
  if (pct >= 60) return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.35)]";
  return "bg-red-500/90 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
}

type PillarKey = "budget" | "growth" | "xp" | "discipline";

type PillarSlice = {
  key: PillarKey;
  label: string;
  pct: number;
  committed: boolean;
};

/**
 * Vaste kleur per pijler — hogere chroma + radial gradient op de top-layer voor minder “matte vlakken”.
 * (Glow-lagen blijven effen op de randkleur zodat de halo scherp blijft.)
 */
const PILLAR_PROGRESS_RGB: Record<PillarKey, { r: number; g: number; b: number }> = {
  budget: { r: 255, g: 77, b: 90 },
  growth: { r: 0, g: 232, b: 168 },
  xp: { r: 0, g: 220, b: 255 },
  discipline: { r: 255, g: 200, b: 56 },
};

/** Binnenste highlight in de gradient (lichter, iets meer luminantie). */
const PILLAR_PIE_GRADIENT_INNER: Record<PillarKey, string> = {
  budget: "#ff9ea8",
  growth: "#5dffd4",
  xp: "#9af6ff",
  discipline: "#fff3a3",
};

const PILLAR_PIE_GRADIENT_OUTER: Record<PillarKey, string> = {
  budget: "#ff4d5a",
  growth: "#00e8a8",
  xp: "#00dcff",
  discipline: "#ffc838",
};

const PILLAR_TRACK_FILL = "rgba(148, 163, 184, 0.22)";
const PILLAR_UNCOMMITTED_TRACK = "rgba(82, 96, 118, 0.35)";

/** Legenda / swatch: toon pijlerkleur met intensiteit ~ voortgang. */
function pillarLegendSwatch(key: PillarKey, committed: boolean, pct: number): string {
  if (!committed) return PILLAR_UNCOMMITTED_TRACK;
  const t = Math.max(0, Math.min(1, pct / 100));
  const { r, g, b } = PILLAR_PROGRESS_RGB[key];
  const alpha = 0.4 + 0.52 * t;
  return `rgba(${r},${g},${b},${alpha})`;
}

function pillarProgressFillSolid(key: PillarKey): string {
  const { r, g, b } = PILLAR_PROGRESS_RGB[key];
  return `rgba(${r},${g},${b},0.98)`;
}

/** Tube-style glow per segment (CSS fallback + reference for tuning). */
const PILLAR_SEGMENT_GLOW: Record<PillarKey, string> = {
  budget: "rgba(255, 77, 90, 0.82)",
  growth: "rgba(0, 232, 168, 0.78)",
  xp: "rgba(0, 220, 255, 0.8)",
  discipline: "rgba(255, 200, 56, 0.76)",
};

function QuarterCommandOverview({
  scorePct,
  pillars,
}: {
  scorePct: number;
  pillars: PillarSlice[];
}) {
  const vb = 176;
  const cx = vb / 2;
  const cy = vb / 2;
  const rOuter = 78;
  const rInner = 42;
  const gapDeg = 4;
  const slot = 90;
  /** Clockwise from top (12u): top → right → bottom → left. */
  const baseStarts = [-135, -45, 45, 135].map((deg) => deg + gapDeg / 2);

  const p = Math.max(0, Math.min(100, Math.round(scorePct)));

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-visible sm:max-w-[320px]">
        <div
          className="pointer-events-none absolute inset-[-28px] rounded-full bg-[radial-gradient(circle_at_50%_42%,rgba(var(--mode-rgb),0.28),transparent_62%)] blur-[18px] sm:blur-[6px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.38),transparent_72%)]"
          aria-hidden
        />
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${vb} ${vb}`}
          className="relative overflow-visible drop-shadow-[0_0_32px_rgba(var(--mode-rgb),0.32),0_0_56px_rgba(var(--mode-rgb),0.14)]"
          role="img"
          aria-label={`Kwartaal contractscore ${p} procent`}
        >
          <defs>
            {/** Wide colored halo (segment fill color → blurred); stronger than thin CSS drop-shadow on paths. */}
            <filter id="strat-quarter-pie-neon-halo" x="-90%" y="-90%" width="280%" height="280%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.78 0"
                result="s"
              />
              <feMerge>
                <feMergeNode in="s" />
              </feMerge>
            </filter>
            <filter id="strat-quarter-pie-bloom" x="-55%" y="-55%" width="210%" height="210%">
              <feGaussianBlur stdDeviation="3.4" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.62 0"
                result="s"
              />
              <feMerge>
                <feMergeNode in="s" />
              </feMerge>
            </filter>
            {(Object.keys(PILLAR_PIE_GRADIENT_OUTER) as PillarKey[]).map((key) => (
              <radialGradient
                key={key}
                id={`strat-quarter-pie-radial-${key}`}
                gradientUnits="userSpaceOnUse"
                cx={cx}
                cy={cy}
                r={rOuter}
              >
                <stop offset="0%" stopColor={PILLAR_PIE_GRADIENT_INNER[key]} />
                <stop offset="72%" stopColor={PILLAR_PIE_GRADIENT_OUTER[key]} />
                <stop offset="100%" stopColor={PILLAR_PIE_GRADIENT_OUTER[key]} />
              </radialGradient>
            ))}
          </defs>
          {pillars.map((pl, i) => {
            const start = baseStarts[i];
            const segEnd = start + slot - gapDeg;
            const trackFill = pl.committed ? PILLAR_TRACK_FILL : PILLAR_UNCOMMITTED_TRACK;
            return (
              <path
                key={`${pl.key}-track`}
                d={annularSectorPath(cx, cy, rInner, rOuter, start, segEnd)}
                fill={trackFill}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1.15"
                paintOrder="stroke fill"
              />
            );
          })}
          {pillars.map((pl, i) => {
            if (!pl.committed) return null;
            const start = baseStarts[i];
            const fullSpan = slot - gapDeg;
            const t = Math.max(0, Math.min(100, pl.pct)) / 100;
            if (t <= 0) return null;
            const filledEnd = start + fullSpan * t;
            const fillGlow = pillarProgressFillSolid(pl.key);
            const fillTop = `url(#strat-quarter-pie-radial-${pl.key})`;
            const glow = PILLAR_SEGMENT_GLOW[pl.key];
            const d = annularSectorPath(cx, cy, rInner, rOuter, start, filledEnd);
            return (
              <g key={pl.key}>
                <path
                  d={d}
                  fill={fillGlow}
                  fillOpacity={0.48}
                  filter="url(#strat-quarter-pie-neon-halo)"
                  aria-hidden
                />
                <path
                  d={d}
                  fill={fillGlow}
                  fillOpacity={0.62}
                  filter="url(#strat-quarter-pie-bloom)"
                  aria-hidden
                />
                <path
                  d={d}
                  fill={fillTop}
                  fillOpacity={1}
                  stroke="rgba(255,255,255,0.46)"
                  strokeWidth="1.08"
                  paintOrder="stroke fill"
                  style={{
                    filter: `drop-shadow(0 0 3px ${glow}) drop-shadow(0 0 12px ${glow}) drop-shadow(0 0 22px ${glow}) drop-shadow(0 0 36px ${glow})`,
                  }}
                />
              </g>
            );
          })}
          <circle
            cx={cx}
            cy={cy}
            r={rInner - 2.5}
            fill="rgba(6,10,18,0.96)"
            stroke="rgba(var(--mode-rgb),0.38)"
            strokeWidth="1.35"
            style={{ filter: "drop-shadow(0 0 8px rgba(var(--mode-rgb),0.32)) drop-shadow(0 0 2px rgba(var(--mode-rgb),0.45))" }}
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="font-mono text-4xl font-bold tabular-nums text-[var(--text-primary)] drop-shadow-[0_0_14px_rgba(var(--mode-rgb),0.35),0_0_4px_rgba(var(--mode-rgb),0.2)] sm:text-5xl">
            {p}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90 drop-shadow-[0_0_8px_rgba(var(--mode-rgb),0.22)]">
            contract
          </span>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:gap-3" aria-label="Pijlers in het kwartaaloverzicht">
        {pillars.map((pl) => (
          <li
            key={pl.key}
            className="flex items-center gap-2 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[var(--bg-card)]/80 px-2.5 py-2 sm:px-3"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${pillarStatusClass(pl.committed, pl.pct)}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                {pl.label}
              </p>
              <p className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                {pl.committed ? `${pl.pct}%` : "—"}
              </p>
            </div>
            <span
              className="h-4 w-4 shrink-0 rounded-sm border border-[rgba(var(--mode-rgb),0.2)]"
              style={{ background: pillarLegendSwatch(pl.key, pl.committed, pl.pct) }}
              title={pl.committed ? `${pl.label}: ${pl.pct}%` : pl.label}
              aria-hidden
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bar({
  label,
  pct,
  committed,
  sub,
}: {
  label: string;
  pct: number;
  committed: boolean;
  sub: string;
}) {
  const w = committed ? Math.max(0, Math.min(100, pct)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
        <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
          {committed ? `${pct}%` : "—"}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-primary)]/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb-deep),0.85)] to-[var(--semantic-accent)] transition-[width] duration-500"
          style={{ width: `${w}%` }}
        />
      </div>
      <p className="text-[10px] leading-snug text-[var(--text-muted)]">{sub}</p>
    </div>
  );
}

function PillarInsightCard({
  label,
  pct,
  committed,
  model,
}: {
  label: string;
  pct: number;
  committed: boolean;
  model: PillarCardModel;
}) {
  const status = getPillarFeedbackStatus(committed, pct);
  const cardRing =
    status.tone === "strong"
      ? "border-emerald-500/40 shadow-[0_0_0_1px_rgba(16,185,129,0.12),0_8px_28px_rgba(0,0,0,0.2)]"
      : status.tone === "ok"
        ? "border-amber-400/35 shadow-[0_0_0_1px_rgba(251,191,36,0.1),0_8px_28px_rgba(0,0,0,0.18)]"
        : status.tone === "warn"
          ? "border-orange-500/45 shadow-[0_0_0_1px_rgba(249,115,22,0.14),0_8px_28px_rgba(0,0,0,0.22)]"
          : "border-[var(--card-border)] shadow-[0_0_20px_rgba(0,0,0,0.04)]";
  const badgeClass =
    status.tone === "strong"
      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"
      : status.tone === "ok"
        ? "border-amber-400/45 bg-amber-500/12 text-amber-100"
        : status.tone === "warn"
          ? "border-orange-400/50 bg-orange-500/15 text-orange-100"
          : "border-[rgba(var(--mode-rgb),0.25)] bg-[rgba(var(--mode-rgb-deep),0.2)] text-[var(--text-secondary)]";

  return (
    <section
      className={`flex flex-col gap-4 rounded-xl border-2 bg-[var(--bg-elevated)]/90 p-4 sm:p-5 ${cardRing}`}
      aria-label={`Feedback ${label}`}
    >
      <div className="flex flex-col gap-3 border-b border-[rgba(var(--mode-rgb),0.12)] pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</h3>
          <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">{status.hint}</p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="text-left sm:text-right">
            <p className="font-mono text-2xl font-bold tabular-nums text-[var(--text-primary)] sm:text-3xl">
              {committed ? `${pct}%` : "—"}
            </p>
            <p className="text-[9px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Pijlerscore</p>
          </div>
          <span
            className={`inline-flex w-fit items-center justify-center rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium leading-relaxed text-[var(--text-secondary)]">{model.summary}</p>
        <p className="text-[10px] leading-snug text-[var(--text-muted)]">{model.scoreLine}</p>
      </div>

      <div className="rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(var(--mode-rgb-deep),0.06)] px-3 py-2.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--semantic-accent)]">
          Cijfers dit kwartaal
        </p>
        <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] leading-snug text-[var(--text-secondary)]">
          {model.dataLines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div
          role="region"
          aria-label="Wat goed gaat"
          className="rounded-xl border-2 border-emerald-500/45 bg-[linear-gradient(165deg,rgba(6,40,28,0.35),rgba(15,23,42,0.55))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/20 text-sm font-bold text-emerald-200"
              aria-hidden
            >
              ✓
            </span>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-100">Wat goed gaat</p>
          </div>
          {model.goodPoints.length > 0 ? (
            <ul className="space-y-2 text-[11px] leading-snug text-emerald-50/95">
              {model.goodPoints.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
                    ·
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] leading-relaxed text-emerald-200/70">
              Nog geen harde pluspunten in de data. Blijf loggen — zodra er beweging is, verschijnt die hier.
            </p>
          )}
        </div>

        <div
          role="region"
          aria-label="Aandacht en verbeterplekken"
          className={
            status.tone === "neutral"
              ? "rounded-xl border-2 border-violet-500/35 bg-[linear-gradient(165deg,rgba(46,16,101,0.25),rgba(15,23,42,0.55))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              : "rounded-xl border-2 border-amber-500/50 bg-[linear-gradient(165deg,rgba(60,35,6,0.4),rgba(15,23,42,0.55))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          }
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                status.tone === "neutral"
                  ? "border-violet-400/40 bg-violet-500/20 text-violet-200"
                  : "border-amber-400/45 bg-amber-500/20 text-amber-200"
              }`}
              aria-hidden
            >
              !
            </span>
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.12em] ${
                status.tone === "neutral" ? "text-violet-100" : "text-amber-100"
              }`}
            >
              {status.tone === "neutral" ? "Aandacht: eerst meten" : "Aandacht & verbeterplek"}
            </p>
          </div>
          {model.badPoints.length > 0 ? (
            <ul
              className={`space-y-2 text-[11px] leading-snug ${
                status.tone === "neutral" ? "text-violet-50/95" : "text-amber-50/95"
              }`}
            >
              {model.badPoints.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span
                    className={status.tone === "neutral" ? "mt-0.5 shrink-0 text-violet-300" : "mt-0.5 shrink-0 text-amber-400"}
                    aria-hidden
                  >
                    ·
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p
              className={`text-[11px] leading-relaxed ${
                status.tone === "neutral"
                  ? "text-violet-200/75"
                  : "text-amber-200/80"
              }`}
            >
              {status.tone === "neutral"
                ? "Zonder contractdoel of data kunnen we hier geen verbeterpunten tonen — richt je eerst op Contract en dagelijks loggen."
                : "Geen extra rode vlaggen in deze dataset. Hou dit tempo vast en blijf signalen volgen."}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

type Props = {
  snapshot: QuarterEngineSnapshot | null;
};

export function StrategyCommandTab({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/60 p-6 text-sm text-[var(--text-muted)]">
        Geen kwartaal-command beschikbaar. Controleer je actieve strategie en contract op het tabblad Contract.
      </div>
    );
  }

  const pct = snapshot.strategyScorePct;
  const execFocus = normalizeExecutionBehaviorFocus(snapshot.engineParams.execution?.behaviorFocus);
  const execMeta = EXECUTION_BEHAVIOR_LABELS_NL[execFocus];

  const bars = [
    {
      key: "budget" as const,
      label: "Spaardoel",
      pct: snapshot.budget.displayPct,
      committed: snapshot.budget.committed,
      sub: "Kwartaal t.o.v. spaarcommitment in contract",
    },
    {
      key: "growth" as const,
      label: "Leerdoel",
      pct: snapshot.growth.displayPct,
      committed: snapshot.growth.committed,
      sub: "Kwartaal: protocoltaken + leer-% uit contract",
    },
    {
      key: "xp" as const,
      label: "XP-doel",
      pct: snapshot.xp.displayPct,
      committed: snapshot.xp.committed,
      sub: "Kwartaal-XP t.o.v. doel in contract",
    },
    {
      key: "discipline" as const,
      label: execFocus === "balanced" ? "Executie & gedrag" : `${execMeta.title} (executie)`,
      pct: snapshot.discipline.displayPct,
      committed: snapshot.discipline.committed,
      sub: execMeta.measure,
    },
  ];

  const pillarSlices: PillarSlice[] = bars.map((b) => ({
    key: b.key,
    label: b.label,
    pct: b.pct,
    committed: b.committed,
  }));

  return (
    <div className="space-y-6">
      <section
        className="card-simple p-5 sm:p-6"
        aria-label="Command"
      >
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">
          Kwartaal · {snapshot.quarterLabel}
        </p>
        <div className="mt-4">
          <QuarterCommandOverview scorePct={pct} pillars={pillarSlices} />
        </div>
        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Totaalscore over de vier contractpijlers (elk 25% in de engine).
        </p>

        <div className="mt-8 space-y-5 border-t border-[rgba(var(--mode-rgb),0.12)] pt-6">
          {bars.map((b) => (
            <Bar key={b.key} label={b.label} pct={b.pct} committed={b.committed} sub={b.sub} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {bars.map((b) => (
          <PillarInsightCard
            key={b.key}
            label={b.label}
            pct={b.pct}
            committed={b.committed}
            model={buildPillarCardModel(snapshot, b.key)}
          />
        ))}
      </div>

      {snapshot.ruleLinesNl.length > 0 ? (
        <section className="card-simple p-4">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--semantic-accent)]">
            Engine-regels actief
          </h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-[var(--text-secondary)]">
            {snapshot.ruleLinesNl.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

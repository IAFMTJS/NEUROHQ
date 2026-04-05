import type { QuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { formatCents } from "@/lib/utils/currency";
import {
  EXECUTION_BEHAVIOR_LABELS_NL,
  normalizeExecutionBehaviorFocus,
} from "@/lib/strategy/execution-behavior";

function RingScore({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44">
      <svg className="-rotate-90" width="160" height="160" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(var(--mode-rgb),0.12)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--semantic-accent) 85%, transparent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-3xl font-bold tabular-nums text-[var(--text-primary)] sm:text-4xl">{p}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">contract</span>
      </div>
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

function analysisNl(
  snapshot: QuarterEngineSnapshot,
  key: "budget" | "growth" | "xp" | "discipline"
): string {
  const ep = snapshot.engineParams;
  const p = snapshot[key];
  if (!p.committed && key !== "discipline") {
    return "Geen expliciet doel in je contract voor deze pijler — de engine gebruikt een neutrale aanname.";
  }
  if (key === "budget") {
    const t = ep.savings.quarterlyMustSaveCents;
    return t != null && t > 0
      ? `Doel: ${formatCents(t)} dit kwartaal. Voortgang: ${p.displayPct}% van je spaarcommitment.`
      : "Spaardoel niet gezet.";
  }
  if (key === "growth") {
    const tgt = ep.growth.quarterlyLearningProgressTargetPct;
    return tgt != null && tgt > 0
      ? `Doel: ${tgt}% leerprogress dit kwartaal. Huidige richting: ${p.displayPct}%.`
      : "Leerdoel niet gezet.";
  }
  if (key === "xp") {
    const tgt = ep.xp.quarterlyTargetXpEarned;
    return tgt != null && tgt > 0
      ? `Doel: ${tgt} XP verdiend dit kwartaal. Nu op ${p.displayPct}% richting dat doel.`
      : "XP-doel niet gezet.";
  }
  const focus = normalizeExecutionBehaviorFocus(ep.execution?.behaviorFocus);
  const meta = EXECUTION_BEHAVIOR_LABELS_NL[focus];
  return `${meta.title}: ${meta.measure} Huidige score-indicator: ${p.displayPct}%.`;
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
      sub: "Voortgang t.o.v. kwartaal-spaardoel",
    },
    {
      key: "growth" as const,
      label: "Leerdoel",
      pct: snapshot.growth.displayPct,
      committed: snapshot.growth.committed,
      sub: snapshot.growthProtocolWeek
        ? `Protocol week ${snapshot.growthProtocolWeek.weekIndex}: ${snapshot.growthProtocolWeek.completed}/${snapshot.growthProtocolWeek.expected} taken`
        : "Leertraject / protocol vs kwartaaldoel",
    },
    {
      key: "xp" as const,
      label: "XP-doel",
      pct: snapshot.xp.displayPct,
      committed: snapshot.xp.committed,
      sub: "XP verdiend dit kwartaal vs doel",
    },
    {
      key: "discipline" as const,
      label: execFocus === "balanced" ? "Executie & gedrag" : `${execMeta.title} (executie)`,
      pct: snapshot.discipline.displayPct,
      committed: snapshot.discipline.committed,
      sub: execMeta.measure,
    },
  ];

  return (
    <div className="space-y-6">
      <section
        className="rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)] sm:p-6"
        aria-label="Command"
      >
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">
          Kwartaal · {snapshot.quarterLabel}
        </p>
        <div className="mt-4">
          <RingScore pct={pct} />
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
          <section
            key={b.key}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/80 p-4 text-sm leading-relaxed text-[var(--text-secondary)]"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{b.label}</h3>
            <p className="mt-2">{analysisNl(snapshot, b.key)}</p>
          </section>
        ))}
      </div>

      {snapshot.ruleLinesNl.length > 0 ? (
        <section className="rounded-xl border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(var(--mode-rgb-deep),0.08)] p-4">
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

import Link from "next/link";
import type { QuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";

function statusDot(displayPct: number, committed: boolean) {
  if (!committed) return "bg-[var(--text-muted)]/50";
  if (displayPct >= 80) return "bg-emerald-500";
  if (displayPct >= 60) return "bg-amber-400";
  return "bg-red-500/90";
}

type Props = {
  snapshot: QuarterEngineSnapshot;
  simplifiedLayout?: boolean;
};

export function StrategyQuarterCommandCenter({ snapshot, simplifiedLayout = false }: Props) {
  const pressureNl =
    snapshot.strategicPressure === "relaxed"
      ? "Ontspannen"
      : snapshot.strategicPressure === "normal"
        ? "Normaal"
        : "Druk";

  const headline =
    snapshot.strategyScorePct >= 85
      ? "Je zit op koers."
      : snapshot.strategyScorePct >= 60
        ? "Blijf tempo houden."
        : "Je zit achter — de engine draait strakker.";

  const drivers = [
    {
      key: "growth",
      label: "Growth",
      sub: "protocol / leertraject",
      pct: snapshot.growth.displayPct,
      committed: snapshot.growth.committed,
    },
    {
      key: "budget",
      label: "Budget",
      sub: "sparen dit kwartaal",
      pct: snapshot.budget.displayPct,
      committed: snapshot.budget.committed,
    },
    {
      key: "xp",
      label: "XP",
      sub: "verdiend vs doel",
      pct: snapshot.xp.displayPct,
      committed: snapshot.xp.committed,
    },
    {
      key: "discipline",
      label: "Executie",
      sub: "afgerond vs skip / verzet / delete",
      pct: snapshot.discipline.displayPct,
      committed: snapshot.discipline.committed,
    },
  ] as const;

  const profileHref = "/profile#strategy-engine";

  return (
    <section
      className={`rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)] ${
        simplifiedLayout ? "p-4" : "p-5 sm:p-6"
      }`}
      aria-label="Quarter strategy engine"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Strategy score · {snapshot.quarterLabel}
          </p>
          <p className="mt-2 font-mono text-4xl font-bold tabular-nums text-[var(--text-primary)] sm:text-5xl">
            {snapshot.strategyScorePct}
            <span className="text-lg font-semibold text-[var(--text-muted)]">%</span>
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">{headline}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Strategische druk: <span className="font-semibold text-[var(--text-primary)]">{pressureNl}</span>
            {snapshot.thesisDeadlinePassed || snapshot.pressureBoostAfterDeadline ? (
              <span className="text-amber-600/90"> · Thesis-deadline of boost actief</span>
            ) : null}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-[var(--card-border)] bg-[var(--bg-card)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)]">Contract</p>
          <p className="mt-2 leading-relaxed">
            Vier pijlers wegen elk 25%. Stel spaar-, growth-, en XP-doelen in onder{" "}
            <Link
              href={profileHref}
              className="font-medium text-[var(--semantic-accent)] underline-offset-2 hover:underline"
            >
              Profiel → Strategy engine
            </Link>
            .
          </p>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Executie gebruikt je mission-log (completes + skip / verzet / verwijderen dit kwartaal).
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {drivers.map((d) => (
          <div
            key={d.key}
            className="flex items-center gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-black/5 px-3 py-2.5 dark:bg-white/[0.03]"
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(d.pct, d.committed)}`}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{d.label}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{d.sub}</p>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums text-[var(--text-primary)]">
              {d.committed ? `${d.pct}%` : "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-[rgba(var(--mode-rgb),0.1)] pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Engine vandaag
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-[var(--text-secondary)]">
          {snapshot.ruleLinesNl.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>

    </section>
  );
}

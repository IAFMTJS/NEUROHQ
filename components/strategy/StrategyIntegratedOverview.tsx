import Link from "next/link";
import type { StrategyIntegrationOverview } from "@/app/actions/strategy-integration";
import { DOMAINS, domainLabel, type StrategyDomain } from "@/lib/strategyDomains";
import { formatCents } from "@/lib/utils/currency";
import { tierLabelNl } from "@/lib/growth/tier-labels";
import { StrategyStackNote } from "@/components/strategy/StrategyStackNote";

function DomainFocusVsMissions(args: {
  allocation: Record<StrategyDomain, number> | null;
  actualCounts: Record<StrategyDomain, number>;
}) {
  const { allocation, actualCounts } = args;
  const total = DOMAINS.reduce((s, d) => s + actualCounts[d], 0);
  return (
    <div className="mt-2 space-y-1">
      {DOMAINS.map((d) => {
        const allocPct = allocation ? allocation[d] : null;
        const actPct = total > 0 ? Math.round((actualCounts[d] / total) * 100) : null;
        return (
          <div key={d} className="flex justify-between gap-2 text-[11px]">
            <span className="text-[var(--text-muted)]">{domainLabel(d)}</span>
            <span className="tabular-nums text-[var(--text-secondary)]">
              {allocPct != null ? `${allocPct}%` : "—"} focus · {actPct != null ? `${actPct}%` : "—"} missies
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-[10px] text-[var(--text-muted)]">
        Vergelijking: weekly allocation (Strategy → allocatie) vs open missies deze week per domein.
      </p>
    </div>
  );
}

export function StrategyIntegratedOverview({
  integrationData,
}: {
  integrationData: StrategyIntegrationOverview | null;
}) {
  const data = integrationData;
  if (!data) return null;

  const { week, budget, growth, strategy } = data;
  const snap = growth;
  const primaryMatchLine =
    strategy && DOMAINS.reduce((s, d) => s + week.domainCounts[d], 0) > 0
      ? (() => {
          const total = DOMAINS.reduce((s, d) => s + week.domainCounts[d], 0);
          const primaryShare = Math.round((week.domainCounts[strategy.primaryDomain] / total) * 100);
          const want = strategy.weeklyAllocation[strategy.primaryDomain];
          return `Thesis: ${want}% op ${domainLabel(strategy.primaryDomain)} · open missies deze week: ${primaryShare}% in dat domein`;
        })()
      : strategy
        ? "Zet een domein op je missies om te zien of je week overeenkomt met je focus."
        : "Start een strategie hieronder om focus en missies te vergelijken.";

  return (
    <section
      className="space-y-4"
      aria-label="Strategische stack: missions, budget, growth"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Strategische stack
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Missions, budget en growth in één beeld — zo zie je of je week je intentie volgt.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Missions */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-[var(--semantic-accent)]/10 via-[var(--bg-elevated)]/90 to-[var(--bg-primary)] p-4 shadow-[0_0_32px_rgba(var(--mode-rgb),0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Missions</p>
          <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
            {data.todayOpenMissionCount} open vandaag
          </p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Deze week ({week.start.slice(5)} – {week.end.slice(5)}):{" "}
            <span className="font-medium text-[var(--text-primary)]">{week.totalOpenTasks}</span> geplande open taken
            {week.overloadDays > 0 && (
              <span className="text-amber-200"> · {week.overloadDays} dag(en) overload</span>
            )}
          </p>
          <DomainFocusVsMissions
            allocation={strategy?.weeklyAllocation ?? null}
            actualCounts={week.domainCounts}
          />
          <p className="mt-2 text-xs text-[var(--text-muted)]">{primaryMatchLine}</p>
          <Link
            href="/tasks"
            className="mt-3 inline-flex items-center justify-center rounded-xl border border-[var(--semantic-accent)]/40 bg-[var(--semantic-accent)]/10 px-3 py-2 text-xs font-semibold text-[var(--mode-text-soft)] transition hover:bg-[var(--semantic-accent)]/20"
          >
            Naar missies
          </Link>
        </div>

        {/* Budget */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-emerald-500/10 via-[var(--bg-elevated)]/90 to-[var(--bg-primary)] p-4 shadow-[0_0_32px_rgba(16,185,129,0.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">Budget</p>
          {budget.hasPlanning && budget.remainingCents != null ? (
            <>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {formatCents(budget.remainingCents)} resterend (periode)
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {budget.safeDailyCents != null && (
                  <>
                    Veilige dag: <span className="font-medium text-[var(--text-primary)]">{formatCents(budget.safeDailyCents)}</span>
                    {" · "}
                  </>
                )}
                {budget.daysUntilIncome != null && <span>{budget.daysUntilIncome} dagen tot inkomen</span>}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Geen volledig budgetbeeld — stel je maandbudget in om strategie met cashflow te koppelen.
            </p>
          )}
          {budget.weekSpentCents != null && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Deze week uitgegeven: {formatCents(budget.weekSpentCents)}
            </p>
          )}
          {budget.disciplineScore != null && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">Budget-discipline-index: {Math.round(budget.disciplineScore)}</p>
          )}
          <Link
            href="/budget"
            className="mt-3 inline-flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
          >
            Naar budget
          </Link>
        </div>

        {/* Growth */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--semantic-accent)]/35 bg-gradient-to-br from-[var(--semantic-accent)]/12 via-[var(--bg-elevated)]/80 to-[var(--semantic-accent)]/8 p-4 shadow-[0_0_40px_rgba(var(--mode-rgb),0.08)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--mode-rgb),0.12),transparent_55%)]" aria-hidden />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">Growth</p>
            {snap?.activeProtocol ? (
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                Actief: <span className="text-[var(--semantic-accent)]">{snap.activeProtocol.title}</span>
                <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                  week {snap.activeProtocol.weekIndex} · {tierLabelNl(snap.activeProtocol.protocolTier)}
                </span>
              </p>
            ) : snap?.focus?.slug ? (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Focus ingesteld — open Growth om het traject te laden.</p>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">Geen Growth-focus — kies een traject op de Growth-pagina.</p>
            )}
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              Brain-engine: {tierLabelNl(snap?.engineTier ?? "medium")}
              {snap && !snap.brainLogged ? " (nog geen check-in vandaag)" : ""}
            </p>
            {snap && !snap.tierAligned && snap.activeProtocol && (
              <p className="mt-2 text-[11px] font-medium text-amber-200">
                Tier-mismatch: engine {tierLabelNl(snap.engineTier)} ≠ protocol {tierLabelNl(snap.activeProtocol.protocolTier)}
              </p>
            )}
            {snap?.tierAligned && snap.activeProtocol && snap.brainLogged && (
              <p className="mt-2 text-[11px] font-medium text-emerald-200">Engine en protocol lopen gelijk.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/learning"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--semantic-accent)]/50 bg-[var(--semantic-accent)]/15 px-3 py-2 text-xs font-semibold text-[var(--semantic-accent)] transition hover:bg-[var(--semantic-accent)]/25"
              >
                Growth command center
              </Link>
              <Link
                href="/tasks?growth=1"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/60 px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--semantic-accent)]/40 hover:text-[var(--semantic-accent)]"
              >
                Missions (protocol)
              </Link>
            </div>
          </div>
        </div>
      </div>

      <StrategyStackNote />
    </section>
  );
}

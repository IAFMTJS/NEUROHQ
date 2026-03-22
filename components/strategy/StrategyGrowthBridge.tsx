import Link from "next/link";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { tierLabelNl } from "@/lib/growth/tier-labels";

/**
 * Strategy page: ties weekly thesis / allocation to Growth (protocol) + brain engine tier.
 */
export async function StrategyGrowthBridge() {
  const snap = await getGrowthEngineSnapshot();
  if (!snap) return null;

  const { activeProtocol, engineTier, tierAligned, brainLogged, focus } = snap;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--semantic-accent)]/35 bg-gradient-to-br from-[var(--semantic-accent)]/12 via-[var(--bg-elevated)]/80 to-[var(--semantic-accent)]/8 shadow-[0_0_40px_rgba(var(--mode-rgb),0.08)]"
      aria-label="Growth en engine"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--mode-rgb),0.12),transparent_55%)]" aria-hidden />
      <div className="relative px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--semantic-accent)]">
              Growth · Engine · Execution
            </p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {activeProtocol ? (
                <>
                  Actief traject: <span className="text-[var(--semantic-accent)]">{activeProtocol.title}</span>
                  <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                    week {activeProtocol.weekIndex} · protocol-tier {tierLabelNl(activeProtocol.protocolTier)}
                  </span>
                </>
              ) : focus.slug ? (
                <span>Focus ingesteld — open Growth om het traject te laden.</span>
              ) : (
                <span>Geen Growth-focus — skill-trajecten leven op de Growth-pagina.</span>
              )}
            </p>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Brain-engine ({tierLabelNl(engineTier)}
              {!brainLogged ? ", nog geen check-in vandaag — standaard medium" : ""}) bepaalt aanbevolen belasting; protocol-tier
              zou daarmee gelijk lopen. Domein-allocation hierboven blijft je strategische verdeling; Growth voedt concrete
              uitvoer en consistentie.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!tierAligned && activeProtocol && (
              <span className="rounded-full border border-amber-400/45 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-100">
                Tier-mismatch: engine {tierLabelNl(engineTier)} ≠ protocol {tierLabelNl(activeProtocol.protocolTier)}
              </span>
            )}
            {tierAligned && activeProtocol && brainLogged && (
              <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                Engine ↔ protocol aligned
              </span>
            )}
            <Link
              href="/learning#growth-command"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--semantic-accent)]/50 bg-[var(--semantic-accent)]/15 px-4 py-2 text-xs font-semibold text-[var(--semantic-accent)] transition hover:bg-[var(--semantic-accent)]/25"
            >
              Growth command center
            </Link>
            <Link
              href="/tasks?growth=1"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/60 px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--semantic-accent)]/40 hover:text-[var(--semantic-accent)]"
            >
              Missions (protocol)
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

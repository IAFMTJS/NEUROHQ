import Link from "next/link";
import type { GrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { tierLabelNl } from "@/lib/growth/tier-labels";

type Props = {
  snap: GrowthEngineSnapshot | null;
  /** Deep link from Growth command center (`?growth=1`). */
  fromGrowthPage?: boolean;
};

export function GrowthMissionsRibbon({ snap, fromGrowthPage = false }: Props) {
  if (!snap) return null;

  const { activeProtocol, engineTier, tierAligned, brainLogged, hasProtocols } = snap;

  if (!hasProtocols) {
    return (
      <div className="mb-4 rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-surface)]/25 px-4 py-3 text-sm text-[var(--text-muted)]">
        Geen protocollen in de bibliotheek —{" "}
        <Link href="/learning#growth-protocols" className="font-semibold text-[var(--semantic-accent)] hover:underline">
          Growth
        </Link>{" "}
        importeert trajecten.
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-[var(--semantic-ring)]/35 bg-gradient-to-r from-[var(--semantic-accent)]/10 via-[var(--bg-surface)]/30 to-transparent">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {fromGrowthPage && (
            <p className="mb-1 text-[10px] font-medium text-[var(--semantic-accent)]">Vanaf Growth — protocoltaken staan hier met je andere missies.</p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]">
            Protocol × Missions
          </p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">
            {activeProtocol ? (
              <>
                <span className="font-semibold">{activeProtocol.title}</span>
                <span className="text-[var(--text-muted)]">
                  {" "}
                  · week {activeProtocol.weekIndex} · tier {tierLabelNl(activeProtocol.protocolTier)}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)]">Kies een focus op Growth — taken krijgen tags growth / protocol.</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--card-border)] bg-[var(--bg-primary)]/50 px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
            Engine {tierLabelNl(engineTier)}
            {!brainLogged && <span className="ml-1 text-[var(--text-muted)]">· log brain op dashboard</span>}
          </span>
          {!tierAligned && activeProtocol && (
            <span className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
              Sync tier op Growth
            </span>
          )}
          <Link
            href="/learning#growth-command"
            className="rounded-lg border border-[var(--semantic-accent)]/40 bg-[var(--semantic-accent)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--semantic-accent)] hover:bg-[var(--semantic-accent)]/25"
          >
            Command center
          </Link>
        </div>
      </div>
    </div>
  );
}

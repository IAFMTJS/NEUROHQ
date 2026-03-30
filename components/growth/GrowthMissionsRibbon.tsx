import Link from "next/link";
import type { GrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { tierLabelNl } from "@/lib/growth/tier-labels";

type Props = {
  snap: GrowthEngineSnapshot | null;
  /** Deep link from Growth command center (`?growth=1`). */
  fromGrowthPage?: boolean;
  className?: string;
};

/** Compact missions-deck strip — protocol context without a large hero card. */
export function GrowthMissionsRibbon({ snap, fromGrowthPage = false, className = "" }: Props) {
  if (!snap) return null;

  const { activeProtocol, engineTier, tierAligned, brainLogged, hasProtocols } = snap;

  const shell = [
    "card-simple flex flex-wrap items-center justify-between gap-2 !rounded-xl border border-[rgba(var(--mode-rgb),0.12)] px-2.5 py-2 sm:gap-3 sm:px-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (!hasProtocols) {
    return (
      <div className={shell}>
        <p className="min-w-0 flex-1 text-[10px] leading-snug text-[var(--text-muted)]">
          Geen protocollen —{" "}
          <Link href="/learning#growth-protocols" className="font-semibold text-[var(--semantic-accent)] hover:underline">
            Growth
          </Link>{" "}
          importeert trajecten.
        </p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--semantic-accent)]">Protocol × Missions</p>
        {fromGrowthPage ? (
          <p className="mt-0.5 text-[9px] text-[var(--text-muted)]">Vanaf Growth — protocoltaken staan bij je missies.</p>
        ) : null}
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--text-secondary)]">
          {activeProtocol ? (
            <>
              <span className="font-semibold text-[var(--text-primary)]">{activeProtocol.title}</span>
              <span className="text-[var(--text-muted)]">
                {" "}
                · w{activeProtocol.weekIndex} · {tierLabelNl(activeProtocol.protocolTier)}
              </span>
            </>
          ) : (
            <span>Geen actief protocol — kies focus op Growth.</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
        <span className="rounded-md border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.35)] px-1.5 py-0.5 text-[9px] font-semibold tabular-nums text-[var(--text-secondary)]">
          {tierLabelNl(engineTier)}
        </span>
        {!brainLogged ? (
          <span className="hidden text-[9px] text-[var(--text-muted)] sm:inline">Log brain</span>
        ) : null}
        {!tierAligned && activeProtocol ? (
          <span className="rounded-md border border-amber-400/35 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-200/95">
            Sync tier
          </span>
        ) : null}
        <Link
          href="/learning#growth-command"
          className="rounded-lg border border-[rgba(var(--semantic-accent),0.35)] bg-[var(--semantic-accent)]/12 px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[var(--semantic-accent)] transition hover:bg-[var(--semantic-accent)]/20"
        >
          Growth
        </Link>
      </div>
    </div>
  );
}

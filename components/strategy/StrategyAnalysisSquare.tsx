import Link from "next/link";
import type { StrategyAnalysisSnapshot } from "@/lib/strategy/build-strategy-analysis-square";
import { StrategyAnalysisSplitRing } from "@/components/strategy/StrategyAnalysisSplitRing";

type Props = {
  snapshot: StrategyAnalysisSnapshot;
};

export function StrategyAnalysisSquare({ snapshot }: Props) {
  const mPct = Math.max(0, Math.min(100, snapshot.missionsHealth));

  return (
    <section
      aria-label="Strategy analyse"
      className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.24)] bg-gradient-to-br from-[rgba(8,26,42,0.96)] via-[var(--bg-elevated)]/90 to-[rgba(var(--mode-rgb-deep),0.14)] p-4 shadow-[0_0_36px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)] md:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(var(--mode-rgb),0.14),transparent_55%)]" aria-hidden />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-stretch md:gap-5">
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Analyse</p>
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)] [text-shadow:0_0_12px_rgba(var(--mode-rgb),0.2)]">
            {snapshot.headline}
          </p>
          <ul className="space-y-1.5">
            {snapshot.bullets.map((line, i) => (
              <li key={`${i}-${line}`} className="flex gap-2.5 text-xs text-[var(--text-secondary)]">
                <span
                  className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--semantic-accent)] shadow-[0_0_8px_rgba(var(--mode-rgb),0.45)]"
                  aria-hidden
                />
                <span className="min-w-0 leading-snug tabular-nums">{line}</span>
              </li>
            ))}
          </ul>
          <div className="pt-0.5">
            <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <span>Missies week</span>
              <span className="tabular-nums text-[var(--text-secondary)]">{mPct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full border border-[rgba(var(--mode-rgb),0.15)] bg-[rgba(6,18,30,0.55)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]">
              <div
                className={
                  mPct < 48
                    ? "h-full rounded-full bg-gradient-to-r from-amber-600/95 via-orange-500/90 to-red-500/85 shadow-[0_0_14px_rgba(239,68,68,0.38)] transition-[width] duration-300"
                    : "h-full rounded-full bg-gradient-to-r from-[rgba(var(--mode-rgb),0.25)] via-[var(--semantic-accent)] to-[#34d399] shadow-[0_0_12px_rgba(var(--mode-rgb),0.35)] transition-[width] duration-300"
                }
                style={{ width: `${mPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-center md:flex-col md:justify-between">
          <StrategyAnalysisSplitRing
            budgetHealth={snapshot.budgetHealth}
            growthHealth={snapshot.growthHealth}
            budgetWarn={snapshot.budgetWarn}
            growthWarn={snapshot.growthWarn}
          />
        </div>
      </div>

      <div className="relative mt-4 border-t border-[rgba(var(--mode-rgb),0.12)] pt-4">
        <Link href={snapshot.ctaHref} className="primary-btn flex w-full items-center justify-center px-4 py-3 text-center text-sm font-semibold">
          {snapshot.ctaLabel}
        </Link>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { profileEngineHref } from "@/lib/profile-routes";
import { StrategyEngineSettingsSection } from "@/components/strategy/StrategyEngineSettingsSection";

/**
 * Alleen kwartaalcontract (spaar-, leer-, XP-doelen) op Strategy — tab Contract (`#strategy-contract`).
 * Strategy engine (missies, locks, push, executie) staat onder Profiel → Engine → Strategy.
 */
export function StrategyQuarterContractPanel() {
  return (
    <section
      id="strategy-contract"
      className="scroll-mt-28 space-y-4 rounded-[22px] border border-[var(--card-border)] bg-[var(--bg-elevated)]/85 p-4 shadow-[var(--shadow-card)] sm:p-5"
      aria-labelledby="strategy-contract-heading"
    >
      <div>
        <h2
          id="strategy-contract-heading"
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--semantic-accent)]"
        >
          Kwartaal contract
        </h2>
        <p className="mt-1 text-xs leading-snug text-[var(--text-secondary)]">
          De drie numerieke commitments voor je Strategy-score dit kwartaal. Growth sluit aan op je protocol op{" "}
          <span className="font-medium text-[var(--text-primary)]">Growth</span>; spaargeld log je op{" "}
          <span className="font-medium text-[var(--text-primary)]">Budget</span>. Missies per energie, budget-locks,
          push-stijl en executie-focus stel je in onder{" "}
          <Link
            href={profileEngineHref("strategy")}
            className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline"
          >
            Profiel → Engine → Strategy
          </Link>
          .
        </p>
      </div>
      <Suspense
        fallback={<div className="min-h-[140px] animate-pulse rounded-xl bg-[var(--bg-primary)]/40" aria-hidden />}
      >
        <StrategyEngineSettingsSection mode="contract" formSectionId="strategy-contract-form" />
      </Suspense>
    </section>
  );
}

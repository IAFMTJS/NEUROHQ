import { Suspense } from "react";
import { StrategyEngineSettingsSection } from "@/components/strategy/StrategyEngineSettingsSection";

/**
 * Kwartaal contract + engine-formulier op de Strategy-pagina (`#strategy-contract`).
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
          Targets en regels voor de vier pijlers van je Strategy score. Growth sluit aan op je protocol op{" "}
          <span className="font-medium text-[var(--text-primary)]">Growth</span>; spaargeld log je op{" "}
          <span className="font-medium text-[var(--text-primary)]">Budget</span>.
        </p>
      </div>
      <Suspense
        fallback={<div className="min-h-[140px] animate-pulse rounded-xl bg-[var(--bg-primary)]/40" aria-hidden />}
      >
        <StrategyEngineSettingsSection formSectionId="strategy-contract-form" />
      </Suspense>
    </section>
  );
}

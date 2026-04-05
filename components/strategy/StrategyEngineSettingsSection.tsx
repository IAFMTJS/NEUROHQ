import Link from "next/link";
import { getActiveStrategyFocus } from "@/app/actions/strategyFocus";
import { countBudgetLocksThisQuarter } from "@/app/actions/budget-intelligence";
import { StrategyEngineSettingsForm } from "@/components/strategy/StrategyEngineSettingsForm";

export async function StrategyEngineSettingsSection() {
  const strategy = await getActiveStrategyFocus();
  if (!strategy) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--bg-elevated)]/40 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
        Stel eerst een actieve strategie in op de{" "}
        <Link
          href="/strategy"
          className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-rgb),0.45)] focus-visible:ring-offset-0"
        >
          Strategy
        </Link>
        -pagina om engine-limieten en -doelen vast te leggen. Die sturen o.a. missie-suggesties, budget-locks en
        push-context.
      </div>
    );
  }
  const locksUsed = await countBudgetLocksThisQuarter();
  return (
    <StrategyEngineSettingsForm
      strategyId={strategy.id}
      initial={strategy.engine_params}
      locksUsedThisQuarter={locksUsed}
    />
  );
}

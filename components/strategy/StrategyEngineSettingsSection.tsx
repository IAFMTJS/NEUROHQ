import Link from "next/link";
import { getStrategyBudgetSavingsContext } from "@/app/actions/strategy-budget-savings-context";
import { getActiveStrategyFocus } from "@/app/actions/strategyFocus";
import { countBudgetLocksThisQuarter } from "@/app/actions/budget-intelligence";
import { resolveEffectiveQuarterlySavingsTargetCents } from "@/lib/strategy/engine-params";
import {
  StrategyEngineSettingsForm,
  type StrategyEngineSettingsFormMode,
} from "@/components/strategy/StrategyEngineSettingsForm";

type Props = {
  /** HTML id op het formulier (anchor). */
  formSectionId?: string;
  mode: StrategyEngineSettingsFormMode;
};

export async function StrategyEngineSettingsSection({ formSectionId = "strategy-engine", mode }: Props) {
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
        -pagina. Daarna kun je{" "}
        {mode === "contract" ? "hier je kwartaalcontract invullen" : "hier de engine tunen"}.
      </div>
    );
  }
  const locksUsed = mode === "engine" ? await countBudgetLocksThisQuarter() : 0;
  let budgetDerivedQuarterlyCents: number | null = null;
  if (mode === "contract") {
    const budgetCtx = await getStrategyBudgetSavingsContext();
    const q = strategy.engine_params.savings.quarterlyMustSaveCents;
    const contractEmpty = q == null || q <= 0;
    const derived = resolveEffectiveQuarterlySavingsTargetCents(q, budgetCtx);
    if (contractEmpty && derived != null && derived > 0) {
      budgetDerivedQuarterlyCents = derived;
    }
  }
  return (
    <StrategyEngineSettingsForm
      mode={mode}
      strategyId={strategy.id}
      initial={strategy.engine_params}
      locksUsedThisQuarter={locksUsed}
      sectionId={formSectionId}
      budgetDerivedQuarterlyCents={budgetDerivedQuarterlyCents}
    />
  );
}

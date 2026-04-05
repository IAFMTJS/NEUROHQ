import Link from "next/link";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { strategyPaceHintLines, type StrategyPaceHintVariant } from "@/lib/strategy/format-strategy-pace-hints";

type Variant = StrategyPaceHintVariant;

/**
 * Read-only strip: compares Strategy engine quarterly targets to actuals (no writes — no conflicting data stream).
 * On Growth, the same lines are shown inside the protocol command card instead of this block.
 */
export async function StrategyEnginePaceHint({ variant = "both" }: { variant?: Variant }) {
  const hints = await getStrategyPacingHints();
  if (!hints) return null;

  const lines = strategyPaceHintLines(variant, hints);
  if (lines.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--accent-focus)]/30 bg-[var(--accent-focus)]/8 px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
      <p className="font-semibold text-[var(--accent-focus)]">Strategy engine (alleen-lezen)</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-2 text-[var(--text-muted)]">
        Doelen wijzig je op{" "}
        <Link
          href="/strategy#strategy-contract"
          className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline"
        >
          Strategy contract
        </Link>
        . Geen tweede bron: dit is een hint, geen aparte database.
      </p>
    </div>
  );
}

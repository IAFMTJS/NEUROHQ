import Link from "next/link";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { formatCents } from "@/lib/utils/currency";

type Variant = "budget" | "learning" | "both";

/**
 * Read-only strip: compares Strategy engine quarterly targets to actuals (no writes — no conflicting data stream).
 */
export async function StrategyEnginePaceHint({ variant = "both" }: { variant?: Variant }) {
  const hints = await getStrategyPacingHints();
  if (!hints) return null;

  const showSave =
    (variant === "budget" || variant === "both") &&
    hints.savingsTargetCents != null &&
    hints.savingsTargetCents > 0;
  const showLearn =
    (variant === "learning" || variant === "both") &&
    hints.learningTargetPct != null &&
    hints.learningTargetPct > 0;

  if (!showSave && !showLearn) return null;

  const saveLine =
    showSave && hints.savedThisQuarterCents != null
      ? `Sparen kwartaal: ${formatCents(hints.savedThisQuarterCents)} van ${formatCents(hints.savingsTargetCents!)}${
          hints.savingsOnTrack === false
            ? " — iets onder tempo t.o.v. het kwartaal; zie Budget."
            : hints.savingsOnTrack === true
              ? " — op schema richting je strategy-doel."
              : ""
        }`
      : showSave
        ? `Strategy-doel: ${formatCents(hints.savingsTargetCents!)} sparen dit kwartaal — log stortingen op Budget.`
        : null;

  const learnLine =
    showLearn && hints.learningRoughPct != null
      ? `Leerprogress (ruw): ~${hints.learningRoughPct}% t.o.v. ${hints.learningTargetPct}% kwartaaldoel${
          hints.learningOnTrack === false
            ? " — onder tempo; open Growth."
            : hints.learningOnTrack === true
              ? " — op schema."
              : ""
        }`
      : showLearn
        ? `Strategy-doel: ${hints.learningTargetPct}% leerprogress dit kwartaal — volg je traject op Growth.`
        : null;

  const lines = [saveLine, learnLine].filter(Boolean);
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
        <Link href="/strategy" className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline">
          Strategy
        </Link>
        . Geen tweede bron: dit is een hint, geen aparte database.
      </p>
    </div>
  );
}

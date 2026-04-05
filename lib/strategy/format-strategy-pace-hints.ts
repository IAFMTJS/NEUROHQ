import { formatCents } from "@/lib/utils/currency";
import type { StrategyPacingHints } from "@/lib/strategy/strategy-pacing-hints";

export type StrategyPaceHintVariant = "budget" | "learning" | "both";

/**
 * Human-readable lines for Strategy engine pacing (read-only). Shared by
 * `StrategyEnginePaceHint` and the Growth protocol card.
 */
export function strategyPaceHintLines(variant: StrategyPaceHintVariant, hints: StrategyPacingHints): string[] {
  const showSave =
    (variant === "budget" || variant === "both") &&
    hints.savingsTargetCents != null &&
    hints.savingsTargetCents > 0;
  const showLearn =
    (variant === "learning" || variant === "both") &&
    hints.learningTargetPct != null &&
    hints.learningTargetPct > 0;

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

  const learnOffTrack = variant === "learning" ? " — onder tempo; pak protocoltaken op Missions op." : " — onder tempo; open Growth.";
  const learnFallback =
    variant === "learning"
      ? `Strategy-doel: ${hints.learningTargetPct}% leerprogress dit kwartaal — volg je traject hier.`
      : `Strategy-doel: ${hints.learningTargetPct}% leerprogress dit kwartaal — volg je traject op Growth.`;

  const pq = hints.protocolQuarterTasks;
  const protoSuffix =
    pq != null
      ? ` (${pq.completedTasks}/${pq.expectedTasks} protocoltaken dit kwartaal, verwachte set w${pq.weekRangeStart}–w${pq.weekRangeEnd})`
      : "";

  const learnLine =
    showLearn && hints.learningRoughPct != null
      ? `Leerprogress: ~${hints.learningRoughPct}% t.o.v. ${hints.learningTargetPct}% kwartaaldoel${protoSuffix}${
          hints.learningOnTrack === false ? learnOffTrack : hints.learningOnTrack === true ? " — op schema." : ""
        }`
      : showLearn
        ? learnFallback
        : null;

  return [saveLine, learnLine].filter((x): x is string => Boolean(x));
}

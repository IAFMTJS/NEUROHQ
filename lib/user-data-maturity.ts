/** How much historical task/completion signal we trust for personalization (UMS, Insights copy). */
export type UserDataMaturity = "sparse" | "enough" | "rich";

const NEUTRAL_COMPLETION_PRIOR = 0.7;

/**
 * Derive maturity from completions and active days in the last ~30 days.
 * Uses both so one binge day does not count as "rich".
 */
export function computeMaturityFromCounts(
  completesLast30: number,
  activeDaysLast30: number
): UserDataMaturity {
  if (completesLast30 < 7 || activeDaysLast30 < 3) return "sparse";
  if (completesLast30 < 30 || activeDaysLast30 < 8) return "enough";
  return "rich";
}

/** Blend observed per-task completion rate toward neutral when data is thin. */
export function blendCompletionRate(observed: number, maturity: UserDataMaturity): number {
  const n = NEUTRAL_COMPLETION_PRIOR;
  if (maturity === "sparse") return 0.55 * n + 0.45 * observed;
  if (maturity === "enough") return 0.2 * n + 0.8 * observed;
  return observed;
}

/** Insights / report banner (always a line; tone scales with maturity). */
export function dataMaturityBannerMessageNl(maturity: UserDataMaturity): string {
  switch (maturity) {
    case "sparse":
      return "Naarmate je meer missies voltooit, worden volgorde en kansen persoonlijker.";
    case "enough":
      return "Je persoonlijke data wordt nu gebruikt om afrond-kansen en missie-volgorde te verfijnen.";
    default:
      return "Volledige persoonlijke modus: rangschikking en kansen zijn sterk op jouw patronen afgestemd.";
  }
}

/** Missions "next move" — only when we lean on personalized rates (enough+). */
export function dataMaturityMissionsHintNl(maturity: UserDataMaturity): string | null {
  if (maturity === "sparse") return null;
  if (maturity === "enough") {
    return "Volgorde gebruikt nu je persoonlijke afrond-data (laatste 30 dagen).";
  }
  return "Volgorde is sterk op jouw afrond-patronen afgestemd.";
}

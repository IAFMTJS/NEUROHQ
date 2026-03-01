/**
 * Social Simulation Layer: mental battery affects social mission XP, failure chance, solo bonus.
 * Battery is updated by completions (social/conflict drain, recovery gain), not only self-report.
 */

export function socialXpBonus(mentalBattery: number | null | undefined): number {
  const b = mentalBattery ?? 5;
  if (b >= 8) return 0.1;
  if (b >= 6) return 0.05;
  return 0;
}

export function socialFailureChanceIncrease(mentalBattery: number | null | undefined): number {
  const b = mentalBattery ?? 5;
  if (b <= 3) return 0.15;
  if (b <= 5) return 0.08;
  return 0;
}

export function soloBonusActive(mentalBattery: number | null | undefined): boolean {
  return (mentalBattery ?? 5) <= 4;
}

/** Battery delta after mission completion: social/conflict = drain, recovery = gain. */
export function batteryDeltaAfterCompletion(params: {
  missionIntent: "normal" | "recovery" | "push" | "chaos" | "scarcity" | null;
  socialIntensity: number;
}): number {
  const { missionIntent, socialIntensity } = params;
  if (missionIntent === "recovery") return 1;
  if (socialIntensity >= 7) return -1;
  if (missionIntent === "chaos" || socialIntensity >= 5) return -0.5;
  return 0;
}

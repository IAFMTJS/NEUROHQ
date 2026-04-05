/** Publieke prijsregel: admin-tekst of afgeleid uit XP / flex / badge. */
export function buildQuestPrizeLine(params: {
  prizeSummary: string | null | undefined;
  rewardXp: number;
  rewardFlexPercentBp: number;
  badgeLabel: string;
}): string {
  const custom = params.prizeSummary?.trim();
  if (custom) return custom;
  const parts: string[] = [];
  if (params.rewardXp > 0) parts.push(`+${params.rewardXp} XP`);
  if (params.rewardFlexPercentBp > 0) {
    parts.push(`+${(params.rewardFlexPercentBp / 100).toFixed(0)}% flex budget (van maandcap)`);
  }
  if (params.badgeLabel?.trim()) parts.push(`Badge: ${params.badgeLabel.trim()}`);
  return parts.length > 0 ? parts.join(" · ") : "Een unieke beloning bij voltooiing.";
}

/** Pure helpers for quest/game claim toasts (client + server safe). */

export function humanizeFlexSkipReason(reason: string | undefined): string | undefined {
  if (!reason) return undefined;
  const m: Record<string, string> = {
    no_user: "",
    flex_disabled: "flex budget staat uit",
    no_cap: "geen maandcap",
    zero_delta: "bedrag nul na afronding",
  };
  return m[reason] ?? reason;
}

export function formatFlexCentsNl(cents: number): string {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function buildQuestClaimCelebrationMessage(params: {
  pointsApplied: number;
  flexPercentBp: number;
  flexAppliedCents: number | null;
  flexSkippedReason?: string;
  badgeLabel: string;
}): string {
  const lines: string[] = ["🎉 Quest-beloning geclaimd!"];
  if (params.pointsApplied > 0) {
    lines.push(`+${params.pointsApplied} XP op je account.`);
  }
  if (params.flexPercentBp > 0) {
    if (params.flexAppliedCents != null && params.flexAppliedCents > 0) {
      lines.push(`+${formatFlexCentsNl(params.flexAppliedCents)} flex budget (≈ ${(params.flexPercentBp / 100).toFixed(0)}% van je maandcap).`);
    } else {
      const why = humanizeFlexSkipReason(params.flexSkippedReason);
      lines.push(
        `Flexbonus (${(params.flexPercentBp / 100).toFixed(0)}% van cap) niet toegepast${why ? ` — ${why}.` : "."}`
      );
    }
  }
  if (params.badgeLabel?.trim()) {
    lines.push(`Badge: ${params.badgeLabel.trim()}`);
  }
  return lines.join("\n");
}

export function buildGameClaimCelebrationMessage(params: {
  pointsApplied: number;
  flexPercentBp: number;
  flexAppliedCents: number | null;
  flexSkippedReason?: string;
}): string {
  const lines: string[] = ["🎉 Game-beloning geclaimd!"];
  if (params.pointsApplied > 0) {
    lines.push(`+${params.pointsApplied} XP op je account.`);
  }
  if (params.flexPercentBp > 0) {
    if (params.flexAppliedCents != null && params.flexAppliedCents > 0) {
      lines.push(`+${formatFlexCentsNl(params.flexAppliedCents)} flex budget (≈ ${(params.flexPercentBp / 100).toFixed(0)}% van je maandcap).`);
    } else {
      const why = humanizeFlexSkipReason(params.flexSkippedReason);
      lines.push(
        `Flexbonus (${(params.flexPercentBp / 100).toFixed(0)}% van cap) niet toegepast${why ? ` — ${why}.` : "."}`
      );
    }
  }
  if (params.pointsApplied <= 0 && params.flexPercentBp <= 0) {
    lines.push("Je voortgang is opgeslagen.");
  }
  return lines.join("\n");
}

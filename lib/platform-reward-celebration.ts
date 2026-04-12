/** Pure helpers for quest/game claim toasts (client + server safe). */

/** Structured copy for rich “loot” toasts (quest/game claims). */
export type PlatformLootRewardLine = {
  icon: string;
  label: string;
  detail?: string;
  tone: "xp" | "flex" | "badge" | "note" | "warn";
};

export type PlatformLootToastModel = {
  variant: "quest" | "game";
  headline: string;
  subhead?: string;
  lines: PlatformLootRewardLine[];
};

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
  storyXpFromFinaleChoice?: boolean;
}): string {
  const m = buildQuestLootToastModel(params);
  const body = m.lines.map((l) => [l.label, l.detail].filter(Boolean).join(" — ")).join("\n");
  return ["🎉 Quest-beloning geclaimd!", body].filter(Boolean).join("\n");
}

export function buildQuestLootToastModel(params: {
  pointsApplied: number;
  flexPercentBp: number;
  flexAppliedCents: number | null;
  flexSkippedReason?: string;
  badgeLabel: string;
  /** Story-XP kwam al bij finale-keuze (HELPEN/STOPPEN); deze claim is flex/badge. */
  storyXpFromFinaleChoice?: boolean;
}): PlatformLootToastModel {
  const lines: PlatformLootRewardLine[] = [];

  if (params.pointsApplied > 0) {
    lines.push({
      icon: "⚡",
      label: `+${params.pointsApplied} XP`,
      detail: "Direct op je account gezet.",
      tone: "xp",
    });
  }

  if (params.flexPercentBp > 0) {
    if (params.flexAppliedCents != null && params.flexAppliedCents > 0) {
      lines.push({
        icon: "💶",
        label: `+${formatFlexCentsNl(params.flexAppliedCents)} flex`,
        detail: `≈ ${(params.flexPercentBp / 100).toFixed(0)}% van je maandcap.`,
        tone: "flex",
      });
    } else {
      const why = humanizeFlexSkipReason(params.flexSkippedReason);
      lines.push({
        icon: "⏸",
        label: `Flexbonus (${(params.flexPercentBp / 100).toFixed(0)}% van cap) niet toegepast`,
        detail: why || "Geen extra flex deze keer.",
        tone: "warn",
      });
    }
  }

  if (params.badgeLabel?.trim()) {
    lines.push({
      icon: "🏅",
      label: params.badgeLabel.trim(),
      detail: "Nieuwe badge ontgrendeld.",
      tone: "badge",
    });
  }

  if (lines.length === 0) {
    lines.push({
      icon: "✓",
      label: "Beloning verwerkt",
      detail: "Je voortgang staat goed.",
      tone: "note",
    });
  }

  const subhead =
    params.storyXpFromFinaleChoice && params.pointsApplied <= 0
      ? "Je story-XP kreeg je al bij je finale-keuze. Hieronder: flex en badge (indien van toepassing)."
      : "Je beloning is toegepast.";

  const questLogHint =
    " Eerdere vragen (per dag, met vraagtekst) en jouw antwoorden vind je onderaan in de quest-modal en op Profiel → Events — niet in deze toast.";

  return {
    variant: "quest",
    headline: "Quest loot binnen",
    subhead: subhead + questLogHint,
    lines,
  };
}

export function buildGameLootToastModel(params: {
  pointsApplied: number;
  flexPercentBp: number;
  flexAppliedCents: number | null;
  flexSkippedReason?: string;
}): PlatformLootToastModel {
  const lines: PlatformLootRewardLine[] = [];

  if (params.pointsApplied > 0) {
    lines.push({
      icon: "⚡",
      label: `+${params.pointsApplied} XP`,
      detail: "Challenge beloond.",
      tone: "xp",
    });
  }

  if (params.flexPercentBp > 0) {
    if (params.flexAppliedCents != null && params.flexAppliedCents > 0) {
      lines.push({
        icon: "💶",
        label: `+${formatFlexCentsNl(params.flexAppliedCents)} flex`,
        detail: `≈ ${(params.flexPercentBp / 100).toFixed(0)}% van je maandcap.`,
        tone: "flex",
      });
    } else {
      const why = humanizeFlexSkipReason(params.flexSkippedReason);
      lines.push({
        icon: "⏸",
        label: `Flexbonus (${(params.flexPercentBp / 100).toFixed(0)}% van cap) niet toegepast`,
        detail: why || "Geen extra flex deze keer.",
        tone: "warn",
      });
    }
  }

  if (lines.length === 0) {
    lines.push({
      icon: "✓",
      label: "Challenge afgerond",
      detail: "Je voortgang is opgeslagen.",
      tone: "note",
    });
  }

  return {
    variant: "game",
    headline: "Challenge cleared",
    subhead: "Loot toegekend.",
    lines,
  };
}

export function buildGameClaimCelebrationMessage(params: {
  pointsApplied: number;
  flexPercentBp: number;
  flexAppliedCents: number | null;
  flexSkippedReason?: string;
}): string {
  const m = buildGameLootToastModel(params);
  const body = m.lines.map((l) => [l.label, l.detail].filter(Boolean).join(" — ")).join("\n");
  return ["🎉 Game-beloning geclaimd!", body].filter(Boolean).join("\n");
}

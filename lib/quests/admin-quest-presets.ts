/**
 * Rij-metadata voor admin quest-formulier bij “preset laden” (naast JSON-inhoud).
 * Zonder dit blijven slug/titel/ondertitel hangen op oude defaultValue in de DOM.
 */
export type AdminQuestCampaignRowPreset = {
  slug: string;
  title: string;
  tagline: string;
  prizeSummary: string;
  rewardXp: number;
  rewardFlexPercentBp: number;
  achievementKey: string;
  badgeLabel: string;
};

/** Standaard Katsuo / continent-quest sjabloon — gelijk aan eerdere form-defaults. */
export const KATSUO_ADMIN_ROW_PRESET: AdminQuestCampaignRowPreset = {
  slug: "katsuo-ji",
  title: "De weg van discipline",
  tagline: "Tien dagen — van continent tot coördinaat.",
  prizeSummary: "",
  rewardXp: 1000,
  rewardFlexPercentBp: 2000,
  achievementKey: "the_unbreakable",
  badgeLabel: "The Unbreakable",
};

/**
 * VIREX 6-daagse cypher + finale-keuze.
 * `reward_xp` 0: story-XP zit in finaleChoice (server); flex/badge via claim.
 */
export const VIREX_ADMIN_ROW_PRESET: AdminQuestCampaignRowPreset = {
  slug: "virex-gebroken-signaal",
  title: "Het gebroken signaal",
  tagline: "Zes dagen lang logfragmenten van codenaam VIREX — ontcijfer, volg het spoor, kies HELPEN of STOPPEN.",
  prizeSummary: "Story-XP via je finale-keuze · flexbonus (indien ingesteld) · badge",
  rewardXp: 0,
  rewardFlexPercentBp: 2000,
  achievementKey: "virex_broken_signal",
  badgeLabel: "Gebroken signaal",
};

export function rowToAdminPreset(row: {
  slug: string;
  title: string;
  tagline: string;
  prize_summary: string | null;
  reward_xp: number;
  reward_flex_percent_bp: number;
  achievement_key: string;
  badge_label: string;
}): AdminQuestCampaignRowPreset {
  return {
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    prizeSummary: row.prize_summary ?? "",
    rewardXp: row.reward_xp,
    rewardFlexPercentBp: row.reward_flex_percent_bp,
    achievementKey: row.achievement_key,
    badgeLabel: row.badge_label,
  };
}

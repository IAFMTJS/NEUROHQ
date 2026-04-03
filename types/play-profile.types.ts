/**
 * Play deck profile: stored in behavior_profile.play_profile (JSONB, can be large).
 * Used only for optional fun / stress relief / challenge suggestions — not clinical or behavior-therapy framing.
 */

export const PLAY_PROFILE_SCHEMA_VERSION = 1 as const;

/** How recharging activities feel for you */
export type PlayEnergyRecharge = "quiet" | "active" | "social" | "mixed";

export type PlayChallengeAppetite = "low" | "medium" | "high";

export type GroceryShopStyle = "big_rare" | "small_often" | "mixed" | "";

/** Known checkbox / select keys — more can exist in `extra` */
export interface PlayProfileDataV1 {
  energy_recharge?: PlayEnergyRecharge | "";
  challenge_appetite?: PlayChallengeAppetite | "";
  grocery_shop_style?: GroceryShopStyle;
  /** Multi-select: music, games, outdoors, creative, cooking, reading, sports, social_light, shopping, pets, film, crafting, puzzles, nature, competitive, chill */
  fun_styles?: string[];
  /** Lowercase topics to avoid in suggested titles (comma-separated in UI, stored as array) */
  avoid_topics?: string[];
  weekday_play_minutes?: number | null;
  weekend_play_minutes?: number | null;
  /** Long free-form: hobbies, routines, anything — feeds keyword matching */
  about_you?: string;
  /** Errands, home, social rhythm — long text */
  daily_life?: string;
  /** Games, shows, sports teams, instruments — long text */
  favorites?: string;
  /** Arbitrary extra fields from future form fields or imports */
  extra?: Record<string, unknown>;
}

export type PlayProfileDocument = {
  schemaVersion: typeof PLAY_PROFILE_SCHEMA_VERSION;
  data: PlayProfileDataV1 & Record<string, unknown>;
};

export const EMPTY_PLAY_PROFILE_DOCUMENT: PlayProfileDocument = {
  schemaVersion: PLAY_PROFILE_SCHEMA_VERSION,
  data: {},
};

export type PlayKind = "fun" | "unwind" | "challenge";

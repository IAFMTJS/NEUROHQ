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
  /** Multi-select play-stijlen (o.a. music, anime, manga, decorating, online_shopping, philosophy, true_crime, kdrama, …) */
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

  /** Chronotype / energie-piek */
  morning_energy?: "early_bird" | "night_owl" | "steady" | "";
  /** Werk / studie context */
  work_context?: "home" | "office" | "hybrid" | "student" | "free" | "";
  /** Met wie woon je ongeveer */
  living_situation?: "alone" | "partner" | "family" | "housemates" | "";
  /** Pendelen */
  commute_band?: "none" | "short" | "medium" | "long" | "";
  /** Sociale batterij */
  social_battery?: "introvert" | "ambivert" | "extravert" | "";
  /** Hoe vaak zie/chat je vrienden/kern (gevoel) */
  friends_rhythm?: "daily" | "weekly" | "monthly" | "sparse" | "";
  /** Schermen na een dag */
  screen_relationship?: "enjoy" | "tired" | "mixed" | "";
  /** Muziek in je leven */
  music_habit?: "always_bg" | "sometimes" | "active_listen" | "rare" | "";
  /** Beweeg-basis */
  movement_baseline?: "low" | "medium" | "high" | "";
  /** Groen / buiten in de buurt */
  outdoor_access?: "city" | "suburbs" | "green_close" | "rural" | "";
  /** Kook-plezier */
  cooking_vibe?: "minimal" | "simple" | "enjoy" | "love_it" | "";
  /** Humor voor play-ideeën */
  humor_vibe?: "silly" | "dry" | "wholesome" | "any" | "";

  /** Weekend-ritme en wat je daar graag doet */
  weekend_vibes?: string;
  /** Kleine dingen die je direct blij maken (1–2 zinnen of opsomming) */
  micro_delights?: string;
  /** Geen play-ideeën over dit (lang; naast vermijden-tags) */
  play_hard_nos?: string;
  /** Geluid, licht, drukte — wat werkt voor jou */
  sensory_notes?: string;
  /** Binnen-hobbies (modelbouw, plants, collectibles…) */
  indoor_hobbies?: string;
  /** Games: genres, platforms, co-op/solo */
  games_and_platforms?: string;
  /** Dagjes weg, steden, natuur die je leuk vindt */
  travel_daydream?: string;
  /** Dieren, planten, tuin */
  animals_and_plants?: string;
  /** Iets nieuws leren voor fun (talen, trivia, skill) */
  learning_for_fun?: string;
  /** Favoriete korte pauze (2–5 min) */
  ideal_microbreak?: string;

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

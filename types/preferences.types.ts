/**
 * User preferences for theme and emotion.
 * Mirrors public.user_preferences (migration 019).
 */

export type ThemeId = "normal" | "girly" | "industrial";
export type ColorMode = "dark" | "light";

export type EmotionKey =
  | "drained"
  | "sleepy"
  | "questioning"
  | "motivated"
  | "excited"
  | "angry"
  | "neon"
  | "hyped"
  | "evil";

export interface UserPreferences {
  theme: ThemeId;
  color_mode: ColorMode;
  selected_emotion: EmotionKey | null;
  compact_ui: boolean;
  reduced_motion: boolean;
  /** Light version: same visuals, minimal animations, fast UI. */
  light_ui: boolean;
  /** Auto-missies uit Master Pool (standaard aan). Wanneer false, geen auto-missies genereren. */
  auto_master_missions: boolean;
   /** Typische vrije dagen (1=Mon..7=Sun) voor zachte planning-bias. */
  usual_days_off?: number[] | null;
  /** 'soft' = bias; 'hard' = vermijd werk-missies tenzij expliciet toegevoegd. */
  day_off_mode?: "soft" | "hard" | null;
  updated_at: string;
}

/** Default preferences (no "use server" – safe to import from server actions). */
export const PREFERENCES_DEFAULTS: UserPreferences = {
  theme: "normal",
  color_mode: "dark",
  selected_emotion: null,
  compact_ui: false,
  reduced_motion: false,
  light_ui: true,
  auto_master_missions: true, // standaard aan
  usual_days_off: null,
  day_off_mode: "soft",
  updated_at: new Date().toISOString(),
};

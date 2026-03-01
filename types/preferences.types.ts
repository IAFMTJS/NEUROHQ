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
  /** Auto-missies uit Master Pool (standaard aan). Wanneer false, geen auto-missies genereren. */
  auto_master_missions: boolean;
  updated_at: string;
}

/** Default preferences (no "use server" – safe to import from server actions). */
export const PREFERENCES_DEFAULTS: UserPreferences = {
  theme: "normal",
  color_mode: "dark",
  selected_emotion: null,
  compact_ui: false,
  reduced_motion: false,
  auto_master_missions: true, // standaard aan
  updated_at: new Date().toISOString(),
};

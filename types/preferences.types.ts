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
  updated_at: string;
}

/** Default preferences (no "use server" – safe to import from server actions). */
export const PREFERENCES_DEFAULTS: UserPreferences = {
  theme: "normal",
  color_mode: "dark",
  selected_emotion: null,
  compact_ui: false,
  updated_at: new Date().toISOString(),
};

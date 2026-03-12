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

export type PushPersonalityMode = "auto" | "stoic" | "friendly" | "coach" | "drill" | "chaos";

export interface UserPreferences {
  theme: ThemeId;
  color_mode: ColorMode;
  selected_emotion: EmotionKey | null;
  compact_ui: boolean;
  reduced_motion: boolean;
  /** Light version: same visuals, minimal animations, fast UI. */
  light_ui: boolean;
  /** Auto-missies uit Master Pool. Default on; user can disable in settings. First-time users only get auto missions after brain state is set. */
  auto_master_missions: boolean;
   /** Typische vrije dagen (1=Mon..7=Sun) voor zachte planning-bias. */
  usual_days_off?: number[] | null;
  /** 'soft' = bias; 'hard' = vermijd werk-missies tenzij expliciet toegevoegd. */
  day_off_mode?: "soft" | "hard" | null;
  /** When true, receive app reminder emails (morning/evening digest, weekly learning). Default on. */
  email_reminders_enabled?: boolean;
  /** Master toggle for scheduled push reminders. Browser permission/subscription still required. */
  push_reminders_enabled?: boolean;
  /** Morning push reminder around local 09:00. */
  push_morning_enabled?: boolean;
  /** Evening push reminder around local 20:00. */
  push_evening_enabled?: boolean;
  /** Weekly learning push reminder. */
  push_weekly_learning_enabled?: boolean;
  /** Personality / tone mode for behavioural push notifications. */
  push_personality_mode?: PushPersonalityMode | null;
  updated_at: string;
}

/** Default preferences for new users: minimal, nothing preset. Set on first use (e.g. settings, first daily state). */
export const PREFERENCES_DEFAULTS: UserPreferences = {
  theme: "normal",
  color_mode: "dark",
  selected_emotion: null,
  compact_ui: false,
  reduced_motion: false,
  light_ui: true,
  auto_master_missions: true,
  usual_days_off: null,
  day_off_mode: null,
  email_reminders_enabled: true,
  push_reminders_enabled: true,
  push_morning_enabled: true,
  push_evening_enabled: true,
  push_weekly_learning_enabled: true,
  push_personality_mode: "auto",
  updated_at: new Date().toISOString(),
};

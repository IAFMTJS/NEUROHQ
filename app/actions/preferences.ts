"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PREFERENCES_DEFAULTS, type UserPreferences } from "@/types/preferences.types";

const DEFAULTS = PREFERENCES_DEFAULTS;

/** Cached per request so dashboard API and multiple callers don't repeat the same Supabase read. */
export const getUserPreferences = cache(async (): Promise<UserPreferences | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // First try: full schema with days-off columns.
  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "theme, color_mode, selected_emotion, compact_ui, reduced_motion, light_ui, auto_master_missions, usual_days_off, day_off_mode, email_reminders_enabled, push_reminders_enabled, push_morning_enabled, push_evening_enabled, push_weekly_learning_enabled, push_personality_mode, updated_at",
    )
    .eq("user_id", user.id)
    .single();

  if (error) {
    // No row yet → let caller fall back to defaults.
    if (error.code === "PGRST116") return null;
    // Column not found (older DB without migration 059): fall back to legacy shape.
    const msg = error.message ?? "";
    if (
      error.code === "42703" ||
      msg.includes("usual_days_off") ||
      msg.includes("day_off_mode") ||
      msg.includes("email_reminders_enabled") ||
      msg.includes("push_reminders_enabled") ||
      msg.includes("push_morning_enabled") ||
      msg.includes("push_evening_enabled") ||
      msg.includes("push_weekly_learning_enabled") ||
      msg.includes("push_personality_mode") ||
      msg.toLowerCase().includes("schema cache")
    ) {
      const { data: legacyData, error: legacyError } = await supabase
        .from("user_preferences")
        .select("theme, color_mode, selected_emotion, compact_ui, reduced_motion, auto_master_missions, updated_at")
        .eq("user_id", user.id)
        .single();
      if (legacyError) {
        if (legacyError.code === "PGRST116") return null;
        throw new Error(legacyError.message);
      }
      if (!legacyData) return null;
      return {
        theme: (legacyData.theme as UserPreferences["theme"]) ?? DEFAULTS.theme,
        color_mode: (legacyData.color_mode as UserPreferences["color_mode"]) ?? DEFAULTS.color_mode,
        selected_emotion: (legacyData.selected_emotion as UserPreferences["selected_emotion"]) ?? null,
        compact_ui: legacyData.compact_ui ?? DEFAULTS.compact_ui,
        reduced_motion: legacyData.reduced_motion ?? DEFAULTS.reduced_motion,
        light_ui: (legacyData as { light_ui?: boolean | null }).light_ui ?? DEFAULTS.light_ui,
        auto_master_missions: legacyData.auto_master_missions ?? DEFAULTS.auto_master_missions,
        usual_days_off: DEFAULTS.usual_days_off ?? null,
        day_off_mode: DEFAULTS.day_off_mode ?? null,
        email_reminders_enabled: DEFAULTS.email_reminders_enabled ?? true,
        push_reminders_enabled: DEFAULTS.push_reminders_enabled ?? true,
        push_morning_enabled: DEFAULTS.push_morning_enabled ?? true,
        push_evening_enabled: DEFAULTS.push_evening_enabled ?? true,
        push_weekly_learning_enabled: DEFAULTS.push_weekly_learning_enabled ?? true,
        push_personality_mode: DEFAULTS.push_personality_mode ?? "auto",
        updated_at: legacyData.updated_at ?? DEFAULTS.updated_at,
      };
    }
    throw new Error(error.message);
  }
  if (!data) return null;
  // Cast to a loose row type so TS doesn't treat it as a SelectQueryError when
  // Supabase schema types lag behind new columns (usual_days_off, day_off_mode).
  const row = data as {
    theme?: UserPreferences["theme"] | null;
    color_mode?: UserPreferences["color_mode"] | null;
    selected_emotion?: UserPreferences["selected_emotion"] | null;
    compact_ui?: boolean | null;
    reduced_motion?: boolean | null;
    light_ui?: boolean | null;
    auto_master_missions?: boolean | null;
    usual_days_off?: number[] | null;
    day_off_mode?: UserPreferences["day_off_mode"] | null;
    email_reminders_enabled?: boolean | null;
    push_reminders_enabled?: boolean | null;
    push_morning_enabled?: boolean | null;
    push_evening_enabled?: boolean | null;
    push_weekly_learning_enabled?: boolean | null;
    push_personality_mode?: UserPreferences["push_personality_mode"] | null;
    updated_at?: string | null;
  };
  return {
    theme: row.theme ?? DEFAULTS.theme,
    color_mode: row.color_mode ?? DEFAULTS.color_mode,
    selected_emotion: row.selected_emotion ?? null,
    compact_ui: row.compact_ui ?? DEFAULTS.compact_ui,
    reduced_motion: row.reduced_motion ?? DEFAULTS.reduced_motion,
    light_ui: row.light_ui ?? DEFAULTS.light_ui,
    auto_master_missions: row.auto_master_missions ?? DEFAULTS.auto_master_missions,
    usual_days_off: row.usual_days_off ?? DEFAULTS.usual_days_off ?? null,
    day_off_mode: row.day_off_mode ?? DEFAULTS.day_off_mode ?? null,
    email_reminders_enabled: row.email_reminders_enabled ?? DEFAULTS.email_reminders_enabled ?? true,
    push_reminders_enabled: row.push_reminders_enabled ?? DEFAULTS.push_reminders_enabled ?? true,
    push_morning_enabled: row.push_morning_enabled ?? DEFAULTS.push_morning_enabled ?? true,
    push_evening_enabled: row.push_evening_enabled ?? DEFAULTS.push_evening_enabled ?? true,
    push_weekly_learning_enabled: row.push_weekly_learning_enabled ?? DEFAULTS.push_weekly_learning_enabled ?? true,
    push_personality_mode: row.push_personality_mode ?? DEFAULTS.push_personality_mode ?? "auto",
    updated_at: row.updated_at ?? DEFAULTS.updated_at,
  };
});

/** Returns preferences or defaults; never null for authenticated user. Deduplicated per request via getUserPreferences cache. */
export async function getUserPreferencesOrDefaults(): Promise<UserPreferences> {
  const prefs = await getUserPreferences();
  return prefs ?? DEFAULTS;
}

type UpdatePayload = Partial<
  Pick<
    UserPreferences,
    "theme" | "color_mode" | "selected_emotion" | "compact_ui" | "reduced_motion" | "light_ui" | "auto_master_missions" | "usual_days_off" | "day_off_mode" | "email_reminders_enabled" | "push_reminders_enabled" | "push_morning_enabled" | "push_evening_enabled" | "push_weekly_learning_enabled" | "push_personality_mode"
  >
>;

export async function updateUserPreferences(payload: UpdatePayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const current = await getUserPreferencesOrDefaults();

  const row = {
    user_id: user.id,
    theme: payload.theme ?? current.theme,
    color_mode: payload.color_mode ?? current.color_mode,
    selected_emotion: payload.selected_emotion !== undefined ? payload.selected_emotion : current.selected_emotion,
    compact_ui: payload.compact_ui ?? current.compact_ui,
    reduced_motion: payload.reduced_motion ?? current.reduced_motion,
    light_ui: payload.light_ui ?? current.light_ui,
    auto_master_missions: payload.auto_master_missions ?? current.auto_master_missions,
    usual_days_off: payload.usual_days_off ?? current.usual_days_off ?? null,
    day_off_mode: payload.day_off_mode ?? current.day_off_mode ?? null,
    email_reminders_enabled: payload.email_reminders_enabled ?? current.email_reminders_enabled ?? true,
    push_reminders_enabled: payload.push_reminders_enabled ?? current.push_reminders_enabled ?? true,
    push_morning_enabled: payload.push_morning_enabled ?? current.push_morning_enabled ?? true,
    push_evening_enabled: payload.push_evening_enabled ?? current.push_evening_enabled ?? true,
    push_weekly_learning_enabled: payload.push_weekly_learning_enabled ?? current.push_weekly_learning_enabled ?? true,
    push_personality_mode: payload.push_personality_mode ?? current.push_personality_mode ?? "auto",
    updated_at: new Date().toISOString(),
  };
  const legacyRow = {
    user_id: user.id,
    theme: row.theme,
    color_mode: row.color_mode,
    selected_emotion: row.selected_emotion,
    compact_ui: row.compact_ui,
    reduced_motion: row.reduced_motion,
    auto_master_missions: row.auto_master_missions,
    updated_at: row.updated_at,
  };

  const first = await supabase
    .from("user_preferences")
    .upsert(row, {
      onConflict: "user_id",
    });

  let finalError = first.error;

  // If DB/schema cache doesn't know about the new columns yet, retry without them (older schema).
  if (finalError) {
    const msg = finalError.message ?? "";
    if (
      finalError.code === "42703" ||
      msg.includes("usual_days_off") ||
      msg.includes("day_off_mode") ||
      msg.includes("light_ui") ||
      msg.includes("email_reminders_enabled") ||
      msg.includes("push_reminders_enabled") ||
      msg.includes("push_morning_enabled") ||
      msg.includes("push_evening_enabled") ||
      msg.includes("push_weekly_learning_enabled") ||
      msg.includes("push_personality_mode") ||
      msg.toLowerCase().includes("schema cache")
    ) {
      const legacy = await supabase
        .from("user_preferences")
        .upsert(legacyRow, {
          onConflict: "user_id",
        });
      finalError = legacy.error;
    }
  }

  if (finalError) throw new Error(finalError.message);
  revalidatePath("/dashboard");
  // Do not revalidate /settings here: it causes the settings page to re-render and
  // remount dynamic components (SettingsDaysOff, SettingsPush), which use loading: null
  // and thus disappear briefly. Client state is already optimistic; fresh data loads on next visit.
}

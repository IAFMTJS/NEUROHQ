"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PREFERENCES_DEFAULTS, type UserPreferences } from "@/types/preferences.types";

const DEFAULTS = PREFERENCES_DEFAULTS;

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // First try: full schema with days-off columns.
  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "theme, color_mode, selected_emotion, compact_ui, reduced_motion, auto_master_missions, usual_days_off, day_off_mode, updated_at",
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
        auto_master_missions: legacyData.auto_master_missions ?? DEFAULTS.auto_master_missions,
        usual_days_off: DEFAULTS.usual_days_off ?? null,
        day_off_mode: DEFAULTS.day_off_mode ?? "soft",
        updated_at: legacyData.updated_at ?? DEFAULTS.updated_at,
      };
    }
    throw new Error(error.message);
  }
  if (!data) return null;
  return {
    theme: (data.theme as UserPreferences["theme"]) ?? DEFAULTS.theme,
    color_mode: (data.color_mode as UserPreferences["color_mode"]) ?? DEFAULTS.color_mode,
    selected_emotion: (data.selected_emotion as UserPreferences["selected_emotion"]) ?? null,
    compact_ui: data.compact_ui ?? DEFAULTS.compact_ui,
    reduced_motion: data.reduced_motion ?? DEFAULTS.reduced_motion,
    auto_master_missions: data.auto_master_missions ?? DEFAULTS.auto_master_missions,
    usual_days_off: (data.usual_days_off as number[] | null) ?? DEFAULTS.usual_days_off ?? null,
    day_off_mode:
      (data.day_off_mode as UserPreferences["day_off_mode"]) ?? DEFAULTS.day_off_mode ?? "soft",
    updated_at: data.updated_at ?? DEFAULTS.updated_at,
  };
}

/** Returns preferences or defaults; never null for authenticated user. */
export async function getUserPreferencesOrDefaults(): Promise<UserPreferences> {
  const prefs = await getUserPreferences();
  return prefs ?? DEFAULTS;
}

type UpdatePayload = Partial<
  Pick<
    UserPreferences,
    "theme" | "color_mode" | "selected_emotion" | "compact_ui" | "reduced_motion" | "auto_master_missions" | "usual_days_off" | "day_off_mode"
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
    auto_master_missions: payload.auto_master_missions ?? current.auto_master_missions,
    usual_days_off: payload.usual_days_off ?? current.usual_days_off ?? null,
    day_off_mode: payload.day_off_mode ?? current.day_off_mode ?? "soft",
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
  revalidatePath("/settings");
}

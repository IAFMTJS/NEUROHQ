"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { PREFERENCES_DEFAULTS, type UserPreferences } from "@/types/preferences.types";

const DEFAULTS = PREFERENCES_DEFAULTS;

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("user_preferences")
    .select("theme, color_mode, selected_emotion, compact_ui, reduced_motion, auto_master_missions, updated_at")
    .eq("user_id", user.id)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // no row
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
    "theme" | "color_mode" | "selected_emotion" | "compact_ui" | "reduced_motion" | "auto_master_missions"
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
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_preferences").upsert(row, {
    onConflict: "user_id",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

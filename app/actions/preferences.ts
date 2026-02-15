"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserPreferences } from "@/types/preferences.types";

const DEFAULTS: UserPreferences = {
  theme: "normal",
  color_mode: "dark",
  selected_emotion: null,
  updated_at: new Date().toISOString(),
};

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("user_preferences")
    .select("theme, color_mode, selected_emotion, updated_at")
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
    updated_at: data.updated_at ?? DEFAULTS.updated_at,
  };
}

/** Returns preferences or defaults; never null for authenticated user. */
export async function getUserPreferencesOrDefaults(): Promise<UserPreferences> {
  const prefs = await getUserPreferences();
  return prefs ?? DEFAULTS;
}

type UpdatePayload = Partial<Pick<UserPreferences, "theme" | "color_mode" | "selected_emotion">>;

export async function updateUserPreferences(payload: UpdatePayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row = {
    user_id: user.id,
    theme: payload.theme ?? "normal",
    color_mode: payload.color_mode ?? "dark",
    selected_emotion: payload.selected_emotion ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("user_preferences").upsert(row, {
    onConflict: "user_id",
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

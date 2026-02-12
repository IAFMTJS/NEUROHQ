"use server";

import { createClient } from "@/lib/supabase/server";

export type DailyStateInput = {
  date: string;
  energy: number | null;
  focus: number | null;
  sensory_load: number | null;
  sleep_hours: number | null;
  social_load: number | null;
};

export async function getDailyState(date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("daily_state")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();
  return data;
}

export type SaveDailyStateResult = { ok: true } | { ok: false; error: string };

export async function saveDailyState(input: DailyStateInput): Promise<SaveDailyStateResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    const row = {
      user_id: user.id,
      date: input.date,
      energy: input.energy ?? null,
      focus: input.focus ?? null,
      sensory_load: input.sensory_load ?? null,
      sleep_hours: input.sleep_hours,
      social_load: input.social_load ?? null,
    };
    const { error } = await supabase.from("daily_state").upsert(row, {
      onConflict: "user_id,date",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save." };
  }
}

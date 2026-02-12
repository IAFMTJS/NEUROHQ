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

export async function saveDailyState(input: DailyStateInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("daily_state").upsert(
    {
      user_id: user.id,
      date: input.date,
      energy: input.energy,
      focus: input.focus,
      sensory_load: input.sensory_load,
      sleep_hours: input.sleep_hours,
      social_load: input.social_load,
    },
    { onConflict: "user_id,date" }
  );
  if (error) throw new Error(error.message);
}

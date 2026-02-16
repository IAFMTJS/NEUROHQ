"use server";

import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
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
  return unstable_cache(
    async () => {
      const client = await createClient();
      const { data } = await client
        .from("daily_state")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", date)
        .single();
      return data;
    },
    ["daily_state", user.id, date],
    { tags: [`daily-${user.id}-${date}`] }
  )();
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
    if (error) {
      const msg = error.code === "PGRST301" || error.message?.includes("auth")
        ? "Je sessie is verlopen. Log opnieuw in."
        : error.message?.includes("daily_state") || error.message?.includes("unique")
          ? "Deze dag staat al in het systeem. Vernieuw de pagina."
          : "Kon dagstatus niet opslaan. Probeer het opnieuw.";
      return { ok: false, error: msg };
    }
    revalidateTag(`daily-${user.id}-${input.date}`);
    revalidatePath("/dashboard");
    revalidatePath("/report");
    const { awardXPForBrainStatus } = await import("./xp");
    const { upsertDailyAnalytics } = await import("./analytics");
    await awardXPForBrainStatus();
    await upsertDailyAnalytics(input.date);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kon dagstatus niet opslaan. Probeer het opnieuw." };
  }
}

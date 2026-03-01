"use server";

import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";

export type DailyStateInput = {
  date: string;
  energy: number | null;
  focus: number | null;
  sensory_load: number | null;
  sleep_hours: number | null;
  social_load: number | null;
  /** 1–10: social/emotional buffer (Brain Circle). */
  mental_battery?: number | null;
  /** 0–100: accumulated pressure; usually set by system, optional in check-in. */
  load?: number | null;
  /** Fase 6: planned rest day → streak shield. */
  is_rest_day?: boolean | null;
};

/** Create a Supabase client that uses only the JWT (no cookies). For use inside unstable_cache. */
function createClientWithToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase config");
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function getDailyState(date: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? "";
  return unstable_cache(
    async (userId: string, dateKey: string, token: string) => {
      const client = createClientWithToken(token);
      const { data } = await client
        .from("daily_state")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateKey)
        .single();
      return data;
    },
    ["daily_state", user.id, date],
    { tags: [`daily-${user.id}-${date}`] }
  )(user.id, date, accessToken);
}

export type SaveDailyStateResult = { ok: true } | { ok: false; error: string };

export async function saveDailyState(input: DailyStateInput): Promise<SaveDailyStateResult> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    // Always persist for server "today" so missions page and dashboard use the same date.
    const serverToday = todayDateString();
    const row = {
      user_id: user.id,
      date: serverToday,
      energy: input.energy ?? null,
      focus: input.focus ?? null,
      sensory_load: input.sensory_load ?? null,
      sleep_hours: input.sleep_hours,
      social_load: input.social_load ?? null,
      mental_battery: input.mental_battery ?? null,
      load: input.load ?? null,
      is_rest_day: input.is_rest_day ?? null,
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
    revalidateTag(`daily-${user.id}-${serverToday}`, "max");
    revalidatePath("/dashboard");
    revalidatePath("/report");
    revalidatePath("/tasks");
    void (async () => {
      try {
        const { awardXPForBrainStatus } = await import("./xp");
        const { upsertDailyAnalytics } = await import("./analytics");
        await awardXPForBrainStatus();
        await upsertDailyAnalytics(serverToday);
      } catch {
        // non-blocking
      }
    })();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kon dagstatus niet opslaan. Probeer het opnieuw." };
  }
}

export type EmotionalStatePreStart = "focused" | "tired" | "resistance" | "distracted" | "motivated";

/** Set emotional state before starting a mission (Psychological layer). */
export async function setEmotionalStatePreStart(date: string, state: EmotionalStatePreStart): Promise<SaveDailyStateResult> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Not signed in." };
    const { data: existing } = await supabase
      .from("daily_state")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", date)
      .single();
    if (existing) {
      const { error } = await supabase
        .from("daily_state")
        .update({ emotional_state: state })
        .eq("user_id", user.id)
        .eq("date", date);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("daily_state").insert({
        user_id: user.id,
        date,
        emotional_state: state,
      });
      if (error) return { ok: false, error: error.message };
    }
    revalidateTag(`daily-${user.id}-${date}`, "max");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kon emotional state niet opslaan." };
  }
}

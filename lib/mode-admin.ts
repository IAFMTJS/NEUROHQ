import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Lightweight helper for cron jobs:
 * check if the user is effectively in HIGH_SENSORY mode for a given day.
 *
 * Definition: daily_state.sensory_load >= 7 for that date.
 * (This mirrors the threshold used in app/actions/mode.ts.)
 */
export async function isHighSensoryDayForUser(
  supabase: SupabaseClient,
  userId: string,
  dateStr: string
): Promise<boolean> {
  if (!userId || !dateStr) return false;

  const { data } = await supabase
    .from("daily_state")
    .select("sensory_load")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();

  const sensory =
    (data as { sensory_load?: number | null } | null)?.sensory_load ?? null;

  return typeof sensory === "number" && sensory >= 7;
}


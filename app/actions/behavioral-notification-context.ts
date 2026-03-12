"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserNotificationContext } from "@/lib/behavioral-notifications";

type ConsistencyRow = {
  date: string;
  missions_completed?: number | null;
};

/**
 * Approximate a simple 0–100 consistency score from user_analytics_daily over
 * the last 14 days. Rough heuristic:
 * - 0 completions day = 0
 * - ≥1 completion day = 100
 * - Score = average over window (so 50% of days with ≥1 completion → ~50).
 */
async function getConsistencyScore(supabase: ReturnType<typeof createClient> extends Promise<infer C> ? C : never, userId: string): Promise<number> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("user_analytics_daily")
    .select("date, missions_completed")
    .eq("user_id", userId)
    .gte("date", sinceStr);

  const rows = (data ?? []) as ConsistencyRow[];
  if (!rows.length) return 0;

  let sum = 0;
  for (const r of rows) {
    const missions = r.missions_completed ?? 0;
    sum += missions > 0 ? 100 : 0;
  }
  const avg = sum / rows.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

/**
 * Load UserNotificationContext for the current authenticated user:
 * - personality mode from user_preferences.push_personality_mode (default auto)
 * - behaviour consistency from user_analytics_daily (last 14 days)
 */
export async function getUserNotificationContext(): Promise<UserNotificationContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("push_personality_mode")
    .eq("user_id", user.id)
    .maybeSingle();

  const personality =
    (prefs as { push_personality_mode?: UserNotificationContext["personalityMode"] | null } | null)
      ?.push_personality_mode ?? "auto";

  const consistencyScore = await getConsistencyScore(supabase, user.id);

  return {
    consistencyScore,
    personalityMode: personality,
  };
}


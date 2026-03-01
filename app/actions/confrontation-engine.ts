"use server";

import { createClient } from "@/lib/supabase/server";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getAvoidanceTracker } from "@/app/actions/avoidance-tracker";
import { trackEvent } from "@/app/actions/analytics-events";
import { computeConfrontationCandidate, type ConfrontationCandidate } from "@/lib/confrontation-missions";

export type ForcedConfrontationForDay = ConfrontationCandidate & {
  date: string;
};

export async function getForcedConfrontationForDay(dateStr: string): Promise<ForcedConfrontationForDay | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profile, tracker, dailyRow] = await Promise.all([
    getBehaviorProfile(),
    getAvoidanceTracker(),
    supabase
      .from("daily_state")
      .select("energy")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .single(),
  ]);

  const energy =
    (dailyRow.data as { energy?: number | null } | null)?.energy ?? null;

  const today = new Date(dateStr + "T12:00:00Z");
  const candidate = computeConfrontationCandidate(tracker, profile, today, energy);
  if (!candidate) return null;

  const { error } = await supabase
    .from("avoidance_tracker")
    .update({
      last_forced_at: new Date().toISOString(),
      last_forced_level: candidate.level,
    })
    .eq("user_id", user.id)
    .eq("tag", candidate.tag);

  if (error) {
    console.error("getForcedConfrontationForDay(update last_forced_*):", error.message);
  }

  await trackEvent("forced_confrontation", {
    tag: candidate.tag,
    level: candidate.level,
  });

  return {
    ...candidate,
    date: dateStr,
  };
}


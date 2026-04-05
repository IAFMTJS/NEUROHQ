"use server";

import { createClient } from "@/lib/supabase/server";
import { todayDateString } from "@/lib/utils/timezone";
import { getMissionSkipCapForUser } from "@/app/actions/quarter-engine-snapshot";

export type MissionOutcomeType = "complete" | "skip" | "reschedule" | "delete";

/** Best-effort audit row for quarter discipline; fails silently if table missing. */
export async function logMissionOutcome(taskId: string, outcome: MissionOutcomeType): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("mission_outcome_events").insert({
      user_id: user.id,
      task_id: taskId,
      outcome,
    });
  } catch {
    // Migration may not be applied in some envs
  }
}

export async function countMissionSkipsTodayForUser(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;
    const day = todayDateString();
    const start = `${day}T00:00:00.000Z`;
    const end = `${day}T23:59:59.999Z`;
    const { count, error } = await supabase
      .from("mission_outcome_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("outcome", "skip")
      .gte("occurred_at", start)
      .lte("occurred_at", end);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Throws when skip cap reached (quarter engine). */
export async function assertMissionSkipAllowed(): Promise<void> {
  const cap = await getMissionSkipCapForUser();
  if (cap == null) return;
  const used = await countMissionSkipsTodayForUser();
  if (used >= cap) {
    throw new Error(
      "Skip-limiet bereikt voor vandaag. De strategy engine beperkt skips als budget en discipline achterliggen — voltooi of plan om."
    );
  }
}

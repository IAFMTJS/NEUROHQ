"use server";

import { createClient } from "@/lib/supabase/server";
import { invalidateUserSnapshotMemoryCaches } from "@/lib/server/snapshot-memory-caches";

/**
 * Carry-over: incomplete tasks that were due on `fromDate` move to `toDate` (typically yesterday → today).
 * Each moved task gets `carry_over_count` incremented so the UI can show backlog depth.
 * Called from hourly cron at the user's local midnight (or manually for dev).
 */
export async function rolloverTasksForUser(userId: string, fromDate: string, toDate: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { moved: 0, error: "Unauthorized" };
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, carry_over_count")
    .eq("user_id", userId)
    .eq("due_date", fromDate)
    .eq("completed", false);

  let moved = 0;
  for (const t of tasks ?? []) {
    const { error } = await supabase
      .from("tasks")
      .update({
        due_date: toDate,
        carry_over_count: (t.carry_over_count ?? 0) + 1,
      })
      .eq("id", t.id);
    if (!error) moved++;
  }
  if (moved > 0) {
    invalidateUserSnapshotMemoryCaches(userId);
  }
  return { moved };
}

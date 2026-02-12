"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Roll over incomplete tasks from fromDate to toDate for the current user.
 * Increments carry_over_count on each moved task.
 * Call from cron (with service role) for each user where it's midnight in their TZ, or for dev.
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
  return { moved };
}

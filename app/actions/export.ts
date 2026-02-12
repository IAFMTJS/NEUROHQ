"use server";

import { createClient } from "@/lib/supabase/server";

export async function exportUserData(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const uid = user.id;
  const [tasks, dailyState, budgetEntries, savingsGoals, learningSessions, educationOptions, calendarEvents, quarterlyStrategy] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", uid),
    supabase.from("daily_state").select("*").eq("user_id", uid),
    supabase.from("budget_entries").select("*").eq("user_id", uid),
    supabase.from("savings_goals").select("*").eq("user_id", uid),
    supabase.from("learning_sessions").select("*").eq("user_id", uid),
    supabase.from("education_options").select("*").eq("user_id", uid),
    supabase.from("calendar_events").select("*").eq("user_id", uid),
    supabase.from("quarterly_strategy").select("*").eq("user_id", uid),
  ]);

  const export_ = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    tasks: tasks.data ?? [],
    daily_state: dailyState.data ?? [],
    budget_entries: budgetEntries.data ?? [],
    savings_goals: savingsGoals.data ?? [],
    learning_sessions: learningSessions.data ?? [],
    education_options: educationOptions.data ?? [],
    calendar_events: calendarEvents.data ?? [],
    quarterly_strategy: quarterlyStrategy.data ?? [],
  };
  return JSON.stringify(export_, null, 2);
}

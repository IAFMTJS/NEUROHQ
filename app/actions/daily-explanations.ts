"use server";

import { createClient } from "@/lib/supabase/server";

export type EveningNoTaskReason = "no_tasks_added" | "no_tasks_completed" | "both";

export async function saveNoTaskExplanation(
  date: string,
  reasonType: EveningNoTaskReason | null,
  explanationText: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const { error } = await supabase.from("daily_explanations").upsert(
    {
      user_id: user.id,
      date,
      reason_type: reasonType,
      explanation_text: explanationText?.trim() || null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export type EveningNoTaskState = {
  shouldShow: boolean;
  alreadySubmitted: boolean;
  tasksTodayCount: number;
  completedTodayCount: number;
};

export async function getEveningNoTaskState(dateStr: string): Promise<EveningNoTaskState | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [tasksRes, completedRes, existingRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("due_date", dateStr)
      .is("deleted_at", null)
      .is("parent_task_id", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("due_date", dateStr)
      .eq("completed", true)
      .is("deleted_at", null),
    supabase
      .from("daily_explanations")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle(),
  ]);

  const tasksTodayCount = tasksRes.count ?? 0;
  const completedTodayCount = completedRes.count ?? 0;
  const alreadySubmitted = !!existingRes.data;

  const shouldShow =
    !alreadySubmitted && (tasksTodayCount === 0 || completedTodayCount === 0);

  return {
    shouldShow,
    alreadySubmitted,
    tasksTodayCount,
    completedTodayCount,
  };
}

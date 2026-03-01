"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addXP } from "@/app/actions/xp";

function getWeekStart(date: Date): string {
  // Monday as start of week to match other budget weekly helpers.
  const day = date.getDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const mon = new Date(date);
  mon.setDate(date.getDate() + monOffset);
  return mon.toISOString().slice(0, 10);
}

export async function getBudgetWeeklyReviewStatus(): Promise<{
  completed: boolean;
  weekStart: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = new Date();
  const weekStart = getWeekStart(today);
  if (!user) {
    return { completed: false, weekStart };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    const { data, error } = await (supabase as any)
      .from("budget_weekly_reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle();
    if (error) return { completed: false, weekStart };
    return { completed: !!data, weekStart };
  } catch {
    // Table may not exist yet – treat as not completed.
    return { completed: false, weekStart };
  }
}

export async function completeBudgetWeeklyReview(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const today = new Date();
  const weekStart = getWeekStart(today);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    await (supabase as any).from("budget_weekly_reviews").upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,week_start" }
    );
  } catch {
    // If table does not exist yet, fail silently; UI will still reflect local completion.
  }

  await addXP(20, { source_type: "budget_weekly_review" });
  revalidatePath("/budget");
  return { ok: true };
}


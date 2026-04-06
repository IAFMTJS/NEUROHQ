"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addXP } from "@/app/actions/xp";
import { getAmsterdamIsoWeekMonday, todayDateString } from "@/lib/utils/timezone";

/** Monday YYYY-MM-DD in Europe/Amsterdam for the week that contains app “today”. */
function getReviewWeekStart(): string {
  return getAmsterdamIsoWeekMonday(todayDateString());
}

export async function getBudgetWeeklyReviewStatus(): Promise<{
  completed: boolean;
  weekStart: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const weekStart = getReviewWeekStart();
  if (!user) {
    return { completed: false, weekStart };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
  const { data, error } = await (supabase as any)
    .from("budget_weekly_reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) return { completed: false, weekStart };
  return { completed: !!data, weekStart };
}

export async function completeBudgetWeeklyReview(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const weekStart = getReviewWeekStart();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: existing, error: selectError } = await db
    .from("budget_weekly_reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (selectError) return { ok: false };

  if (existing) {
    revalidatePath("/budget");
    return { ok: true };
  }

  const { error: upsertError } = await db.from("budget_weekly_reviews").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" }
  );

  if (upsertError) return { ok: false };

  await addXP(20, { source_type: "budget_weekly_review" });
  revalidatePath("/budget");
  return { ok: true };
}

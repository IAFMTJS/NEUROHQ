"use server";

import { createClient } from "@/lib/supabase/server";

/** XP from budget discipline sources (missions + weekly reviews) for the current week. */
export async function getBudgetDisciplineXpThisWeek(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const today = new Date();
    const day = today.getDay();
    const monOffset = day === 0 ? -6 : 1 - day;
    const mon = new Date(today);
    mon.setDate(today.getDate() + monOffset);
    const weekStart = mon.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("xp_events")
      .select("amount, source_type, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekStart + "T00:00:00Z");
    if (error || !data) return 0;

    return (data as { amount: number; source_type: string }[])
      .filter((e) => e.source_type === "budget_discipline" || e.source_type === "budget_weekly_review")
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  } catch {
    return 0;
  }
}


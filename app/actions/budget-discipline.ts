"use server";

import { createClient } from "@/lib/supabase/server";

export type BudgetDisciplineMissionKey = "safe_spend" | "log_all" | "no_impulse";

/** Which budget discipline missions were already completed today (for UI checkboxes). */
export async function getBudgetDisciplineCompletedToday(): Promise<BudgetDisciplineMissionKey[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("xp_events")
      .select("source_type")
      .eq("user_id", user.id)
      .gte("created_at", today + "T00:00:00Z")
      .lt("created_at", today + "T23:59:59.999Z");
    const rows = (data ?? []) as { source_type: string }[];
    const missions: BudgetDisciplineMissionKey[] = [];
    for (const r of rows) {
      if (r.source_type.startsWith("budget_discipline:")) {
        const key = r.source_type.slice("budget_discipline:".length) as BudgetDisciplineMissionKey;
        if (key === "safe_spend" || key === "log_all" || key === "no_impulse") missions.push(key);
      }
    }
    return missions;
  } catch {
    return [];
  }
}

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
      .filter(
        (e) =>
          e.source_type === "budget_weekly_review" || e.source_type.startsWith("budget_discipline")
      )
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  } catch {
    return 0;
  }
}


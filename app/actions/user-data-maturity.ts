"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  computeMaturityFromCounts,
  type UserDataMaturity,
} from "@/lib/user-data-maturity";

export type UserDataMaturitySnapshot = {
  maturity: UserDataMaturity;
  completesLast30: number;
  activeDaysLast30: number;
};

/** Deduped within a single request (missions pipeline calls this from several branches). */
export const getUserDataMaturitySnapshot = cache(async function getUserDataMaturitySnapshot(): Promise<UserDataMaturitySnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { maturity: "sparse", completesLast30: 0, activeDaysLast30: 0 };
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();

  /**
   * Egress-conscious: exact count without row payload, plus a bounded sample for distinct-day
   * estimation (30-day window has at most ~31 calendar days; 500 rows is ample for maturity bands).
   */
  const [{ count }, { data: rows }] = await Promise.all([
    supabase
      .from("task_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "complete")
      .gte("occurred_at", sinceStr),
    supabase
      .from("task_events")
      .select("occurred_at")
      .eq("user_id", user.id)
      .eq("event_type", "complete")
      .gte("occurred_at", sinceStr)
      .order("occurred_at", { ascending: false })
      .limit(500),
  ]);

  const completesLast30 = count ?? 0;

  const days = new Set(
    (rows ?? [])
      .map((r) => {
        const s = (r as { occurred_at: string }).occurred_at;
        return typeof s === "string" ? s.slice(0, 10) : "";
      })
      .filter(Boolean)
  );
  const activeDaysLast30 = days.size;

  const maturity = computeMaturityFromCounts(completesLast30, activeDaysLast30);
  return { maturity, completesLast30, activeDaysLast30 };
});

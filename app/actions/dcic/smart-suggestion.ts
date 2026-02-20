"use server";

import { createClient } from "@/lib/supabase/server";
import { getTodayEngine } from "./today-engine";
import { getXP } from "@/app/actions/xp";
import { xpToNextLevel } from "@/lib/xp";

export interface SmartSuggestion {
  text: string;
  type: "streak" | "level" | "momentum" | "first_mission" | null;
}

/** e.g. "Nog 1 missie voor streak behoud" or "5 minuten nu = 120 XP" or "Je zit 80% naar level up. Doe 1 extra missie." */
export async function getSmartSuggestion(dateStr: string): Promise<SmartSuggestion> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { text: "", type: null };

  const yesterday = new Date(new Date(dateStr).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [engine, xp, streakRow] = await Promise.all([
    getTodayEngine(dateStr),
    getXP(),
    supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single(),
  ]);

  const lastCompletion = (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const streakAtRisk = lastCompletion !== yesterday && lastCompletion !== dateStr;

  if (streakAtRisk && (engine.bucketed.critical.length > 0 || engine.bucketed.high_impact.length > 0)) {
    return {
      text: "Nog 1 missie voor streak behoud.",
      type: "streak",
    };
  }

  const toNext = xpToNextLevel(xp.total_xp);
  const firstHighImpact = engine.bucketed.high_impact[0];
  if (toNext > 0 && toNext <= 150 && firstHighImpact) {
    return {
      text: `Je zit ${Math.round((1 - toNext / 150) * 100)}% naar level up. Voltooi "${firstHighImpact.title.slice(0, 25)}${firstHighImpact.title.length > 25 ? "…" : ""}" en unlock.`,
      type: "level",
    };
  }

  if (engine.bucketed.critical.length > 0 || engine.bucketed.high_impact.length > 0) {
    const top = engine.bucketed.critical[0] ?? engine.bucketed.high_impact[0];
    const xpEst = top?.xpReward ?? 50;
    return {
      text: `5 minuten nu = ~${xpEst} XP. Start met de eerste missie.`,
      type: "first_mission",
    };
  }

  return { text: "", type: null };
}

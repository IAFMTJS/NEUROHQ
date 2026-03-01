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

/** Fase 4: 1–3 concrete suggestions for "Wat nu?" based on capacity + day + history. */
export type AutoSuggestionItem = {
  text: string;
  type: "streak" | "capacity" | "first_task" | "daily_obligation" | "recovery" | "pattern";
};

const DAY_NAMES = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

export async function getAutoSuggestions(dateStr: string): Promise<AutoSuggestionItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [engine, consequence, dailyRow] = await Promise.all([
    getTodayEngine(dateStr),
    import("@/app/actions/consequence-engine").then((m) => m.getConsequenceState(dateStr)),
    supabase
      .from("daily_state")
      .select("energy, focus, load, mental_battery")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle(),
  ]);

  const suggestions: AutoSuggestionItem[] = [];
  const dow = new Date(dateStr + "T12:00:00").getDay();
  const dayName = DAY_NAMES[dow];

  if (engine.streakAtRisk && (engine.bucketed.critical.length > 0 || engine.bucketed.high_impact.length > 0)) {
    suggestions.push({
      text: "Voltooi vandaag minstens 1 missie om je streak te behouden.",
      type: "streak",
    });
  }

  const energy = (dailyRow.data as { energy?: number | null } | null)?.energy ?? null;
  const load = (dailyRow.data as { load?: number | null } | null)?.load ?? null;
  const lowCapacity = energy != null && energy <= 3 || load != null && load >= 70;
  if (lowCapacity && suggestions.every((s) => s.type !== "capacity")) {
    suggestions.push({
      text: "Lage capacity vandaag — kies 1 lichte of recovery-missie.",
      type: "capacity",
    });
  }

  if (consequence.recoveryOnly) {
    suggestions.push({
      text: "Alleen recovery-missies beschikbaar. Kies iets lichts om weer op te laden.",
      type: "recovery",
    });
  }

  const firstTask = engine.bucketed.critical[0] ?? engine.bucketed.high_impact[0];
  if (firstTask && suggestions.length < 3) {
    suggestions.push({
      text: `Start met "${firstTask.title.length > 35 ? firstTask.title.slice(0, 32) + "…" : firstTask.title}" voor ~${firstTask.xpReward} XP.`,
      type: "first_task",
    });
  }

  if (suggestions.length < 2 && (dow === 1 || dow === 0)) {
    suggestions.push({
      text: dow === 1 ? "Start de week met 1 voltooiing." : "Eén missie vandaag houdt je ritme vast.",
      type: "pattern",
    });
  }

  return suggestions.slice(0, 3);
}

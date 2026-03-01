"use server";

import { getXP } from "@/app/actions/xp";
import { getTodayEngine } from "./today-engine";
import { createClient } from "@/lib/supabase/server";
import { levelFromTotalXP } from "@/lib/xp";

export interface XPForecastItem {
  scenario: "all" | "half" | "none";
  label: string;
  levelAfter: number;
  levelUp: boolean;
  streakBreaks: boolean;
  xpGain: number;
}

/** Forecast: if you complete all / 50% / none today — level change and streak. */
export async function getXPForecast(dateStr: string): Promise<XPForecastItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [xp, engine, streakRow] = await Promise.all([
    getXP(),
    getTodayEngine(dateStr),
    supabase.from("user_streak").select("last_completion_date").eq("user_id", user.id).single(),
  ]);

  const yesterday = new Date(new Date(dateStr).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const lastCompletion = (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const streakBreaksIfNoCompletion = lastCompletion !== yesterday && lastCompletion !== dateStr;

  const { bucketed } = engine;
  const totalPossibleXP =
    [...bucketed.critical, ...bucketed.high_impact, ...bucketed.growth_boost].reduce((s, i) => s + (i.xpReward ?? 0), 0) || 80;
  const halfXP = Math.floor(totalPossibleXP / 2);

  const currentLevel = levelFromTotalXP(xp.total_xp);
  const xpAll = xp.total_xp + totalPossibleXP;
  const xpHalf = xp.total_xp + halfXP;
  const levelAfterAll = levelFromTotalXP(xpAll);
  const levelAfterHalf = levelFromTotalXP(xpHalf);

  return [
    {
      scenario: "all",
      label: "Alles vandaag voltooid",
      levelAfter: levelAfterAll,
      levelUp: levelAfterAll > currentLevel,
      streakBreaks: false,
      xpGain: totalPossibleXP,
    },
    {
      scenario: "half",
      label: "50% gedaan",
      levelAfter: levelAfterHalf,
      levelUp: levelAfterHalf > currentLevel,
      streakBreaks: false,
      xpGain: halfXP,
    },
    {
      scenario: "none",
      label: "Niets gedaan",
      levelAfter: currentLevel,
      levelUp: false,
      streakBreaks: streakBreaksIfNoCompletion,
      xpGain: 0,
    },
  ];
}

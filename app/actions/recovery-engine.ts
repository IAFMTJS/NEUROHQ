"use server";
// All exports must be async (Server Actions).

import { revalidateTagMax } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

const RECOVERY_LOAD_BONUS = 20;
const RECOVERY_ENERGY_BONUS = 2; // 1–10 scale (~+15% equivalent)

/**
 * Fase 6.1.1: On recovery task completion, apply Load -20 and Energy +15 (as +2 on 1–10 scale) to the *next* day.
 */
export async function applyRecoveryCompletionBonus(completionDateStr: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const nextDay = new Date(completionDateStr + "T12:00:00");
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const nextStr = nextDay.toISOString().slice(0, 10);

  const { data: row } = await supabase
    .from("daily_state")
    .select("id, load, energy")
    .eq("user_id", user.id)
    .eq("date", nextStr)
    .maybeSingle();

  const currentLoad = (row as { load?: number | null } | null)?.load ?? 0;
  const currentEnergy = (row as { energy?: number | null } | null)?.energy ?? 5;
  const newLoad = Math.max(0, currentLoad - RECOVERY_LOAD_BONUS);
  const newEnergy = Math.min(10, Math.max(1, currentEnergy + RECOVERY_ENERGY_BONUS));

  if (row && (row as { id?: string }).id) {
    await supabase
      .from("daily_state")
      .update({ load: newLoad, energy: newEnergy })
      .eq("user_id", user.id)
      .eq("date", nextStr);
  } else {
    await supabase.from("daily_state").insert({
      user_id: user.id,
      date: nextStr,
      load: newLoad,
      energy: newEnergy,
    });
  }

  revalidateTagMax(`daily-${user.id}-${nextStr}`);
  revalidateTagMax(`energy-${user.id}-${nextStr}`);
  return true;
}

/**
 * Fase 6.2.1 / 6.2.3: Mark a day as rest day (streak shield: no streak decay when 0 completions that day).
 */
export async function setRestDay(dateStr: string, isRestDay: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: row } = await supabase
    .from("daily_state")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  if (row && (row as { id?: string }).id) {
    await supabase.from("daily_state").update({ is_rest_day: isRestDay }).eq("user_id", user.id).eq("date", dateStr);
  } else {
    await supabase.from("daily_state").insert({ user_id: user.id, date: dateStr, is_rest_day: isRestDay });
  }
  revalidateTagMax(`daily-${user.id}-${dateStr}`);
  return true;
}

/** Whether date is marked as rest day. */
export async function isRestDay(dateStr: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: row } = await supabase
    .from("daily_state")
    .select("is_rest_day")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  return (row as { is_rest_day?: boolean | null } | null)?.is_rest_day === true;
}

/**
 * Fase 6.2.2: Burnout detection — 3 days low energy + no/few completions → recovery-first, limit social.
 */
export type BurnoutState = {
  burnout: boolean;
  lowEnergyDays: number;
  completionsInPeriod: number;
};

export async function getBurnoutState(asOfDateStr: string): Promise<BurnoutState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { burnout: false, lowEnergyDays: 0, completionsInPeriod: 0 };

  const asOf = new Date(asOfDateStr + "T12:00:00");
  const day1 = new Date(asOf);
  day1.setUTCDate(day1.getUTCDate() - 2);
  const startStr = day1.toISOString().slice(0, 10);

  const { data: dailyRows } = await supabase
    .from("daily_state")
    .select("date, energy")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", asOfDateStr);

  const energyByDate = new Map<string, number>();
  for (const r of dailyRows ?? []) {
    const d = (r as { date: string }).date;
    const e = (r as { energy?: number | null }).energy;
    if (d && e != null) energyByDate.set(d, e);
  }

  let lowEnergyDays = 0;
  for (let d = new Date(startStr); d <= asOf; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const e = energyByDate.get(dateStr);
    if (e != null && e <= 3) lowEnergyDays++;
  }

  const dayStart = `${startStr}T00:00:00`;
  const dayEnd = `${asOfDateStr}T23:59:59.999`;
  const [tasksRes, behaviourRes] = await Promise.all([
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true).gte("completed_at", dayStart).lte("completed_at", dayEnd),
    supabase.from("behaviour_log").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("mission_completed_at", "is", null).gte("mission_completed_at", dayStart).lte("mission_completed_at", dayEnd),
  ]);
  const completionsInPeriod = (tasksRes.count ?? 0) + (behaviourRes.count ?? 0);

  const burnout = lowEnergyDays >= 3 && completionsInPeriod <= 1;
  return { burnout, lowEnergyDays, completionsInPeriod };
}

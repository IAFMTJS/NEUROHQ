"use server";

import { createClient } from "@/lib/supabase/server";
import {
  determineWeeklyMode,
  getWeeklyModeModifiers,
  type WeeklyTacticalMode,
  type WeeklyModeModifiers,
} from "@/lib/weekly-tactical-mode";
import { getWeeklyPerformanceSnapshot } from "@/app/actions/weekly-performance";

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

export interface WeeklyTacticalState {
  weekStart: string;
  mode: WeeklyTacticalMode;
  modifiers: WeeklyModeModifiers;
  userOverrideUsed: boolean;
}

/** Get current week's tactical mode (from DB or computed). */
export async function getWeeklyTacticalMode(dateStr: string): Promise<WeeklyTacticalState | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const weekStart = getWeekStart(dateStr);
  const { data: row } = await supabase
    .from("weekly_tactical_mode")
    .select("mode, user_override_used")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if (row) {
    const mode = (row as { mode: string }).mode as WeeklyTacticalMode;
    return {
      weekStart,
      mode,
      modifiers: getWeeklyModeModifiers(mode),
      userOverrideUsed: (row as { user_override_used: boolean }).user_override_used ?? false,
    };
  }

  const snapshot = await getWeeklyPerformanceSnapshot();
  const stabilityIndex = snapshot ? (snapshot.performanceIndex ?? 0) / 100 : 0.5;
  const burnoutRisk = snapshot?.recoveryEmphasis ? 0.6 : 0.3;
  const lastMode = await getLastWeekMode(supabase, user.id, weekStart);
  const mode = determineWeeklyMode({
    burnoutRisk,
    stabilityIndex,
    lastMode,
  });
  await supabase.from("weekly_tactical_mode").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      mode,
      user_override_used: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" }
  );
  return {
    weekStart,
    mode,
    modifiers: getWeeklyModeModifiers(mode),
    userOverrideUsed: false,
  };
}

async function getLastWeekMode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  currentWeekStart: string
): Promise<WeeklyTacticalMode | null> {
  const d = new Date(currentWeekStart + "Z");
  d.setUTCDate(d.getUTCDate() - 7);
  const lastWeek = d.toISOString().slice(0, 10);
  const { data: row } = await supabase
    .from("weekly_tactical_mode")
    .select("mode")
    .eq("user_id", userId)
    .eq("week_start", lastWeek)
    .maybeSingle();
  return (row as { mode: string } | null)?.mode as WeeklyTacticalMode | null ?? null;
}

/** User override: change mode once per week. */
export async function setWeeklyTacticalModeOverride(
  dateStr: string,
  mode: WeeklyTacticalMode
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const weekStart = getWeekStart(dateStr);
  const { data: existing } = await supabase
    .from("weekly_tactical_mode")
    .select("user_override_used")
    .eq("user_id", user.id)
    .eq("week_start", weekStart)
    .maybeSingle();

  if ((existing as { user_override_used?: boolean } | null)?.user_override_used) {
    return { ok: false, error: "Al deze week gebruikt. Volgende week opnieuw." };
  }

  const { error } = await supabase.from("weekly_tactical_mode").upsert(
    {
      user_id: user.id,
      week_start: weekStart,
      mode,
      user_override_used: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,week_start" }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

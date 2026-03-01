"use server";

import { createClient } from "@/lib/supabase/server";
import {
  mayEmitChaosMission,
  mayEmitScarcityMission,
  CHAOS_MAX_PER_WEEK,
  SCARCITY_MAX_PER_DAY,
  scarcityDifficultyFromDiscipline,
} from "@/lib/chaos-scarcity";
import { getIdentityDrift } from "@/app/actions/identity-drift";

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

/** Chaos missions this week: count behaviour_log entries with mission_intent = 'chaos' or missions with intent chaos completed this week. */
export async function getChaosCountThisWeek(dateStr: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const weekStart = getWeekStart(dateStr);
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 6);
  const weekEnd = d.toISOString().slice(0, 10);

  const { data: logs } = await supabase
    .from("behaviour_log")
    .select("id")
    .eq("user_id", user.id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .eq("mission_intent", "chaos");
  const fromLogs = logs?.length ?? 0;
  const { data: missions } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_intent", "chaos")
    .eq("completed", true)
    .gte("completed_at", weekStart + "T00:00:00Z")
    .lte("completed_at", weekEnd + "T23:59:59Z");
  const fromMissions = missions?.length ?? 0;
  return Math.max(fromLogs, fromMissions);
}

/** Scarcity count today (offers or completions). */
export async function getScarcityCountToday(dateStr: string): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: missions } = await supabase
    .from("missions")
    .select("id")
    .eq("user_id", user.id)
    .eq("mission_intent", "scarcity")
    .not("expires_at", "is", null)
    .gte("created_at", dateStr + "T00:00:00Z")
    .lte("created_at", dateStr + "T23:59:59Z");
  const created = missions?.length ?? 0;
  const { data: completed } = await supabase
    .from("behaviour_log")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .eq("mission_intent", "scarcity");
  return Math.max(created, completed?.length ?? 0);
}

export interface ChaosScarcityEligibility {
  mayEmitChaos: boolean;
  mayEmitScarcity: boolean;
  chaosCountThisWeek: number;
  scarcityCountToday: number;
  scarcityDifficulty: number;
}

/** Check if user can receive chaos or scarcity mission today. */
export async function getChaosScarcityEligibility(dateStr: string): Promise<ChaosScarcityEligibility | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [chaosCount, scarcityCount, identityDrift] = await Promise.all([
    getChaosCountThisWeek(dateStr),
    getScarcityCountToday(dateStr),
    getIdentityDrift(),
  ]);

  const disciplineIndex = identityDrift?.score.disciplineIndex ?? 50;
  return {
    mayEmitChaos: mayEmitChaosMission(chaosCount),
    mayEmitScarcity: mayEmitScarcityMission(scarcityCount),
    chaosCountThisWeek: chaosCount,
    scarcityCountToday: scarcityCount,
    scarcityDifficulty: scarcityDifficultyFromDiscipline(disciplineIndex),
  };
}

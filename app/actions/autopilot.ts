"use server";

import { createClient } from "@/lib/supabase/server";
import {
  shouldSuggestAutopilot,
  isAutopilotForced,
  AUTOPILOT_REFUSAL_WINDOW_DAYS,
} from "@/lib/autopilot-engine";
import { getIdentityDrift } from "@/app/actions/identity-drift";

export interface AutopilotState {
  suggested: boolean;
  forced: boolean;
  refusalCountLast30: number;
  autopilotDayActive: boolean;
  autopilotDayDate: string | null;
}

/** Get autopilot suggestion state and refusal count. */
export async function getAutopilotState(dateStr: string): Promise<AutopilotState | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - AUTOPILOT_REFUSAL_WINDOW_DAYS);
  const windowStartStr = windowStart.toISOString().slice(0, 10);

  const [refusalsRes, autopilotDayRes, identityDrift] = await Promise.all([
    supabase
      .from("autopilot_refusal")
      .select("id")
      .eq("user_id", user.id)
      .gte("suggested_at", windowStartStr + "T00:00:00Z"),
    supabase
      .from("autopilot_day")
      .select("date, forced")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .maybeSingle(),
    getIdentityDrift(),
  ]);

  const refusalCountLast30 = (refusalsRes.data?.length ?? 0) as number;
  const forced = isAutopilotForced(refusalCountLast30);
  const ad = autopilotDayRes.data as { date?: string; forced?: boolean } | null;
  const autopilotDayActive = ad != null;
  const autopilotDayDate = ad?.date ?? null;

  const volatilityIndex = identityDrift?.score.volatilityIndex ?? 0;
  const avoidanceIndex = identityDrift?.score.avoidanceIndex ?? 0;
  const planningFatigueScore = 0.5;
  const suggested =
    !autopilotDayActive &&
    (forced || shouldSuggestAutopilot({ volatilityIndex, avoidanceIndex, planningFatigueScore }));

  return {
    suggested,
    forced,
    refusalCountLast30,
    autopilotDayActive,
    autopilotDayDate,
  };
}

/** Record refusal (when user declines autopilot suggestion). */
export async function recordAutopilotRefusal(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("autopilot_refusal").insert({
    user_id: user.id,
    suggested_at: new Date().toISOString(),
  });
  return !error;
}

/** Create autopilot day (when user accepts or is forced). */
export async function createAutopilotDay(
  dateStr: string,
  forced: boolean,
  planJson?: { missionIds?: string[]; order?: string[]; recoverySlots?: string[] }
): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase.from("autopilot_day").upsert(
    {
      user_id: user.id,
      date: dateStr,
      forced: forced ?? false,
      plan_json: planJson ?? null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );
  return !error;
}

/** Get autopilot day plan for date. */
export async function getAutopilotDayPlan(dateStr: string): Promise<{
  forced: boolean;
  planJson: { missionIds?: string[]; order?: string[]; recoverySlots?: string[] } | null;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: row } = await supabase
    .from("autopilot_day")
    .select("forced, plan_json")
    .eq("user_id", user.id)
    .eq("date", dateStr)
    .maybeSingle();
  if (!row) return null;
  return {
    forced: (row as { forced: boolean }).forced,
    planJson: (row as { plan_json: unknown }).plan_json as { missionIds?: string[]; order?: string[]; recoverySlots?: string[] } | null,
  };
}

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  xpModifierFromRegretIndex,
  shouldSuggestMissedType,
  REGRET_RESET_COMPLETIONS,
} from "@/lib/regret-mechanic";

export interface RegretState {
  missionType: string;
  missedCount: number;
  completionsSameType: number;
  xpModifier: number;
  suggestMissedType: boolean;
}

/** Get missed opportunity index for a mission type (e.g. "push", "recovery", "social"). */
export async function getRegretForType(missionType: string): Promise<RegretState | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("missed_opportunity_index")
    .select("missed_count, completions_same_type")
    .eq("user_id", user.id)
    .eq("mission_type", missionType)
    .maybeSingle();

  const missedCount = (row as { missed_count?: number } | null)?.missed_count ?? 0;
  const completionsSameType = (row as { completions_same_type?: number } | null)?.completions_same_type ?? 0;
  const effectiveIndex = Math.max(0, missedCount - completionsSameType * (100 / REGRET_RESET_COMPLETIONS));
  const index = Math.min(50, Math.round(effectiveIndex));

  return {
    missionType,
    missedCount,
    completionsSameType,
    xpModifier: xpModifierFromRegretIndex(index),
    suggestMissedType: shouldSuggestMissedType(index),
  };
}

/** Record missed high-value opportunity (call when user dismisses or skips high-value mission). */
export async function recordMissedOpportunity(missionType: string, value: number): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || value < 50) return;

  const { data: existing } = await supabase
    .from("missed_opportunity_index")
    .select("missed_count, last_missed_at")
    .eq("user_id", user.id)
    .eq("mission_type", missionType)
    .maybeSingle();

  const missed_count = ((existing as { missed_count?: number } | null)?.missed_count ?? 0) + 1;
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("missed_opportunity_index").upsert(
    {
      user_id: user.id,
      mission_type: missionType,
      missed_count,
      last_missed_at: today,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,mission_type" }
  );
}

/** On completion of mission type: increment completions_same_type; if >= 3, reset missed_count for that type. */
export async function onCompletionSameType(missionType: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("missed_opportunity_index")
    .select("completions_same_type, missed_count")
    .eq("user_id", user.id)
    .eq("mission_type", missionType)
    .maybeSingle();

  let completionsSameType = ((existing as { completions_same_type?: number } | null)?.completions_same_type ?? 0) + 1;
  let missed_count = (existing as { missed_count?: number } | null)?.missed_count ?? 0;
  if (completionsSameType >= REGRET_RESET_COMPLETIONS) {
    missed_count = 0;
    completionsSameType = 0;
  }

  await supabase.from("missed_opportunity_index").upsert(
    {
      user_id: user.id,
      mission_type: missionType,
      missed_count,
      completions_same_type: completionsSameType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,mission_type" }
  );
}

"use server";

import { createClient } from "@/lib/supabase/server";

/** Resource & Consequence Engine (Fase 2). No guilt, but friction. */
export type ConsequenceState = {
  /** Morning energy 0–1 or budget exhausted → XP -20%, next mission cost +15%. */
  energyDepleted: boolean;
  /** Load > 80 → only recovery missions, higher failure chance. */
  loadOver80: boolean;
  /** Same as loadOver80: show only recovery missions. */
  recoveryOnly: boolean;
  /** Days since last task/mission completion. */
  daysSinceLastCompletion: number;
  /** 5+ days no completions → recovery protocol, streak decay message. */
  recoveryProtocol: boolean;
  /** Next mission costs 15% more when energy depleted. */
  nextMissionCostMultiplier: number;
  /** For UI: last completion date (YYYY-MM-DD) or null. */
  lastCompletionDate: string | null;
  /** Fase 6.2.2: Burnout detected → recovery-first, limit social. */
  burnout: boolean;
};

/** Default when not signed in. */
const DEFAULT_CONSEQUENCE_STATE: ConsequenceState = {
  energyDepleted: false,
  loadOver80: false,
  recoveryOnly: false,
  daysSinceLastCompletion: 0,
  recoveryProtocol: false,
  nextMissionCostMultiplier: 1,
  lastCompletionDate: null,
  burnout: false,
};

/**
 * Get consequence state for a date. Used for XP multiplier, energy cost, recovery-only filter, and UI messages.
 */
export async function getConsequenceState(dateStr: string): Promise<ConsequenceState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_CONSEQUENCE_STATE;

  const [dailyRow, streakRow, completedToday] = await Promise.all([
    supabase
      .from("daily_state")
      .select("energy, focus, sensory_load, load")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .single(),
    supabase
      .from("user_streak")
      .select("last_completion_date")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("due_date", dateStr)
      .eq("completed", true)
      .limit(1),
  ]);

  const energy = (dailyRow.data as { energy?: number | null } | null)?.energy ?? null;
  const sensoryLoad = (dailyRow.data as { sensory_load?: number | null } | null)?.sensory_load ?? null;
  const load = (dailyRow.data as { load?: number | null } | null)?.load ?? null;
  const loadPct = load != null ? load : (sensoryLoad != null ? Math.round((sensoryLoad / 10) * 100) : 50);

  const energyDepleted = energy != null && energy <= 1;
  const loadOver80 = loadPct > 80;
  const nextMissionCostMultiplier = energyDepleted ? 1.15 : 1;

  const lastCompletion = (streakRow.data as { last_completion_date?: string | null } | null)?.last_completion_date ?? null;
  const hasCompletionToday = (completedToday.data?.length ?? 0) > 0;

  let daysSinceLastCompletion = 0;
  if (lastCompletion) {
    const last = new Date(lastCompletion);
    const today = new Date(dateStr);
    daysSinceLastCompletion = Math.round((today.getTime() - last.getTime()) / (24 * 60 * 60 * 1000));
    if (hasCompletionToday) daysSinceLastCompletion = 0;
  }

  const recoveryProtocol = !!lastCompletion && daysSinceLastCompletion >= 5;

  if (recoveryProtocol) {
    const { applyStreakDecayIfInactive } = await import("./streak");
    await applyStreakDecayIfInactive(dateStr);
  }

  const { getBurnoutState } = await import("./recovery-engine");
  const burnoutState = await getBurnoutState(dateStr);
  const burnout = burnoutState.burnout;

  return {
    energyDepleted,
    loadOver80,
    recoveryOnly: loadOver80 || burnout,
    daysSinceLastCompletion,
    recoveryProtocol,
    nextMissionCostMultiplier,
    lastCompletionDate: lastCompletion ?? null,
    burnout,
  };
}

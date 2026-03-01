"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export interface WeeklyBudgetOutcome {
  weekStart: string;
  behaviorIndex: number;
  budgetDisciplineMet: boolean;
  discretionaryChangeCents: number;
  savingsTransferCents: number;
  recoveryAvailable: boolean;
  message: string;
}

const DISCRETIONARY_BONUS_CENTS = 1000;  // +10
const SAVINGS_PENALTY_CENTS = -5000;    // -50 to savings
const HIGH_INDEX_THRESHOLD = 70;
const LOW_INDEX_THRESHOLD = 40;

/** Get last week's budget outcome for UI. */
export async function getWeeklyBudgetOutcome(): Promise<WeeklyBudgetOutcome | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("weekly_budget_adjustment")
    .select("week_start, behavior_index, budget_discipline_met, discretionary_change_cents, savings_transfer_cents, recovery_available")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(1)
    .single();

  const r = row as {
    week_start?: string;
    behavior_index?: number;
    budget_discipline_met?: boolean;
    discretionary_change_cents?: number;
    savings_transfer_cents?: number;
    recovery_available?: boolean;
  } | null;
  if (!r?.week_start) return null;

  let message = "No adjustment this week.";
  if ((r.discretionary_change_cents ?? 0) > 0) {
    message = `+€${(r.discretionary_change_cents! / 100).toFixed(0)} discretionary`;
  } else if ((r.savings_transfer_cents ?? 0) < 0) {
    message = `€${(r.savings_transfer_cents! / 100).toFixed(0)} to savings`;
  }
  if (r.recovery_available) {
    message += ". Complete 3 S-rank missions to unlock budget restore.";
  }

  return {
    weekStart: r.week_start,
    behaviorIndex: r.behavior_index ?? 0,
    budgetDisciplineMet: r.budget_discipline_met ?? true,
    discretionaryChangeCents: r.discretionary_change_cents ?? 0,
    savingsTransferCents: r.savings_transfer_cents ?? 0,
    recoveryAvailable: r.recovery_available ?? false,
    message,
  };
}

/** Compute Weekly Behavior Index and optionally write weekly_budget_adjustment (requires service role). */
export async function computeAndStoreWeeklyBudgetAdjustment(
  userId: string,
  weekStart: string
): Promise<{ behaviorIndex: number; discretionaryCents: number; savingsTransferCents: number }> {
  const supabase = await createClient();
  const weekEnd = getWeekEnd(weekStart);

  const { data: weeklyReport } = await supabase
    .from("weekly_reports")
    .select("performance_index, avg_rank_numeric, consistency_days")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .single();

  const performanceIndex = (weeklyReport as { performance_index?: number } | null)?.performance_index ?? 0;
  const avgRank = (weeklyReport as { avg_rank_numeric?: number } | null)?.avg_rank_numeric ?? 0;
  const consistencyDays = (weeklyReport as { consistency_days?: number } | null)?.consistency_days ?? 0;

  const completionScore = Math.min(40, performanceIndex);
  const rankScore = avgRank ? Math.round((avgRank / 4) * 35) : 0;
  const consistencyScore = Math.round((consistencyDays / 7) * 25);
  let behaviorIndex = completionScore + rankScore + consistencyScore;
  behaviorIndex = Math.max(0, Math.min(100, behaviorIndex));

  const budgetDisciplineMet = await checkBudgetDiscipline(supabase, userId, weekStart, weekEnd);
  if (!budgetDisciplineMet) behaviorIndex = Math.max(0, behaviorIndex - 15);

  let discretionaryChangeCents = 0;
  let savingsTransferCents = 0;
  if (behaviorIndex >= HIGH_INDEX_THRESHOLD) {
    discretionaryChangeCents = DISCRETIONARY_BONUS_CENTS;
  } else if (behaviorIndex < LOW_INDEX_THRESHOLD) {
    savingsTransferCents = SAVINGS_PENALTY_CENTS;
  }

  const sRankCount = await countSRankCompletionsInWeek(supabase, userId, weekStart, weekEnd);
  const recoveryAvailable = behaviorIndex < LOW_INDEX_THRESHOLD && sRankCount < 3;
  const growthUnlockEligible = behaviorIndex >= HIGH_INDEX_THRESHOLD;

  const service = createServiceRoleClient();
  if (service) {
    await service.from("weekly_budget_adjustment").upsert(
      {
        user_id: userId,
        week_start: weekStart,
        behavior_index: behaviorIndex,
        budget_discipline_met: budgetDisciplineMet,
        discretionary_change_cents: discretionaryChangeCents,
        savings_transfer_cents: savingsTransferCents,
        recovery_available: recoveryAvailable,
        growth_unlock_eligible: growthUnlockEligible,
      },
      { onConflict: "user_id,week_start" }
    );
  }

  return {
    behaviorIndex,
    discretionaryCents: discretionaryChangeCents,
    savingsTransferCents,
  };
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

async function checkBudgetDiscipline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<boolean> {
  const { data: targets } = await supabase
    .from("budget_targets")
    .select("category, target_cents")
    .eq("user_id", userId);
  if (!targets?.length) return true;

  const { data: entries } = await supabase
    .from("budget_entries")
    .select("category, amount_cents")
    .eq("user_id", userId)
    .gte("date", weekStart)
    .lte("date", weekEnd);

  const spentByCategory = new Map<string, number>();
  for (const e of entries ?? []) {
    const cat = (e as { category?: string | null }).category ?? "other";
    const amt = (e as { amount_cents: number }).amount_cents;
    spentByCategory.set(cat, (spentByCategory.get(cat) ?? 0) + amt);
  }
  for (const t of targets as { category: string; target_cents: number }[]) {
    const spent = spentByCategory.get(t.category) ?? 0;
    if (spent > t.target_cents * 1.1) return false;
  }
  return true;
}

async function countSRankCompletionsInWeek(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<number> {
  const startTs = weekStart + "T00:00:00Z";
  const endTs = weekEnd + "T23:59:59.999Z";
  const { data: taskEvents } = await supabase
    .from("task_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_type", "complete")
    .eq("performance_rank", "S")
    .gte("occurred_at", startTs)
    .lte("occurred_at", endTs);
  const { data: behaviourLog } = await supabase
    .from("behaviour_log")
    .select("id")
    .eq("user_id", userId)
    .eq("performance_rank", "S")
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .not("mission_completed_at", "is", null);
  return (taskEvents?.length ?? 0) + (behaviourLog?.length ?? 0);
}

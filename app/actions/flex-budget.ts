"use server";

import { createClient } from "@/lib/supabase/server";
import { getFinanceState } from "@/app/actions/dcic/finance-state";
import { getQuarterEngineSnapshot } from "@/app/actions/quarter-engine-snapshot";
import { getBudgetDisciplineXpThisWeek } from "@/app/actions/budget-discipline";
import { getBudgetToday } from "@/lib/utils/budget-date";
import { calculateWeeklyAllowance, getSafeDaysThisWeek } from "@/lib/dcic/finance-engine";
import {
  clampFlexDelta,
  flexLockTier,
  flexRewardMultiplierFromStrategy,
  FLEX_XP_WEEK_TARGET,
  rewardChunkCents,
} from "@/lib/budget/flex-budget-engine";
import { revalidatePath } from "next/cache";
import { getISOWeek, getISOWeekYear } from "date-fns";
import type { Json } from "@/types/database.types";

export type FlexBudgetHeroPayload = {
  enabled: boolean;
  flexCents: number;
  chunkCents: number;
  capMonthlyCents: number;
  maxChunksPerDay: number;
  todayDeltaCents: number;
  weekEarnedCents: number;
  weekLostCents: number;
  lockTier: "critical" | "normal" | "bonus";
  strategyMultiplierLabel: string;
};

type FlexUserRow = {
  flex_budget_cents: number;
  flex_chunk_cents: number;
  flex_cap_monthly_cents: number;
  flex_max_chunks_per_day: number;
  flex_budget_enabled: boolean;
};

function mondayWeekStart(todayStr: string): string {
  const today = new Date(todayStr + "T12:00:00Z");
  const day = today.getUTCDay();
  const monOffset = day === 0 ? -6 : 1 - day;
  const mon = new Date(today);
  mon.setUTCDate(today.getUTCDate() + monOffset);
  return mon.toISOString().slice(0, 10);
}

function isoWeekKeyFromDay(dayStr: string): string {
  const d = new Date(dayStr + "T12:00:00Z");
  const y = getISOWeekYear(d);
  const w = getISOWeek(d);
  return `${y}-W${String(w).padStart(2, "0")}`;
}

async function sumXpEventsWeek(userId: string, weekStart: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xp_events")
    .select("amount")
    .eq("user_id", userId)
    .gte("created_at", `${weekStart}T00:00:00.000Z`);
  if (error || !data) return 0;
  return (data as { amount: number }[]).reduce((s, r) => s + (r.amount ?? 0), 0);
}

async function countSkipsToday(userId: string, day: string): Promise<number> {
  const supabase = await createClient();
  const next = new Date(day + "T12:00:00Z");
  next.setUTCDate(next.getUTCDate() + 1);
  const nextStr = next.toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("mission_outcome_events")
    .select("id")
    .eq("user_id", userId)
    .eq("outcome", "skip")
    .gte("occurred_at", `${day}T00:00:00.000Z`)
    .lt("occurred_at", `${nextStr}T00:00:00.000Z`);
  if (error || !data) return 0;
  return data.length;
}

async function loadFlexUserRow(userId: string): Promise<FlexUserRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("flex_budget_cents, flex_chunk_cents, flex_cap_monthly_cents, flex_max_chunks_per_day, flex_budget_enabled")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return data as FlexUserRow;
}

async function applyFlexLedgerEntry(params: {
  userId: string;
  budgetDay: string;
  idempotencyKey: string;
  reason: string;
  rawDeltaCents: number;
  strategyMultiplierBp: number | null;
  meta: Json;
}): Promise<void> {
  if (params.rawDeltaCents === 0) return;
  const supabase = await createClient();
  const { data: before, error: selErr } = await supabase
    .from("users")
    .select("flex_budget_cents, flex_cap_monthly_cents")
    .eq("id", params.userId)
    .single();
  if (selErr || !before) return;
  const cur = (before as { flex_budget_cents: number; flex_cap_monthly_cents: number }).flex_budget_cents ?? 0;
  const cap = (before as { flex_cap_monthly_cents: number }).flex_cap_monthly_cents ?? 0;
  const applied = clampFlexDelta(cur, cap, params.rawDeltaCents);

  const row = {
    user_id: params.userId,
    budget_day: params.budgetDay,
    delta_cents: applied,
    reason: params.reason,
    idempotency_key: params.idempotencyKey,
    strategy_multiplier_bp: params.strategyMultiplierBp,
    meta: params.meta,
  } as never;
  const { data: insertedRows, error: insErr } = await supabase
    .from("flex_budget_ledger")
    .upsert(row, { onConflict: "user_id,idempotency_key", ignoreDuplicates: true })
    .select("id");
  if (insErr) throw new Error(insErr.message);
  if (!insertedRows?.length) return;

  const next = cur + applied;
  const { error: upErr } = await supabase
    .from("users")
    .update({ flex_budget_cents: Math.max(0, Math.min(cap, next)) })
    .eq("id", params.userId);
  if (upErr) throw new Error(upErr.message);
}

/** One-time bonus: `percentBp` of monthly flex cap (2000 = 20%). Idempotent via ledger key. */
export async function grantFlexPercentOfCapBonus(params: {
  percentBp: number;
  idempotencyKey: string;
  reason: string;
  meta?: Json;
}): Promise<{ appliedCents: number } | { skipped: true; reason: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { skipped: true, reason: "no_user" };
  const row = await loadFlexUserRow(user.id);
  if (!row?.flex_budget_enabled) return { skipped: true, reason: "flex_disabled" };
  const cap = row.flex_cap_monthly_cents ?? 0;
  if (cap <= 0) return { skipped: true, reason: "no_cap" };
  const rawDelta = Math.floor((cap * params.percentBp) / 10000);
  if (rawDelta <= 0) return { skipped: true, reason: "zero_delta" };
  const budgetDay = getBudgetToday();
  await applyFlexLedgerEntry({
    userId: user.id,
    budgetDay,
    idempotencyKey: params.idempotencyKey,
    reason: params.reason,
    rawDeltaCents: rawDelta,
    strategyMultiplierBp: null,
    meta: (params.meta ?? {}) as Json,
  });
  revalidatePath("/budget");
  revalidatePath("/dashboard");
  return { appliedCents: rawDelta };
}

type Candidate = {
  kind: "reward" | "penalty";
  priority: number;
  /** Chunk slots consumed (penalty strategy low = 2). */
  slots: number;
  idempotencyKey: string;
  reason: string;
  rawDeltaCents: number;
  strategyMultiplierBp: number | null;
  meta: Json;
};

/**
 * Idempotent flex evaluation for `budgetDay` (YYYY-MM-DD). Safe to call on each budget page load.
 */
export async function evaluateFlexBudgetForDay(budgetDay: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const row = await loadFlexUserRow(user.id);
  if (!row?.flex_budget_enabled) return;

  const [financeState, quarterSnap, disciplineXpWeek, totalXpWeek, skipsToday] = await Promise.all([
    getFinanceState(),
    getQuarterEngineSnapshot(),
    getBudgetDisciplineXpThisWeek(),
    sumXpEventsWeek(user.id, mondayWeekStart(budgetDay)),
    countSkipsToday(user.id, budgetDay),
  ]);

  const strategyPct = quarterSnap?.strategyScorePct ?? 70;
  const mult = flexRewardMultiplierFromStrategy(strategyPct);
  const multBp = Math.round(mult * 100);
  const discipline = financeState?.disciplineScore ?? 70;
  const weekly = financeState ? calculateWeeklyAllowance(financeState) : null;
  const remainingThisWeek = weekly?.remainingThisWeek ?? 0;
  const safeDays = financeState ? getSafeDaysThisWeek(financeState) : 0;

  const chunk = Math.max(1, row.flex_chunk_cents);
  const maxRewardSlots = Math.max(1, Math.min(10, row.flex_max_chunks_per_day));
  const maxPenaltySlots = maxRewardSlots;
  const isoWeek = isoWeekKeyFromDay(budgetDay);

  const candidates: Candidate[] = [];

  if (remainingThisWeek >= 0) {
    candidates.push({
      kind: "reward",
      priority: 1,
      slots: 1,
      idempotencyKey: `flex:${isoWeek}:reward:week_on_track`,
      reason: "reward_week_on_track",
      rawDeltaCents: rewardChunkCents(chunk, mult),
      strategyMultiplierBp: multBp,
      meta: { remainingThisWeek },
    });
  }

  if (strategyPct > 85) {
    candidates.push({
      kind: "reward",
      priority: 2,
      slots: 1,
      idempotencyKey: `flex:${budgetDay}:reward:strategy_tier`,
      reason: "reward_strategy_high",
      rawDeltaCents: rewardChunkCents(chunk, mult),
      strategyMultiplierBp: multBp,
      meta: { strategyPct },
    });
  }

  if (discipline >= 80) {
    candidates.push({
      kind: "reward",
      priority: 3,
      slots: 1,
      idempotencyKey: `flex:${budgetDay}:reward:discipline_high`,
      reason: "reward_discipline_high",
      rawDeltaCents: rewardChunkCents(chunk, mult),
      strategyMultiplierBp: multBp,
      meta: { discipline },
    });
  }

  if (totalXpWeek >= FLEX_XP_WEEK_TARGET) {
    candidates.push({
      kind: "reward",
      priority: 4,
      slots: 1,
      idempotencyKey: `flex:${isoWeek}:reward:xp_week`,
      reason: "reward_xp_week",
      rawDeltaCents: rewardChunkCents(chunk, mult),
      strategyMultiplierBp: multBp,
      meta: { totalXpWeek, bar: FLEX_XP_WEEK_TARGET },
    });
  }

  if (disciplineXpWeek >= 40) {
    candidates.push({
      kind: "reward",
      priority: 5,
      slots: 1,
      idempotencyKey: `flex:${isoWeek}:reward:budget_discipline_xp`,
      reason: "reward_budget_discipline_xp",
      rawDeltaCents: rewardChunkCents(chunk, mult),
      strategyMultiplierBp: multBp,
      meta: { disciplineXpWeek },
    });
  }

  if (safeDays >= 5) {
    candidates.push({
      kind: "reward",
      priority: 6,
      slots: 1,
      idempotencyKey: `flex:${isoWeek}:reward:calm_week`,
      reason: "reward_calm_days",
      rawDeltaCents: rewardChunkCents(chunk, mult),
      strategyMultiplierBp: multBp,
      meta: { safeDays },
    });
  }

  if (strategyPct < 50) {
    candidates.push({
      kind: "penalty",
      priority: 1,
      slots: 2,
      idempotencyKey: `flex:${budgetDay}:penalty:strategy_low`,
      reason: "penalty_strategy_low",
      rawDeltaCents: -2 * chunk,
      strategyMultiplierBp: null,
      meta: { strategyPct },
    });
  }

  if (discipline < 60) {
    candidates.push({
      kind: "penalty",
      priority: 2,
      slots: 1,
      idempotencyKey: `flex:${budgetDay}:penalty:discipline_low`,
      reason: "penalty_discipline_low",
      rawDeltaCents: -chunk,
      strategyMultiplierBp: null,
      meta: { discipline },
    });
  }

  if (remainingThisWeek < 0) {
    candidates.push({
      kind: "penalty",
      priority: 3,
      slots: 1,
      idempotencyKey: `flex:${budgetDay}:penalty:week_behind`,
      reason: "penalty_week_behind",
      rawDeltaCents: -chunk,
      strategyMultiplierBp: null,
      meta: { remainingThisWeek },
    });
  }

  if (skipsToday >= 3) {
    candidates.push({
      kind: "penalty",
      priority: 4,
      slots: 1,
      idempotencyKey: `flex:${budgetDay}:penalty:skip_burst`,
      reason: "penalty_skip_burst",
      rawDeltaCents: -chunk,
      strategyMultiplierBp: null,
      meta: { skipsToday },
    });
  }

  const rewards = candidates
    .filter((c) => c.kind === "reward")
    .sort((a, b) => a.priority - b.priority);
  const penalties = candidates
    .filter((c) => c.kind === "penalty")
    .sort((a, b) => a.priority - b.priority);

  let rewardSlotsLeft = maxRewardSlots;
  for (const c of rewards) {
    if (rewardSlotsLeft < c.slots) break;
    await applyFlexLedgerEntry({
      userId: user.id,
      budgetDay,
      idempotencyKey: c.idempotencyKey,
      reason: c.reason,
      rawDeltaCents: c.rawDeltaCents,
      strategyMultiplierBp: c.strategyMultiplierBp,
      meta: c.meta,
    });
    rewardSlotsLeft -= c.slots;
  }

  let penaltySlotsLeft = maxPenaltySlots;
  for (const c of penalties) {
    if (penaltySlotsLeft < c.slots) break;
    await applyFlexLedgerEntry({
      userId: user.id,
      budgetDay,
      idempotencyKey: c.idempotencyKey,
      reason: c.reason,
      rawDeltaCents: c.rawDeltaCents,
      strategyMultiplierBp: c.strategyMultiplierBp,
      meta: c.meta,
    });
    penaltySlotsLeft -= c.slots;
  }

  revalidatePath("/budget");
  revalidatePath("/dashboard");
}

export async function getFlexBudgetHeroPayload(): Promise<FlexBudgetHeroPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const row = await loadFlexUserRow(user.id);
  if (!row) return null;

  const today = getBudgetToday();
  const weekStart = mondayWeekStart(today);

  const quarterSnap = await getQuarterEngineSnapshot();
  const strategyPct = quarterSnap?.strategyScorePct ?? 70;
  const mult = flexRewardMultiplierFromStrategy(strategyPct);
  const strategyMultiplierLabel =
    mult === 1.5 ? "+50% beloningen" : mult === 0.5 ? "−50% beloningen" : "normale beloningen";

  if (!row.flex_budget_enabled) {
    return {
      enabled: false,
      flexCents: row.flex_budget_cents,
      chunkCents: row.flex_chunk_cents,
      capMonthlyCents: row.flex_cap_monthly_cents,
      maxChunksPerDay: row.flex_max_chunks_per_day,
      todayDeltaCents: 0,
      weekEarnedCents: 0,
      weekLostCents: 0,
      lockTier: flexLockTier(row.flex_budget_cents),
      strategyMultiplierLabel,
    };
  }

  const { data: ledgerWeek } = await supabase
    .from("flex_budget_ledger")
    .select("delta_cents, budget_day")
    .eq("user_id", user.id)
    .gte("budget_day", weekStart)
    .lte("budget_day", today);

  const { data: ledgerToday } = await supabase
    .from("flex_budget_ledger")
    .select("delta_cents")
    .eq("user_id", user.id)
    .eq("budget_day", today);

  let weekEarned = 0;
  let weekLost = 0;
  for (const r of (ledgerWeek ?? []) as { delta_cents: number }[]) {
    if (r.delta_cents > 0) weekEarned += r.delta_cents;
    else weekLost += Math.abs(r.delta_cents);
  }

  let todayDelta = 0;
  for (const r of (ledgerToday ?? []) as { delta_cents: number }[]) {
    todayDelta += r.delta_cents;
  }

  return {
    enabled: true,
    flexCents: row.flex_budget_cents,
    chunkCents: row.flex_chunk_cents,
    capMonthlyCents: row.flex_cap_monthly_cents,
    maxChunksPerDay: row.flex_max_chunks_per_day,
    todayDeltaCents: todayDelta,
    weekEarnedCents: weekEarned,
    weekLostCents: weekLost,
    lockTier: flexLockTier(row.flex_budget_cents),
    strategyMultiplierLabel,
  };
}

export async function updateFlexBudgetSettings(params: {
  flex_budget_enabled?: boolean;
  flex_chunk_cents?: number | null;
  flex_cap_monthly_cents?: number | null;
  flex_max_chunks_per_day?: number | null;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updates: Record<string, unknown> = {};
  if (params.flex_budget_enabled !== undefined) updates.flex_budget_enabled = params.flex_budget_enabled;
  if (params.flex_chunk_cents != null && params.flex_chunk_cents > 0)
    updates.flex_chunk_cents = Math.round(params.flex_chunk_cents);
  if (params.flex_cap_monthly_cents != null && params.flex_cap_monthly_cents >= 0)
    updates.flex_cap_monthly_cents = Math.round(params.flex_cap_monthly_cents);
  if (params.flex_max_chunks_per_day != null) {
    const n = Math.round(params.flex_max_chunks_per_day);
    updates.flex_max_chunks_per_day = Math.max(1, Math.min(10, n));
  }

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from("users").update(updates).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/budget");
  revalidatePath("/settings");
}

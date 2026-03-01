"use server";

import { createClient } from "@/lib/supabase/server";

const BASE_OVESPEND_DRAIN = 5;
const SAFE_DAYS_BONUS = 5;

async function getEnergyPenaltyMultiplier(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 1;
    const { data } = await supabase
      .from("user_skills")
      .select("skill_key")
      .eq("user_id", user.id);
    const skills = (data ?? []) as { skill_key: string }[];
    const hasFinanceControl = skills.some((s) => s.skill_key === "finance_control_i");
    return hasFinanceControl ? 0.8 : 1;
  } catch {
    return 1;
  }
}

async function adjustEnergy(delta: number): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("daily_state")
      .select("energy")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();
    const current = (data as { energy?: number | null } | null)?.energy ?? 5;
    const next = Math.max(0, Math.min(10, current + delta));
    await supabase.from("daily_state").upsert(
      {
        user_id: user.id,
        date: today,
        energy: next,
      },
      { onConflict: "user_id,date" }
    );
  } catch {
    // If table or column doesn't exist yet, silently ignore.
  }
}

/** Avoid double-applying penalties/bonuses by logging them in a lightweight events table (if present). */
async function eventAlreadyApplied(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string,
  type: "overspend_penalty" | "safe_days_bonus"
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    const { data } = await (supabase as any).from("budget_energy_events")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .eq("type", type)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

async function logEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string,
  type: "overspend_penalty" | "safe_days_bonus"
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table may be missing from generated types
    await (supabase as any).from("budget_energy_events").insert({
      user_id: userId,
      date,
      type,
    });
  } catch {
    // Table may not exist yet; ignore.
  }
}

/** Apply budget-driven energy effects (overspend drain, safe-days bonus) once per relevant period. */
export async function applyBudgetEnergyEffects(params: {
  remainingToSpendCents: number | null;
  safeDaysThisWeek: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const today = new Date().toISOString().slice(0, 10);

  // Overspend: one penalty per day.
  if (params.remainingToSpendCents != null && params.remainingToSpendCents < 0) {
    const already = await eventAlreadyApplied(supabase, user.id, today, "overspend_penalty");
    if (!already) {
      const mult = await getEnergyPenaltyMultiplier();
      const drain = -Math.round(BASE_OVESPEND_DRAIN * mult);
      await adjustEnergy(drain);
      await logEvent(supabase, user.id, today, "overspend_penalty");
    }
  }

  // Safe days bonus: once per week when threshold reached.
  if (params.safeDaysThisWeek != null && params.safeDaysThisWeek >= 3) {
    // Use Monday as "week key" to avoid double bonuses within same week.
    const now = new Date();
    const day = now.getDay();
    const monOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + monOffset);
    const weekKey = monday.toISOString().slice(0, 10);

    const already = await eventAlreadyApplied(supabase, user.id, weekKey, "safe_days_bonus");
    if (!already) {
      await adjustEnergy(SAFE_DAYS_BONUS);
      await logEvent(supabase, user.id, weekKey, "safe_days_bonus");
    }
  }
}


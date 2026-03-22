import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCEPTANCE_RULES = {
  /** Max carry-overs on a single open task before gate. */
  TASK_CARRY_OVER_THRESHOLD: 6,
  /** Emergency expense logs in rolling 30 days. */
  BUDGET_EMERGENCY_LOG_THRESHOLD: 8,
  /** Days after resolving a gate before the same gate type can open again. */
  GATE_COOLDOWN_DAYS: 7,
} as const;

/**
 * Evaluates compliance rules and opens at most one `user_acceptance_gates` row (service role / admin client).
 */
export async function evaluateAcceptanceRulesForUser(
  supabase: SupabaseClient,
  userId: string,
  todayStr: string
): Promise<{ opened: boolean; gateType?: string }> {
  const { data: openGate } = await supabase
    .from("user_acceptance_gates")
    .select("id")
    .eq("user_id", userId)
    .is("resolved_at", null)
    .limit(1)
    .maybeSingle();
  if (openGate) return { opened: false };

  async function recentlyResolvedGate(gateType: string): Promise<boolean> {
    const cutoff = new Date(`${todayStr}T12:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - ACCEPTANCE_RULES.GATE_COOLDOWN_DAYS);
    const { data } = await supabase
      .from("user_acceptance_gates")
      .select("resolved_at")
      .eq("user_id", userId)
      .eq("gate_type", gateType)
      .not("resolved_at", "is", null)
      .order("resolved_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data?.resolved_at) return false;
    return new Date(String(data.resolved_at)).getTime() >= cutoff.getTime();
  }

  const { data: worstTask } = await supabase
    .from("tasks")
    .select("id, carry_over_count, title")
    .eq("user_id", userId)
    .eq("completed", false)
    .is("deleted_at", null)
    .order("carry_over_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (
    worstTask &&
    (worstTask.carry_over_count ?? 0) >= ACCEPTANCE_RULES.TASK_CARRY_OVER_THRESHOLD
  ) {
    if (!(await recentlyResolvedGate("task_defer_threshold"))) {
      await supabase.from("user_acceptance_gates").insert({
        user_id: userId,
        gate_type: "task_defer_threshold",
        payload: {
          message: `Een taak is vaak meegenomen (${worstTask.carry_over_count}×). Neem even de tijd om te herzien of te splitsen.`,
          task_id: worstTask.id,
          title: worstTask.title,
          carry_over_count: worstTask.carry_over_count,
        },
      });
      return { opened: true, gateType: "task_defer_threshold" };
    }
  }

  const since30 = new Date(`${todayStr}T12:00:00Z`);
  since30.setUTCDate(since30.getUTCDate() - 30);
  const since30Str = since30.toISOString().slice(0, 10);

  const { count: emergencyCount } = await supabase
    .from("budget_emergency_expense_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("date", since30Str);

  if ((emergencyCount ?? 0) >= ACCEPTANCE_RULES.BUDGET_EMERGENCY_LOG_THRESHOLD) {
    if (!(await recentlyResolvedGate("budget_compliance"))) {
      await supabase.from("user_acceptance_gates").insert({
        user_id: userId,
        gate_type: "budget_compliance",
        payload: {
          message:
            "Er zijn meerdere nooduitgaven geregistreerd in de laatste 30 dagen. Laten we even checken of dit klopt bij je plan.",
          emergency_count_30d: emergencyCount,
        },
      });
      return { opened: true, gateType: "budget_compliance" };
    }
  }

  return { opened: false };
}

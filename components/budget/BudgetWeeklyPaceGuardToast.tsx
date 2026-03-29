"use client";

import { useEffect, useRef } from "react";
import {
  resolveWeeklyAllowanceCents,
  toastWeeklyPaceNearCapNl,
  toastWeeklyPaceOverNl,
} from "@/lib/ui/budget-guardrail-toasts";

const STORAGE_PREFIX = "budget_weekly_pace_guard_";

type Props = {
  historyMode: boolean;
  spendableCents: number;
  budgetPeriod: "monthly" | "weekly";
  periodStart: string;
  periodEnd: string;
  weekSpentCents: number;
};

/**
 * Once per day, when calendar-week spend crosses ~85% of the prorated weekly slice of the budget envelope.
 */
export function BudgetWeeklyPaceGuardToast({
  historyMode,
  spendableCents,
  budgetPeriod,
  periodStart,
  periodEnd,
  weekSpentCents,
}: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (typeof window === "undefined") return;
    if (historyMode) return;

    const allowance = resolveWeeklyAllowanceCents(spendableCents, budgetPeriod, periodStart, periodEnd);
    if (allowance <= 0) return;

    const ratio = weekSpentCents / allowance;
    if (ratio < 0.85) return;

    const band = ratio >= 1 ? "over" : "near";
    const today = new Date().toISOString().slice(0, 10);
    const key = `${STORAGE_PREFIX}${today}_${band}`;

    try {
      const storage = window.localStorage ?? null;
      if (storage?.getItem(key)) return;

      fired.current = true;
      if (band === "over") toastWeeklyPaceOverNl();
      else toastWeeklyPaceNearCapNl();
      storage?.setItem(key, "1");
    } catch {
      // ignore
    }
  }, [historyMode, spendableCents, budgetPeriod, periodStart, periodEnd, weekSpentCents]);

  return null;
}

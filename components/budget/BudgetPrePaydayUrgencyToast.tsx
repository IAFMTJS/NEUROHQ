"use client";

import { useEffect, useRef } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";

const STORAGE_KEY_PREFIX = "budget_prepayday_urgency_toast_";

type Props = {
  daysToPayday: number | null;
  needsPaydaySurvey: boolean;
  hasRecentSurvey: boolean;
};

type ToastPlan = {
  keyLevel: "watch" | "priority" | "high" | "critical";
  message: string;
  className: string;
  duration: number;
  variant: "info" | "warning" | "error";
};

function resolveToastPlan(
  daysToPayday: number | null,
  needsPaydaySurvey: boolean,
  hasRecentSurvey: boolean
): ToastPlan | null {
  if (daysToPayday == null || hasRecentSurvey) return null;
  if (daysToPayday > 7) return null;

  if (daysToPayday <= 1) {
    return {
      keyLevel: "critical",
      message:
        "Kritiek: payday bijna nu. Rond je pre-payday reflectie direct af om blokkades in je budgetflow te voorkomen.",
      className: "hq-toast hq-toast-prepayday hq-toast-prepayday-critical",
      duration: 12000,
      variant: "error",
    };
  }

  if (daysToPayday <= 2) {
    return {
      keyLevel: "high",
      message:
        "Urgent: nog 2 dagen tot payday. Vul je pre-payday reflectie nu in zodat je budgetcyclus strak blijft.",
      className: "hq-toast hq-toast-prepayday hq-toast-prepayday-high",
      duration: 10000,
      variant: "warning",
    };
  }

  if (daysToPayday <= 4 || needsPaydaySurvey) {
    return {
      keyLevel: "priority",
      message:
        "Prioriteit: pre-payday reflectie staat open (T-4). Werk dit vandaag af om de cyclus correct af te sluiten.",
      className: "hq-toast hq-toast-prepayday hq-toast-prepayday-priority",
      duration: 9000,
      variant: "warning",
    };
  }

  return {
    keyLevel: "watch",
    message:
      "Payday nadert deze week. Plan je pre-payday reflectie nu al om last-minute druk te voorkomen.",
    className: "hq-toast hq-toast-prepayday hq-toast-prepayday-watch",
    duration: 7000,
    variant: "info",
  };
}

/** Escalating once-per-day reminder as payday approaches. */
export function BudgetPrePaydayUrgencyToast({
  daysToPayday,
  needsPaydaySurvey,
  hasRecentSurvey,
}: Props) {
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    if (typeof window === "undefined") return;

    const plan = resolveToastPlan(daysToPayday, needsPaydaySurvey, hasRecentSurvey);
    if (!plan) return;

    const today = new Date().toISOString().slice(0, 10);
    const key = `${STORAGE_KEY_PREFIX}${today}_${plan.keyLevel}`;
    try {
      const storage = window.localStorage ?? null;
      if (storage && storage.getItem(key)) return;

      shown.current = true;
      if (plan.variant === "error") {
        neuroToast.error(plan.message, { id: key, duration: plan.duration, className: plan.className });
      } else if (plan.variant === "warning") {
        neuroToast.warning(plan.message, { id: key, duration: plan.duration, className: plan.className });
      } else {
        neuroToast.info(plan.message, { id: key, duration: plan.duration, className: plan.className });
      }
      storage?.setItem(key, "1");
    } catch {
      // noop
    }
  }, [daysToPayday, hasRecentSurvey, needsPaydaySurvey]);

  return null;
}


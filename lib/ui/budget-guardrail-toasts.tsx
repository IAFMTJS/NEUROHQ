"use client";

import { neuroToast } from "@/lib/ui/neuro-toast";

export const HQ_TOAST_BASE = "hq-toast";
/** Amber guardrail shell — matches Visual Lab “warning” preview. */
export const HQ_TOAST_GUARD_WARNING = `${HQ_TOAST_BASE} hq-toast-guardrail-warning`;
/** Hard block — same chrome as pre-payday critical / Visual Lab “blocked”. */
export const HQ_TOAST_GUARD_CRITICAL = `${HQ_TOAST_BASE} hq-toast-prepayday hq-toast-prepayday-critical`;
export const HQ_TOAST_PRE_PAYDAY_PRIORITY = `${HQ_TOAST_BASE} hq-toast-prepayday hq-toast-prepayday-priority`;

export function toastWeeklyPaceNearCapNl(): void {
  neuroToast.warning(
    "Je zit dicht tegen je weektempo voor dit budget — neem discretionair iets rustiger aan.",
    { duration: 5_000, className: HQ_TOAST_GUARD_WARNING, id: "budget-weekly-pace-near" }
  );
}

export function toastWeeklyPaceOverNl(): void {
  neuroToast.warning(
    "Deze week ligt je uitgaventempo boven je evenredige weekdeel. Houd discretionair strak tot de week kantelt.",
    { duration: 6_000, className: HQ_TOAST_GUARD_WARNING, id: "budget-weekly-pace-over" }
  );
}

/** Visual Lab / demos — English copy, production styling. */
export function demoToastWeeklyBurnWarningEn(): void {
  neuroToast.warning("Approaching weekly burn cap — pace discretionary spend.", {
    duration: 5_000,
    className: HQ_TOAST_GUARD_WARNING,
  });
}

export function demoToastSpendLockBlockedEn(): void {
  neuroToast.error("Action blocked: lock window active until 06:00.", {
    duration: 6_000,
    className: HQ_TOAST_GUARD_CRITICAL,
  });
}

export function demoToastSnapshotInfoEn(): void {
  neuroToast.info("Snapshot saved to local preview queue (mock).", { duration: 4_000, className: HQ_TOAST_BASE });
}

/** Map server validation errors from budget entry actions to the same toast chrome as Visual Lab. */
export function toastForBudgetEntryError(
  message: string,
  options?: { fallbackToast?: boolean }
): void {
  const m = message.trim();
  if (!m) return;
  if (m.includes("Budget lock") || m.includes("nooduitgaven")) {
    neuroToast.error(m, { duration: 6_500, className: HQ_TOAST_GUARD_CRITICAL });
    return;
  }
  if (m.includes("pre-payday") || m.includes("Pre-payday")) {
    neuroToast.warning(m, { duration: 8_000, className: HQ_TOAST_PRE_PAYDAY_PRIORITY });
    return;
  }
  if (options?.fallbackToast) {
    neuroToast.error(m, { duration: 5_000 });
  }
}

export function periodLengthDaysInclusive(periodStart: string, periodEnd: string): number {
  const start = new Date(`${periodStart}T12:00:00Z`).getTime();
  const end = new Date(`${periodEnd}T12:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 7;
  return Math.max(1, Math.floor((end - start) / 86_400_000) + 1);
}

/** Prorated week slice of the period envelope (calendar-week spend vs this target). */
export function resolveWeeklyAllowanceCents(
  spendableCents: number,
  budgetPeriod: "monthly" | "weekly",
  periodStart: string,
  periodEnd: string
): number {
  if (spendableCents <= 0) return 0;
  if (budgetPeriod === "weekly") return spendableCents;
  const d = periodLengthDaysInclusive(periodStart, periodEnd);
  return Math.round((spendableCents * Math.min(7, d)) / d);
}

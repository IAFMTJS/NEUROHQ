"use client";

import { useEffect, useState } from "react";
import {
  getBudgetToday,
  getNextPaydayDateFromDay,
  getNextPaydayDateNextMonth,
} from "@/lib/utils/budget-date";

const BUDGET_KEY = "hq-pending-budget";
const BUDGET_EVENT = "neurohq-budget-saved";
const MAX_SNAPSHOT_AGE_MS = 15 * 60 * 1000;

export type PendingBudgetIncomeSource = {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  type: "monthly" | "weekly" | "biweekly";
};

export type PendingBudgetSnapshot = {
  monthlyBudgetCents?: number | null;
  monthlySavingsCents?: number | null;
  budgetPeriod?: "monthly" | "weekly";
  currency?: string;
  budgetRemainingCents?: number | null;
  paydayDayOfMonth?: number | null;
  lastPaydayDate?: string | null;
  cycleStartDate?: string | null;
  nextPaydayDate?: string | null;
  daysUntilNextIncome?: number;
  incomeSources?: PendingBudgetIncomeSource[];
  updatedAt: number;
  synced?: boolean;
};

function dispatchBudgetEvent(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(BUDGET_EVENT));
  } catch {
    // ignore
  }
}

function readBudgetSnapshot(): PendingBudgetSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BUDGET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingBudgetSnapshot;
    if (!parsed || typeof parsed.updatedAt !== "number") return null;
    const isFresh = parsed.synced !== true || Date.now() - parsed.updatedAt < MAX_SNAPSHOT_AGE_MS;
    if (!isFresh) {
      window.localStorage.removeItem(BUDGET_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getPendingBudgetSnapshot(): PendingBudgetSnapshot | null {
  return readBudgetSnapshot();
}

export function usePendingBudgetSnapshot(): PendingBudgetSnapshot | null {
  const [snapshot, setSnapshot] = useState<PendingBudgetSnapshot | null>(() => readBudgetSnapshot());

  useEffect(() => {
    const onChange = () => setSnapshot(readBudgetSnapshot());
    onChange();
    window.addEventListener(BUDGET_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(BUDGET_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return snapshot;
}

export function setPendingBudgetSnapshot(
  patch: Partial<Omit<PendingBudgetSnapshot, "updatedAt" | "synced">>
): PendingBudgetSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const current = readBudgetSnapshot();
    const next: PendingBudgetSnapshot = {
      ...(current ?? { updatedAt: Date.now() }),
      ...patch,
      updatedAt: Date.now(),
      synced: false,
    };
    window.localStorage.setItem(BUDGET_KEY, JSON.stringify(next));
    dispatchBudgetEvent();
    return next;
  } catch {
    return null;
  }
}

export function markPendingBudgetSynced(): void {
  if (typeof window === "undefined") return;
  try {
    const current = readBudgetSnapshot();
    if (!current) return;
    const next: PendingBudgetSnapshot = {
      ...current,
      updatedAt: Date.now(),
      synced: true,
    };
    window.localStorage.setItem(BUDGET_KEY, JSON.stringify(next));
    dispatchBudgetEvent();
  } catch {
    // ignore
  }
}

export function clearPendingBudgetSnapshot(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(BUDGET_KEY);
    dispatchBudgetEvent();
  } catch {
    // ignore
  }
}

export function derivePendingBudgetRemaining(
  monthlyBudgetCents: number | null | undefined,
  monthlySavingsCents: number | null | undefined,
  expensesCents: number
): number {
  const spendableCents = Math.max(0, (monthlyBudgetCents ?? 0) - (monthlySavingsCents ?? 0));
  return spendableCents - expensesCents;
}

export function getPrimaryPaydayDay(
  incomeSources: PendingBudgetIncomeSource[] | undefined,
  fallbackDay: number | null | undefined
): number {
  return incomeSources?.[0]?.dayOfMonth ?? fallbackDay ?? 25;
}

export function derivePendingPayday(
  paydayDayOfMonth: number,
  lastPaydayDate?: string | null
): Pick<PendingBudgetSnapshot, "cycleStartDate" | "nextPaydayDate" | "daysUntilNextIncome"> {
  const day = Math.max(1, Math.min(31, paydayDayOfMonth));
  const today = getBudgetToday();
  const nextPaydayDate = lastPaydayDate
    ? getNextPaydayDateNextMonth(lastPaydayDate, day)
    : getNextPaydayDateFromDay(today, day);
  const todayMs = new Date(today + "T12:00:00Z").getTime();
  const nextMs = new Date(nextPaydayDate + "T12:00:00Z").getTime();
  return {
    cycleStartDate: lastPaydayDate ?? null,
    nextPaydayDate,
    daysUntilNextIncome: Math.max(0, Math.ceil((nextMs - todayMs) / 86400000)),
  };
}

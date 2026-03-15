"use client";

/**
 * Optimistic payday state only. Server (users.last_payday_date, users.payday_day_of_month) is the source of truth.
 * Use this for immediate UI after "Vandaag loon gehad" or payday day change; after sync, rely on server state (router.refresh()).
 */
import { useEffect, useState } from "react";
import { getBudgetToday, getNextPaydayDateFromDay, getNextPaydayDateNextMonth } from "@/lib/utils/budget-date";

const PAYDAY_KEY = "neurohq-payday";
const PAYDAY_EVENT = "neurohq-payday-change";

export type PersistedPayday = {
  lastPaydayDate: string | null;
  paydayDayOfMonth: number | null;
  updatedAt: number;
};

function dispatchPaydayEvent(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(PAYDAY_EVENT));
  } catch {
    // ignore
  }
}

function readPersistedPayday(): PersistedPayday | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PAYDAY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedPayday;
    if (!parsed || typeof parsed.updatedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Get persisted payday from localStorage (user-specific, never auto-cleared). */
export function getPersistedPayday(): PersistedPayday | null {
  return readPersistedPayday();
}

/** Hook so the card re-renders when persisted payday changes. */
export function usePersistedPayday(): PersistedPayday | null {
  const [payday, setPayday] = useState<PersistedPayday | null>(() => readPersistedPayday());

  useEffect(() => {
    const onChange = () => setPayday(readPersistedPayday());
    onChange();
    window.addEventListener(PAYDAY_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PAYDAY_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return payday;
}

/** Save payday to localStorage (overwrites previous). Sync to Supabase separately. */
export function setPersistedPayday(patch: {
  lastPaydayDate?: string | null;
  paydayDayOfMonth?: number | null;
}): PersistedPayday | null {
  if (typeof window === "undefined") return null;
  try {
    const current = readPersistedPayday();
    const next: PersistedPayday = {
      lastPaydayDate: patch.lastPaydayDate !== undefined ? patch.lastPaydayDate : (current?.lastPaydayDate ?? null),
      paydayDayOfMonth: patch.paydayDayOfMonth !== undefined ? patch.paydayDayOfMonth : (current?.paydayDayOfMonth ?? null),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(PAYDAY_KEY, JSON.stringify(next));
    dispatchPaydayEvent();
    return next;
  } catch {
    return null;
  }
}

/** Derive period/days from persisted or server payday (for display). */
export function derivePaydayDisplay(
  lastPaydayDate: string | null,
  paydayDayOfMonth: number | null
): { cycleStartDate: string | null; nextPaydayDate: string; daysUntilNextIncome: number } {
  const today = getBudgetToday();
  const day = paydayDayOfMonth != null ? Math.max(1, Math.min(31, paydayDayOfMonth)) : 25;
  const nextPaydayDate = lastPaydayDate && /^\d{4}-\d{2}-\d{2}$/.test(lastPaydayDate)
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

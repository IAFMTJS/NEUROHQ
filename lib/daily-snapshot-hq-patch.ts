"use client";

import { getTodayKey } from "@/lib/daily-date";
import {
  loadDailySnapshot,
  saveDailySnapshotWithRetries,
  isCurrentSnapshot,
} from "@/lib/daily-snapshot-storage";
import { applyPendingOverlaysToSnapshot } from "@/lib/daily-snapshot-full-sync";
import { useHQStore } from "@/lib/hq-store";
import type { DailySnapshot } from "@/types/daily-snapshot";

let patchDebounce: ReturnType<typeof setTimeout> | null = null;

/** Debounced: merge today’s tasks, brain slice, DCIC, and budget from HQ store into the persisted snapshot. */
export function schedulePatchDailySnapshotFromHQStore(delayMs = 420): void {
  if (typeof window === "undefined") return;
  if (patchDebounce) clearTimeout(patchDebounce);
  patchDebounce = setTimeout(() => {
    patchDebounce = null;
    void patchDailySnapshotFromHQStore();
  }, delayMs);
}

function overlayBudgetFromStore(
  base: NonNullable<DailySnapshot["budget"]>,
  store: Record<string, unknown> | null
): NonNullable<DailySnapshot["budget"]> {
  if (!store) return base;
  const s = store;
  return {
    ...base,
    ...(typeof s.budgetRemainingCents === "number" ? { budgetRemainingCents: s.budgetRemainingCents } : {}),
    ...(s.currentMonthExpenses !== undefined ? { currentMonthExpenses: s.currentMonthExpenses as number | null } : {}),
    ...(s.currentMonthIncome !== undefined ? { currentMonthIncome: s.currentMonthIncome as number | null } : {}),
    ...(s.currentWeekExpenses !== undefined ? { currentWeekExpenses: s.currentWeekExpenses as number | null } : {}),
    ...(s.currentWeekIncome !== undefined ? { currentWeekIncome: s.currentWeekIncome as number | null } : {}),
    ...(s.disciplineScore !== undefined ? { disciplineScore: s.disciplineScore as number | null } : {}),
    ...(typeof s.disciplineXpThisWeek === "number" ? { disciplineXpThisWeek: s.disciplineXpThisWeek } : {}),
    ...(typeof s.disciplineCompletedToday === "boolean" ? { disciplineCompletedToday: s.disciplineCompletedToday } : {}),
    ...(s.daysUnderBudgetThisWeek !== undefined
      ? { daysUnderBudgetThisWeek: s.daysUnderBudgetThisWeek as number | null }
      : {}),
    ...(s.unplannedSummary && typeof s.unplannedSummary === "object"
      ? { unplannedSummary: s.unplannedSummary as { count: number; totalCents: number } }
      : {}),
    ...(s.settings && typeof s.settings === "object"
      ? { settings: { ...base.settings, ...(s.settings as Record<string, unknown>) } }
      : {}),
    ...(s.financeState !== undefined ? { financeState: s.financeState } : {}),
    ...(s.financialInsights !== undefined ? { financialInsights: s.financialInsights } : {}),
  };
}

export async function patchDailySnapshotFromHQStore(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const existing = await loadDailySnapshot();
    const today = getTodayKey();
    if (!existing || !isCurrentSnapshot(existing) || existing.date !== today) return;
    if (!existing.missions) return;

    const { tasksByDate, todayDailyState, budgetSnapshot, gameState } = useHQStore.getState();

    const tasksPatch =
      Object.prototype.hasOwnProperty.call(tasksByDate, today) && Array.isArray(tasksByDate[today])
        ? { [today]: tasksByDate[today] as unknown[] }
        : {};

    let next: DailySnapshot = {
      ...existing,
      missions: {
        ...existing.missions,
        dateStr: today,
        tasksByDate: {
          ...existing.missions.tasksByDate,
          ...tasksPatch,
        },
        dailyState:
          todayDailyState != null
            ? {
                ...(existing.missions.dailyState as Record<string, unknown> | null),
                ...todayDailyState,
              }
            : existing.missions.dailyState,
      },
      ...(gameState != null ? { dcicGameState: gameState } : {}),
    };

    if (budgetSnapshot && next.budget) {
      next = {
        ...next,
        budget: overlayBudgetFromStore(next.budget, budgetSnapshot as Record<string, unknown>),
      };
    }

    next = applyPendingOverlaysToSnapshot(next);
    next = {
      ...next,
      ui: {
        ...next.ui,
        savedAt: Date.now(),
      },
    };

    const persist = await saveDailySnapshotWithRetries(next);
    if (persist.ok) {
      try {
        window.dispatchEvent(new CustomEvent("neurohq-daily-snapshot-updated"));
      } catch {
        // ignore
      }
    }
  } catch (e) {
    console.warn("[daily-snapshot-hq-patch] patch failed", e);
  }
}

"use client";

/**
 * Full merge of all DailySnapshot slices from the network + local pending overlays.
 * Use after mutations, on hide, and periodically so IndexedDB/localStorage snapshot
 * stays aligned without relying on full rerenders.
 *
 * Bootstrap `dcicGameState` includes day-locked DCIC mode (server `daily_state.dcic_mode`);
 * merging replaces the cached copy so offline first-paint matches the same rules as the API.
 */

import { getTodayKey } from "@/lib/daily-date";
import {
  loadDailySnapshot,
  saveDailySnapshotWithRetries,
  isCurrentSnapshot,
} from "@/lib/daily-snapshot-storage";
import { getPendingDailyState } from "@/lib/client-pending-writes";
import { getPendingBudgetSnapshot } from "@/lib/client-pending-budget";
import type { DailySnapshot, DashboardSnapshot } from "@/types/daily-snapshot";
import type { GameState } from "@/lib/dcic/types";

export type BootstrapTodayResponse = {
  date?: string;
  dashboard?: { critical?: unknown; secondary?: unknown } | null;
  dcicGameState?: unknown;
  tasks?: Record<string, unknown[]>;
  completedToday?: unknown[];
  dailyState?: Record<string, unknown> | null;
  energyBudget?: Record<string, unknown> | null;
  budget?: Record<string, unknown> | null;
  learning?: unknown;
};

let syncDebounce: ReturnType<typeof setTimeout> | null = null;

/** Debounced full sync (e.g. after local pending writes). */
export function scheduleSyncDailySnapshot(delayMs = 1400): void {
  if (typeof window === "undefined") return;
  if (syncDebounce) clearTimeout(syncDebounce);
  syncDebounce = setTimeout(() => {
    syncDebounce = null;
    void mergeDailySnapshotFromNetwork();
  }, delayMs);
}

function mapBootstrapBudgetToSnapshot(
  data: NonNullable<BootstrapTodayResponse["budget"]>,
  dateStr: string
): NonNullable<DailySnapshot["budget"]> {
  const b = data as {
    settings: Record<string, unknown>;
    currentMonthExpenses: number | null;
    currentMonthIncome: number | null;
    currentWeekExpenses: number | null;
    currentWeekIncome: number | null;
    budgetRemainingCents: number | null;
    currency: string;
    isWeekly: boolean;
    financeState: unknown;
    financialInsights: unknown;
    disciplineXpThisWeek: number;
    disciplineCompletedToday: boolean;
    unplannedSummary: { count: number; totalCents: number };
  };
  return {
    today: dateStr,
    settings: b.settings,
    currentMonthExpenses: b.currentMonthExpenses ?? null,
    currentMonthIncome: b.currentMonthIncome ?? null,
    currentWeekExpenses: b.currentWeekExpenses ?? null,
    currentWeekIncome: b.currentWeekIncome ?? null,
    budgetRemainingCents: b.budgetRemainingCents ?? null,
    currency: b.currency,
    isWeekly: b.isWeekly,
    periodLabel: b.isWeekly ? "this week" : "this month",
    isPaydayCycle: !!(b.financeState as { period?: { isPaydayCycle?: boolean } })?.period?.isPaydayCycle,
    disciplineScore: (b.financeState as { disciplineScore?: number | null })?.disciplineScore ?? null,
    disciplineXpThisWeek: b.disciplineXpThisWeek ?? 0,
    disciplineCompletedToday: b.disciplineCompletedToday ?? false,
    daysUnderBudgetThisWeek: (b.financeState as { safeDaysThisWeek?: number | null })?.safeDaysThisWeek ?? null,
    unplannedSummary: b.unplannedSummary ?? { count: 0, totalCents: 0 },
    financeState: b.financeState ?? null,
    financialInsights: b.financialInsights ?? null,
  };
}

function applyPendingOverlays(base: DailySnapshot): DailySnapshot {
  const date = base.date;
  let next = base;

  const pendingDaily = getPendingDailyState(date);
  if (pendingDaily && next.missions) {
    next = {
      ...next,
      missions: {
        ...next.missions,
        dailyState: {
          ...(next.missions.dailyState as Record<string, unknown> | null | undefined),
          ...pendingDaily,
        },
      },
    };
  }

  const pendingBudget = getPendingBudgetSnapshot();
  if (pendingBudget && pendingBudget.synced !== true && next.budget) {
    const b = next.budget;
    next = {
      ...next,
      budget: {
        ...b,
        budgetRemainingCents:
          pendingBudget.budgetRemainingCents != null
            ? pendingBudget.budgetRemainingCents
            : b.budgetRemainingCents,
        settings: {
          ...b.settings,
          ...(pendingBudget.monthlyBudgetCents != null
            ? { monthly_budget_cents: pendingBudget.monthlyBudgetCents }
            : {}),
          ...(pendingBudget.monthlySavingsCents != null
            ? { monthly_savings_cents: pendingBudget.monthlySavingsCents }
            : {}),
          ...(pendingBudget.currency != null ? { currency: pendingBudget.currency } : {}),
          ...(pendingBudget.budgetPeriod != null
            ? { budget_period: pendingBudget.budgetPeriod }
            : {}),
        },
      },
    };
  }

  return next;
}

/**
 * Fetches all snapshot-related APIs in parallel, merges into the current same-day
 * DailySnapshot (including pending overlays), and persists.
 * Returns bootstrap JSON for updating Zustand (tasks, DCIC, etc.).
 */
export async function mergeDailySnapshotFromNetwork(): Promise<BootstrapTodayResponse | null> {
  if (typeof window === "undefined") return null;

  const existing = await loadDailySnapshot();
  const today = getTodayKey();
  const canPersist = existing != null && isCurrentSnapshot(existing);

  const refreshHeaders = { "x-neurohq-refresh": "1" };
  const [bootRes, xpRes, stratRes, analyticsRes, settingsRes] = await Promise.allSettled([
    fetch("/api/bootstrap/today", { credentials: "include", headers: refreshHeaders }),
    fetch(`/api/xp/context?date=${encodeURIComponent(today)}`, {
      credentials: "include",
      headers: refreshHeaders,
    }),
    fetch("/api/strategy/snapshot", {
      credentials: "include",
      headers: refreshHeaders,
    }),
    fetch("/api/analytics/snapshot", {
      credentials: "include",
      headers: refreshHeaders,
    }),
    fetch("/api/settings", { credentials: "include", headers: refreshHeaders }),
  ]);

  let bootstrap: BootstrapTodayResponse | null = null;
  try {
    if (bootRes.status === "fulfilled" && bootRes.value.ok) {
      bootstrap = (await bootRes.value.json()) as BootstrapTodayResponse;
    }
  } catch {
    bootstrap = null;
  }

  if (!canPersist) {
    return bootstrap;
  }

  let next: DailySnapshot = { ...existing! };

  if (bootstrap) {
    if (bootstrap.dashboard?.critical != null && bootstrap.dashboard?.secondary != null) {
      next = {
        ...next,
        dashboard: {
          critical: bootstrap.dashboard.critical as DashboardSnapshot["critical"],
          secondary: bootstrap.dashboard.secondary as DashboardSnapshot["secondary"],
        },
      };
    }
    const dateStr = (bootstrap.date as string) ?? next.date;
    const prevTasks = next.missions?.tasksByDate ?? {};
    const todayTasks = ((bootstrap.tasks ?? {})[dateStr] ?? []) as Array<{ completed?: boolean }>;
    const completedFromTodayTasks = todayTasks.filter((task) => task.completed === true);
    const missions = {
      dateStr,
      tasksByDate: { ...prevTasks, ...(bootstrap.tasks ?? {}) },
      completedToday:
        bootstrap.completedToday ??
        (completedFromTodayTasks.length > 0
          ? completedFromTodayTasks
          : next.missions?.completedToday ?? []),
      energyBudget: (bootstrap.energyBudget as Record<string, unknown>) ?? next.missions?.energyBudget ?? null,
      dailyState: (bootstrap.dailyState as Record<string, unknown>) ?? next.missions?.dailyState ?? null,
    };
    next = {
      ...next,
      date: dateStr,
      missions,
      dcicGameState: bootstrap.dcicGameState ?? next.dcicGameState ?? null,
    };

    if (bootstrap.budget != null) {
      try {
        next.budget = mapBootstrapBudgetToSnapshot(
          bootstrap.budget as NonNullable<BootstrapTodayResponse["budget"]>,
          dateStr
        );
      } catch {
        // ignore map errors
      }
    }

    if (bootstrap.learning != null) {
      const l = bootstrap.learning as {
        weeklyMinutes: number;
        weeklyLearningTarget: number;
        learningStreak: number;
        focus: unknown;
        streams: unknown;
        consistency: unknown;
        reflection: { lastEntryDate: string | null; reflectionRequired: boolean };
      };
      next.learning = {
        today: dateStr,
        weeklyMinutes: l.weeklyMinutes,
        weeklyLearningTarget: l.weeklyLearningTarget,
        learningStreak: l.learningStreak,
        focus: l.focus,
        streams: l.streams,
        consistency: l.consistency,
        reflection: l.reflection,
      };
    }
  }

  if (xpRes.status === "fulfilled" && xpRes.value.ok) {
    try {
      const cache = await xpRes.value.json();
      next = {
        ...next,
        xp: {
          today,
          cache: cache as NonNullable<DailySnapshot["xp"]>["cache"],
        },
      };
    } catch {
      // ignore
    }
  }

  if (stratRes.status === "fulfilled" && stratRes.value.ok) {
    try {
      const data = (await stratRes.value.json()) as DailySnapshot["strategy"];
      next = { ...next, strategy: data };
    } catch {
      // ignore
    }
  }

  if (analyticsRes.status === "fulfilled" && analyticsRes.value.ok) {
    try {
      const data = (await analyticsRes.value.json()) as DailySnapshot["analytics"];
      next = { ...next, analytics: data };
    } catch {
      // ignore
    }
  }

  if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
    try {
      const data = (await settingsRes.value.json()) as {
        preferences?: Record<string, unknown>;
        payday?: { last_payday_date: string | null; payday_day_of_month: number | null };
      };
      next = {
        ...next,
        settings: {
          today,
          preferences: data.preferences ?? {},
          payday: data.payday ?? { last_payday_date: null, payday_day_of_month: null },
        },
      };
    } catch {
      // ignore
    }
  }

  next = applyPendingOverlays(next);
  next = {
    ...next,
    ui: {
      ...next.ui,
      savedAt: Date.now(),
    },
  };

  const persist = await saveDailySnapshotWithRetries(next);
  if (!persist.ok) {
    console.error("[daily-snapshot-full-sync] persist failed", persist.error);
  }
  return bootstrap;
}

/** Apply DCIC game state from a loaded snapshot (before network game-state fetch). */
export function getDcicGameStateFromSnapshot(snapshot: DailySnapshot | null): GameState | null {
  const raw = snapshot?.dcicGameState;
  if (!raw || typeof raw !== "object") return null;
  return raw as GameState;
}

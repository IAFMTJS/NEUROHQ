"use client";

import { getTodayKey } from "@/lib/daily-date";
import {
  loadDailySnapshot,
  saveDailySnapshot,
  isCurrentSnapshot,
} from "@/lib/daily-snapshot-storage";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { LATEST_SNAPSHOT_VERSION } from "@/types/daily-snapshot";

export type PreloadStepId =
  | "fetchDashboard"
  | "fetchMissions"
  | "fetchXP"
  | "fetchStrategy"
  | "fetchLearning"
  | "fetchBudget"
  | "fetchAnalytics"
  | "preloadPages"
  | "preloadAssets"
  | "prepareCache";

export type PreloadProgress = {
  step: PreloadStepId;
  completedSteps: number;
  totalSteps: number;
};

export type InitializeResult = {
  kind: "fromCache" | "fresh";
  snapshot: DailySnapshot;
};

const ALL_STEPS: PreloadStepId[] = [
  "fetchDashboard",
  "fetchMissions",
  "fetchXP",
  "fetchStrategy",
  "fetchLearning",
  "fetchBudget",
  "fetchAnalytics",
  "preloadPages",
  "preloadAssets",
  "prepareCache",
];

function emitProgress(
  onProgress: ((p: PreloadProgress) => void) | undefined,
  step: PreloadStepId,
  index: number
) {
  if (!onProgress) return;
  onProgress({
    step,
    completedSteps: index + 1,
    totalSteps: ALL_STEPS.length,
  });
}

/**
 * Minimal implementation for now: reuses an existing same-day snapshot when available,
 * otherwise creates an empty shell snapshot and only runs the dashboard fetch step.
 *
 * The remaining domain-specific steps are wired as no-ops initially so callers can
 * already rely on the progress contract. They can be filled in iteratively.
 */
export async function initializeDailySystem(
  onProgress?: (p: PreloadProgress) => void
): Promise<InitializeResult> {
  // 1. Try existing snapshot
  const existing = await loadDailySnapshot();
  if (existing && isCurrentSnapshot(existing)) {
    return { kind: "fromCache", snapshot: existing };
  }

  const fallback = existing ?? null;

  // 2. Build a fresh snapshot shell for today
  const today = getTodayKey();
  let snapshot: DailySnapshot = {
    version: LATEST_SNAPSHOT_VERSION,
    date: today,
    dashboard: null,
    missions: null,
    xp: null,
    strategy: null,
    learning: null,
    budget: null,
    analytics: null,
    ui: {
      pagesPrefetched: [],
      assetsPrefetched: false,
    },
  };

  try {
    for (let i = 0; i < ALL_STEPS.length; i++) {
      const step = ALL_STEPS[i];
      // eslint-disable-next-line no-await-in-loop
      const before = typeof performance !== "undefined" ? performance.now() : Date.now();
      snapshot = await runStep(snapshot, step);
      const after = typeof performance !== "undefined" ? performance.now() : Date.now();
      // Lightweight timing log for tuning.
      // eslint-disable-next-line no-console
      console.debug("[daily-initialize]", step, "took", Math.round(after - before), "ms");
      emitProgress(onProgress, step, i);
    }
  } catch (e) {
    if (fallback) {
      const offlineSnapshot: DailySnapshot = {
        ...fallback,
        ui: {
          ...fallback.ui,
          offlineMode: true,
        },
      };
      await saveDailySnapshot(offlineSnapshot);
      return { kind: "fromCache", snapshot: offlineSnapshot };
    }
    throw e;
  }

  await saveDailySnapshot(snapshot);
  return { kind: "fresh", snapshot };
}

async function runStep(
  snapshot: DailySnapshot,
  step: PreloadStepId
): Promise<DailySnapshot> {
  switch (step) {
    case "fetchDashboard": {
      try {
        const res = await fetch("/api/dashboard/data?part=all&ts=" + Date.now(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error("Dashboard preload failed: " + res.status);
        }
        const data = (await res.json()) as {
          critical: DailySnapshot["dashboard"] extends { critical: infer C } ? C : unknown;
          secondary: DailySnapshot["dashboard"] extends { secondary: infer S } ? S : unknown;
        };
        return {
          ...snapshot,
          dashboard: {
            critical: data.critical as any,
            secondary: data.secondary as any,
          },
        };
      } catch {
        throw new Error("Dashboard preload failed");
      }
    }
    case "fetchMissions": {
      try {
        const res = await fetch("/api/bootstrap/today", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return snapshot;
        const data = (await res.json()) as {
          date?: string;
          tasks?: Record<string, unknown[]>;
          completedToday?: unknown[];
          dailyState?: Record<string, unknown> | null;
          energyBudget?: Record<string, unknown> | null;
          budget?: {
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
          } | null;
          learning?: {
            weeklyMinutes: number;
            weeklyLearningTarget: number;
            learningStreak: number;
            focus: unknown | null;
            streams: unknown;
            consistency: unknown;
            reflection: {
              lastEntryDate: string | null;
              reflectionRequired: boolean;
            };
          } | null;
        };
        const dateStr = (data.date as string) ?? snapshot.date;
        const missions = {
          dateStr,
          tasksByDate: data.tasks ?? {},
          completedToday: data.completedToday ?? [],
          energyBudget: (data.energyBudget as Record<string, unknown>) ?? null,
          dailyState: (data.dailyState as Record<string, unknown>) ?? null,
        };
        const budget =
          data.budget != null
            ? {
                today: dateStr,
                settings: data.budget.settings,
                currentMonthExpenses: data.budget.currentMonthExpenses ?? null,
                currentMonthIncome: data.budget.currentMonthIncome ?? null,
                budgetRemainingCents: data.budget.budgetRemainingCents ?? null,
                currency: data.budget.currency,
                isWeekly: data.budget.isWeekly,
                // Derive period label from isWeekly; history mode is handled in the page.
                periodLabel: data.budget.isWeekly ? "this week" : "this month",
                isPaydayCycle: !!(data.budget.financeState as any)?.period?.isPaydayCycle,
                disciplineScore:
                  (data.budget.financeState as any)?.disciplineScore ?? null,
                disciplineXpThisWeek: data.budget.disciplineXpThisWeek ?? 0,
                disciplineCompletedToday: data.budget.disciplineCompletedToday ?? false,
                daysUnderBudgetThisWeek:
                  (data.budget.financeState as any)?.safeDaysThisWeek ?? null,
                unplannedSummary: data.budget.unplannedSummary ?? {
                  count: 0,
                  totalCents: 0,
                },
              }
            : snapshot.budget;
        const learning =
          data.learning != null
            ? {
                today: dateStr,
                weeklyMinutes: data.learning.weeklyMinutes,
                weeklyLearningTarget: data.learning.weeklyLearningTarget,
                learningStreak: data.learning.learningStreak,
                focus: data.learning.focus,
                streams: data.learning.streams,
                consistency: data.learning.consistency,
                reflection: data.learning.reflection,
              }
            : snapshot.learning;
        return {
          ...snapshot,
          missions,
          budget,
          learning,
        };
      } catch {
        return snapshot;
      }
    }
    case "fetchXP": {
      try {
        const dateStr = snapshot.date || getTodayKey();
        const res = await fetch(
          `/api/xp/context?date=${encodeURIComponent(dateStr)}&ts=${Date.now()}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        if (!res.ok) return snapshot;
        const cache = (await res.json()) as DailySnapshot["xp"] extends { cache: infer C }
          ? C
          : unknown;
        return {
          ...snapshot,
          xp: {
            today: dateStr,
            cache: cache as any,
          },
        };
      } catch {
        return snapshot;
      }
    }
    case "fetchStrategy": {
      try {
        const res = await fetch("/api/strategy/snapshot?ts=" + Date.now(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return snapshot;
        const data = (await res.json()) as DailySnapshot["strategy"];
        return {
          ...snapshot,
          strategy: data,
        };
      } catch {
        return snapshot;
      }
    }
    case "fetchLearning":
    case "fetchBudget":
      // Reserved for future learning/budget-specific snapshot APIs.
      return snapshot;
    case "fetchAnalytics": {
      try {
        const res = await fetch("/api/analytics/snapshot?ts=" + Date.now(), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return snapshot;
        const data = (await res.json()) as DailySnapshot["analytics"];
        return {
          ...snapshot,
          analytics: data,
        };
      } catch {
        return snapshot;
      }
    }
    case "preloadPages": {
      try {
        const routes = [
          "/dashboard",
          "/tasks",
          "/xp",
          "/report",
          "/strategy",
          "/learning",
          "/learning/analytics",
          "/budget",
          "/help",
          "/assistant",
        ];
        await Promise.allSettled(
          routes.map((path) =>
            fetch(path, {
              credentials: "include",
              cache: "force-cache",
            }).catch(() => undefined)
          )
        );
        return {
          ...snapshot,
          ui: {
            ...snapshot.ui,
            pagesPrefetched: routes,
          },
        };
      } catch {
        return snapshot;
      }
    }
    case "preloadAssets": {
      try {
        const assets = [
          "/mascots/dashboard.png",
          "/mascots/tasks.png",
          "/mascots/xp.png",
          "/mascots/budget.png",
        ];
        assets.forEach((src) => {
          try {
            const img = new Image();
            img.src = src;
          } catch {
            // ignore individual asset failures
          }
        });
        return {
          ...snapshot,
          ui: {
            ...snapshot.ui,
            assetsPrefetched: true,
          },
        };
      } catch {
        return snapshot;
      }
    }
    case "prepareCache":
    default:
      return snapshot;
  }
}


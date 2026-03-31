"use client";

import { getTodayKey } from "@/lib/daily-date";
import {
  loadDailySnapshot,
  saveDailySnapshot,
  isCurrentSnapshot,
  mergeSnapshotKeepBest,
} from "@/lib/daily-snapshot-storage";
import { getMascotSrcForPage } from "@/lib/mascots";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { LATEST_SNAPSHOT_VERSION } from "@/types/daily-snapshot";

export type PreloadStepId =
  | "fetchDashboard"
  | "fetchMissions"
  | "fetchXP"
  | "fetchStrategy"
  | "fetchAnalytics"
  | "fetchSettings"
  | "preloadPages"
  | "preloadAssets"
  | "prepareCache";

export type PreloadProgress = {
  step: PreloadStepId;
  /** Zero-based index of the step currently running or just finished. */
  stepIndex: number;
  totalSteps: number;
  /** Steps fully completed (0..totalSteps). */
  completedSteps: number;
  /** `start` = about to run this step; `complete` = step finished. */
  phase: "start" | "complete";
};

export type InitializeResult = {
  kind: "fromCache" | "fresh";
  snapshot: DailySnapshot;
};

const PRELOAD_PAGE_TIMEOUT_MS = 2500;

/** Ordered bootstrap work (single source of truth for loader UI + progress). */
export const DAILY_BOOTSTRAP_STEPS: readonly PreloadStepId[] = [
  "fetchDashboard",
  "fetchMissions",
  "fetchXP",
  "fetchStrategy",
  "fetchAnalytics",
  "fetchSettings",
  "preloadPages",
  "preloadAssets",
  "prepareCache",
] as const;

const ALL_STEPS: PreloadStepId[] = [...DAILY_BOOTSTRAP_STEPS];

function emitProgress(
  onProgress: ((p: PreloadProgress) => void) | undefined,
  step: PreloadStepId,
  index: number,
  phase: "start" | "complete"
) {
  if (!onProgress) return;
  const completedSteps = phase === "complete" ? index + 1 : index;
  onProgress({
    step,
    stepIndex: index,
    totalSteps: ALL_STEPS.length,
    completedSteps,
    phase,
  });
}

async function yieldToBrowser(onProgress?: (p: PreloadProgress) => void): Promise<void> {
  // When steps complete very quickly, React may batch state updates and the loader can look like it
  // "skips" steps. Yielding gives the browser a chance to paint between step transitions.
  if (!onProgress) return;
  await Promise.resolve();
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }
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
    settings: null,
    dcicGameState: null,
    ui: {
      pagesPrefetched: [],
      assetsPrefetched: false,
      // Must be epoch ms (Date.now) because storage staleness checks compare against Date.now().
      savedAt: Date.now(),
    },
  };

  try {
    for (let i = 0; i < ALL_STEPS.length; i++) {
      const step = ALL_STEPS[i];
      emitProgress(onProgress, step, i, "start");
      // Allow the loader UI to repaint before doing work.
      // eslint-disable-next-line no-await-in-loop
      await yieldToBrowser(onProgress);
      // eslint-disable-next-line no-await-in-loop
      const before = typeof performance !== "undefined" ? performance.now() : Date.now();
      snapshot = await runStep(snapshot, step);
      const after = typeof performance !== "undefined" ? performance.now() : Date.now();
      // eslint-disable-next-line no-console
      console.debug("[daily-initialize]", step, "took", Math.round(after - before), "ms");

      const onDisk = await loadDailySnapshot();
      snapshot = mergeSnapshotKeepBest(today, onDisk, snapshot);
      await saveDailySnapshot(snapshot);

      emitProgress(onProgress, step, i, "complete");
      // eslint-disable-next-line no-await-in-loop
      await yieldToBrowser(onProgress);
    }
  } catch (e) {
    if (fallback) {
      const merged = mergeSnapshotKeepBest(today, fallback, snapshot);
      const offlineSnapshot: DailySnapshot = {
        ...merged,
        ui: {
          ...merged.ui,
          offlineMode: true,
        },
      };
      await saveDailySnapshot(offlineSnapshot);
      return { kind: "fromCache", snapshot: offlineSnapshot };
    }
    throw e;
  }

  return { kind: "fresh", snapshot };
}

async function runStep(
  snapshot: DailySnapshot,
  step: PreloadStepId
): Promise<DailySnapshot> {
  switch (step) {
    case "fetchDashboard": {
      try {
        const res = await fetch(`/api/dashboard/data?part=all&ts=${Date.now()}`, {
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
        });
        if (!res.ok) return snapshot;
        const data = (await res.json()) as {
          date?: string;
          dcicGameState?: unknown;
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
                currentWeekExpenses: data.budget.currentWeekExpenses ?? null,
                currentWeekIncome: data.budget.currentWeekIncome ?? null,
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
                financeState: data.budget.financeState ?? null,
                financialInsights: data.budget.financialInsights ?? null,
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
          dcicGameState: data.dcicGameState ?? snapshot.dcicGameState ?? null,
        };
      } catch {
        return snapshot;
      }
    }
    case "fetchXP": {
      try {
        const dateStr = snapshot.date || getTodayKey();
        const res = await fetch(
          `/api/xp/context?date=${encodeURIComponent(dateStr)}`,
          {
            credentials: "include",
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
        const res = await fetch("/api/strategy/snapshot", {
          credentials: "include",
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
    case "fetchAnalytics": {
      try {
        const res = await fetch("/api/analytics/snapshot", {
          credentials: "include",
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
    case "fetchSettings": {
      try {
        const res = await fetch("/api/settings", {
          credentials: "include",
        });
        if (!res.ok) return snapshot;
        const data = (await res.json()) as { preferences?: Record<string, unknown>; payday?: { last_payday_date: string | null; payday_day_of_month: number | null } };
        const dateStr = snapshot.date || getTodayKey();
        return {
          ...snapshot,
          settings: {
            today: dateStr,
            preferences: data.preferences ?? {},
            payday: data.payday ?? { last_payday_date: null, payday_day_of_month: null },
          },
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
          "/analytics",
          "/strategy",
          "/learning",
          "/learning/analytics",
          "/budget",
          "/settings",
          "/profile",
          "/help",
          "/assistant",
        ];
        await Promise.allSettled(routes.map((path) => prefetchPage(path)));
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
          getMascotSrcForPage("dashboard"),
          getMascotSrcForPage("tasks"),
          getMascotSrcForPage("xp"),
          getMascotSrcForPage("budget"),
          getMascotSrcForPage("profile"),
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
      try {
        // Ask the service worker to warm the authenticated day bundle (HTML + key snapshot endpoints).
        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => reg.active?.postMessage({ type: "WARMUP_BACKGROUND_CACHE", includeAuth: true, today: snapshot.date }))
            .catch(() => {});
        }
      } catch {
        // ignore
      }
      return snapshot;
  }
}

async function prefetchPage(path: string): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PRELOAD_PAGE_TIMEOUT_MS);
  try {
    await fetch(path, {
      credentials: "include",
      cache: "force-cache",
      signal: controller.signal,
    });
  } catch {
    // ignore individual prefetch errors/timeouts
  } finally {
    clearTimeout(timeoutId);
  }
}


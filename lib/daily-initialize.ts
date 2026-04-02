"use client";

import { getTodayKey } from "@/lib/daily-date";
import {
  loadDailySnapshot,
  saveDailySnapshotWithRetries,
  getStoragePressureFlag,
  isCurrentSnapshot,
  mergeSnapshotKeepBest,
} from "@/lib/daily-snapshot-storage";
import { preloadShellImagesDecoded } from "@/lib/bootstrap-image-preload";
import { requestSwCacheWarmupWithRetries } from "@/lib/sw-cache-warmup";
import { BOOTSTRAP_PREFETCH_ROUTES } from "@/lib/bootstrap-prefetch-routes";
import { isAssistantEnabled } from "@/lib/feature-flags";
import { getBootstrapShellVisualPreloadUrls } from "@/lib/bootstrap-shell-visuals";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { LATEST_SNAPSHOT_VERSION } from "@/types/daily-snapshot";

export type PreloadStepId =
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

export type InitializeDailySystemOptions = {
  /** Warms Next.js client navigation cache; required for prefetch step to have effect. */
  prefetchHref?: (href: string) => void;
};

/** Ordered bootstrap work (single source of truth for loader UI + progress). */
export const DAILY_BOOTSTRAP_STEPS: readonly PreloadStepId[] = [
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
  onProgress?: (p: PreloadProgress) => void,
  options?: InitializeDailySystemOptions
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
      snapshot = await runStep(snapshot, step, options);
      const after = typeof performance !== "undefined" ? performance.now() : Date.now();
      // eslint-disable-next-line no-console
      console.debug("[daily-initialize]", step, "took", Math.round(after - before), "ms");

      const onDisk = await loadDailySnapshot();
      snapshot = mergeSnapshotKeepBest(today, onDisk, snapshot);
      const storagePressure = await getStoragePressureFlag();
      snapshot = {
        ...snapshot,
        ui: {
          ...snapshot.ui,
          storagePressure,
        },
      };
      const prePersist = snapshot;
      const snapshotToSave: DailySnapshot = {
        ...snapshot,
        ui: {
          ...snapshot.ui,
          persistVerified: true,
        },
      };
      const persist = await saveDailySnapshotWithRetries(snapshotToSave);
      snapshot = persist.ok
        ? snapshotToSave
        : mergeSnapshotKeepBest(today, await loadDailySnapshot(), prePersist);

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
          persistVerified: true,
        },
      };
      const offPersist = await saveDailySnapshotWithRetries(offlineSnapshot);
      if (!offPersist.ok) {
        console.error("[daily-initialize] offline snapshot persist failed", offPersist.error);
      }
      return { kind: "fromCache", snapshot: offlineSnapshot };
    }
    throw e;
  }

  const completedSnapshot: DailySnapshot = {
    ...snapshot,
    ui: {
      ...snapshot.ui,
      bootstrapCompletedAt: Date.now(),
      persistVerified: true,
    },
  };
  const finalPersist = await saveDailySnapshotWithRetries(completedSnapshot);
  if (!finalPersist.ok) {
    console.error("[daily-initialize] final bootstrap completion persist failed", finalPersist.error);
  }
  snapshot = finalPersist.ok ? completedSnapshot : snapshot;

  return { kind: "fresh", snapshot };
}

async function runStep(
  snapshot: DailySnapshot,
  step: PreloadStepId,
  options?: InitializeDailySystemOptions
): Promise<DailySnapshot> {
  switch (step) {
    case "fetchMissions": {
      try {
        const res = await fetch("/api/bootstrap/today", {
          credentials: "include",
        });
        if (!res.ok) return snapshot;
        const data = (await res.json()) as {
          date?: string;
          dashboard?: {
            critical?: unknown;
            secondary?: unknown;
          } | null;
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
        let dashboard = snapshot.dashboard;
        if (data.dashboard?.critical != null && data.dashboard?.secondary != null) {
          dashboard = {
            critical: data.dashboard.critical as any,
            secondary: data.dashboard.secondary as any,
          };
        }

        return {
          ...snapshot,
          dashboard,
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
        const routes = BOOTSTRAP_PREFETCH_ROUTES.filter(
          (path) => path !== "/assistant" || isAssistantEnabled()
        );
        const prefetchInvokedAt = options?.prefetchHref ? Date.now() : undefined;
        if (options?.prefetchHref) {
          for (const path of routes) {
            try {
              options.prefetchHref(path);
            } catch {
              // ignore individual prefetch errors
            }
          }
        }
        return {
          ...snapshot,
          ui: {
            ...snapshot.ui,
            pagesPrefetched: [...routes],
            ...(prefetchInvokedAt != null ? { prefetchInvokedAt } : {}),
          },
        };
      } catch {
        return snapshot;
      }
    }
    case "preloadAssets": {
      try {
        const assets = getBootstrapShellVisualPreloadUrls();
        const { loaded, total, failedUrls } = await preloadShellImagesDecoded(assets);
        if (failedUrls.length) {
          console.warn("[daily-initialize] shell visual decode misses", failedUrls.length, failedUrls.slice(0, 5));
        }
        const shellVisualsDecodeOk = total === 0 || loaded === total;
        return {
          ...snapshot,
          ui: {
            ...snapshot.ui,
            assetsPrefetched: true,
            shellVisualsLoadedCount: loaded,
            shellVisualsTotal: total,
            shellVisualsDecodeOk,
          },
        };
      } catch {
        return snapshot;
      }
    }
    case "prepareCache":
    default: {
      let swOk = false;
      try {
        if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
          const warm = await requestSwCacheWarmupWithRetries({
            includeAuth: true,
            today: snapshot.date,
          });
          swOk = warm.ok;
        }
      } catch {
        swOk = false;
      }
      return {
        ...snapshot,
        ui: {
          ...snapshot.ui,
          swCacheWarmupOk: swOk,
        },
      };
    }
  }
}


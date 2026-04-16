"use client";

import { getTodayKey } from "@/lib/daily-date";
import type { DailySnapshot } from "@/types/daily-snapshot";
import { LATEST_SNAPSHOT_VERSION } from "@/types/daily-snapshot";
import { fetchSettingsPayload } from "@/lib/settings-api-client";
import {
  fetchBootstrapTodayWithBody,
  isBootstrapTodayPayloadUsable,
  type BootstrapTodayResponse,
} from "@/lib/daily-snapshot-full-sync";
import { mergeBootstrapTodayIntoDailySnapshot } from "@/lib/bootstrap-today-mappers";
import { seedHubBundlesFromBootstrapToday } from "@/lib/hub-bundles/seed-from-bootstrap";

/** Set during `initializeDailySystem` when `fetchMissions` parses `/api/bootstrap/today`. */
let bootstrapTodayCapture: BootstrapTodayResponse | null = null;
let bootstrapTodayEtagCapture: string | null = null;

/** Last bootstrap HTTP status when init fetch failed (for error copy). Cleared on success start. */
let lastBootstrapInitFetchStatus: number | null = null;

export type PreloadStepId =
  | "fetchMissions"
  | "fetchXP"
  | "fetchStrategy"
  | "fetchAnalytics"
  | "fetchSettings";

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
  kind: "fresh";
  snapshot: DailySnapshot;
  /** Raw `/api/bootstrap/today` JSON when the missions step succeeded (seeds TanStack Query). */
  bootstrapToday: BootstrapTodayResponse | null;
  /** Last bootstrap ETag captured during init, reused by background merge for 304s. */
  bootstrapTodayEtag?: string | null;
};

/** Ordered bootstrap work (single source of truth for loader UI + progress). */
export const DAILY_BOOTSTRAP_STEPS: readonly PreloadStepId[] = [
  "fetchMissions",
  "fetchXP",
  "fetchStrategy",
  "fetchAnalytics",
  "fetchSettings",
] as const;

const ALL_STEPS: PreloadStepId[] = [...DAILY_BOOTSTRAP_STEPS];
const BOOTSTRAP_TIMING_DEBUG = process.env.NEXT_PUBLIC_BOOTSTRAP_TIMING_DEBUG === "1";

/** PWA / cold start: cookies can lag behind `localStorage` session — refresh before retrying bootstrap. */
async function refreshSupabaseSessionForApi(): Promise<void> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    await createClient().auth.refreshSession();
    await new Promise((r) => setTimeout(r, 160));
  } catch {
    /* ignore */
  }
}

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
  if (!onProgress) return;
  await Promise.resolve();
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }
}

/**
 * Builds today's app payload in memory (sequential steps + progress for the loader).
 * Cold start may skip this when {@link readPersistedDailyInit} returns same-day cache; merges still update IDB.
 */
export async function initializeDailySystem(onProgress?: (p: PreloadProgress) => void): Promise<InitializeResult> {
  bootstrapTodayCapture = null;
  bootstrapTodayEtagCapture = null;
  lastBootstrapInitFetchStatus = null;
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
    calendar: null,
    settings: null,
    dcicGameState: null,
    ui: {
      pagesPrefetched: [],
      assetsPrefetched: false,
      savedAt: Date.now(),
    },
  };

  for (let i = 0; i < ALL_STEPS.length; i++) {
    const step = ALL_STEPS[i];
    emitProgress(onProgress, step, i, "start");
    // eslint-disable-next-line no-await-in-loop
    await yieldToBrowser(onProgress);
    // eslint-disable-next-line no-await-in-loop
    const before = typeof performance !== "undefined" ? performance.now() : Date.now();
    snapshot = await runStep(snapshot, step);
    const after = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (BOOTSTRAP_TIMING_DEBUG) {
      // eslint-disable-next-line no-console
      console.debug("[daily-initialize]", step, "took", Math.round(after - before), "ms");
    }

    emitProgress(onProgress, step, i, "complete");
    // eslint-disable-next-line no-await-in-loop
    await yieldToBrowser(onProgress);
  }

  const bootstrapToday = bootstrapTodayCapture;
  const bootstrapTodayEtag = bootstrapTodayEtagCapture;
  const hasMissionsPayload =
    isBootstrapTodayPayloadUsable(bootstrapToday) ||
    snapshot.missions != null ||
    snapshot.dashboard != null;
  if (!hasMissionsPayload) {
    const st = lastBootstrapInitFetchStatus;
    lastBootstrapInitFetchStatus = null;
    if (st === 401) {
      let hasClientSession = false;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const {
          data: { session },
        } = await createClient().auth.getSession();
        hasClientSession = !!session?.user;
      } catch {
        /* ignore */
      }
      if (!hasClientSession) {
        throw new Error(
          "Je bent niet ingelogd. Open NeuroHQ in de browser om in te loggen, of meld je opnieuw aan."
        );
      }
      throw new Error(
        "De server kon bootstrap nog niet starten (sessie-cookies waren nog niet klaar of de server weigerde tijdelijk). Vernieuw de pagina of sluit de app en open opnieuw. Blijft dit zo, log één keer uit en weer in via de website."
      );
    }
    throw new Error(
      "Kon vandaag niet laden (geen geldige bootstrap-response). Ververs hard (Ctrl+Shift+R) of wis sitegegevens voor deze app. Controleer in DevTools → Network of GET /api/bootstrap/today status 200 heeft."
    );
  }

  const completedAt = Date.now();
  const snapshotOut: DailySnapshot = {
    ...snapshot,
    ui: {
      ...snapshot.ui,
      bootstrapCompletedAt: completedAt,
      savedAt: completedAt,
    },
  };

  bootstrapTodayCapture = null;
  bootstrapTodayEtagCapture = null;

  return { kind: "fresh", snapshot: snapshotOut, bootstrapToday, bootstrapTodayEtag };
}

async function runStep(snapshot: DailySnapshot, step: PreloadStepId): Promise<DailySnapshot> {
  switch (step) {
    case "fetchMissions": {
      try {
        const requestHeaders = {
          "x-neurohq-refresh": "1",
          "x-sw-bypass": "1",
          accept: "application/json",
        } as const;
        let boot = await fetchBootstrapTodayWithBody();
        lastBootstrapInitFetchStatus = boot.ok ? null : boot.status;
        // First-load hardening: if first bootstrap is unusable (empty shell / SW edge), do one forced retry.
        if (!boot.ok || !isBootstrapTodayPayloadUsable(boot.data)) {
          await new Promise((r) => setTimeout(r, 140));
          const retryRes = await fetch(`/api/bootstrap/today?_nb=${Date.now()}&_retry=1`, {
            method: "GET",
            credentials: "include",
            cache: "no-store",
            headers: {
              ...requestHeaders,
              "cache-control": "no-cache",
              pragma: "no-cache",
            },
          });
          if (retryRes.ok) {
            try {
              const retryData = (await retryRes.json()) as BootstrapTodayResponse;
              if (isBootstrapTodayPayloadUsable(retryData)) {
                boot = {
                  ok: true,
                  status: retryRes.status,
                  data: retryData,
                  etag: retryRes.headers.get("etag"),
                };
                lastBootstrapInitFetchStatus = null;
              } else {
                boot = { ok: false, status: retryRes.status, data: null };
                lastBootstrapInitFetchStatus = retryRes.status;
              }
            } catch {
              boot = { ok: false, status: retryRes.status, data: null };
              lastBootstrapInitFetchStatus = retryRes.status;
            }
          } else {
            boot = { ok: false, status: retryRes.status, data: null };
            lastBootstrapInitFetchStatus = retryRes.status;
          }
        }

        if (!boot.ok || !isBootstrapTodayPayloadUsable(boot.data)) {
          await refreshSupabaseSessionForApi();
          const recovered = await fetchBootstrapTodayWithBody();
          lastBootstrapInitFetchStatus = recovered.ok ? null : recovered.status;
          if (recovered.ok && isBootstrapTodayPayloadUsable(recovered.data)) {
            boot = recovered;
          } else {
            await new Promise((r) => setTimeout(r, 160));
            const authRetryRes = await fetch(`/api/bootstrap/today?_nb=${Date.now()}&_retry=auth`, {
              method: "GET",
              credentials: "include",
              cache: "no-store",
              headers: {
                ...requestHeaders,
                "cache-control": "no-cache",
                pragma: "no-cache",
              },
            });
            if (authRetryRes.ok) {
              try {
                const authData = (await authRetryRes.json()) as BootstrapTodayResponse;
                if (isBootstrapTodayPayloadUsable(authData)) {
                  boot = {
                    ok: true,
                    status: authRetryRes.status,
                    data: authData,
                    etag: authRetryRes.headers.get("etag"),
                  };
                  lastBootstrapInitFetchStatus = null;
                } else {
                  boot = { ok: false, status: authRetryRes.status, data: null };
                  lastBootstrapInitFetchStatus = authRetryRes.status;
                }
              } catch {
                boot = { ok: false, status: authRetryRes.status, data: null };
                lastBootstrapInitFetchStatus = authRetryRes.status;
              }
            } else {
              boot = { ok: false, status: authRetryRes.status, data: null };
              lastBootstrapInitFetchStatus = authRetryRes.status;
            }
          }
        }

        if (!boot.ok) {
          // Fallback path: build a minimal usable snapshot from dashboard + tasks endpoints.
          const dateStr = snapshot.date || getTodayKey();
          try {
            const [dashRes, tasksRes] = await Promise.all([
              fetch("/api/dashboard/data?part=all", {
                credentials: "include",
                cache: "default",
                headers: requestHeaders,
              }),
              fetch(`/api/tasks?date=${encodeURIComponent(dateStr)}`, {
                credentials: "include",
                cache: "default",
                headers: requestHeaders,
              }),
            ]);

            let dashboardRaw: { critical?: unknown; secondary?: unknown } | null = null;
            let tasksRaw: unknown[] | null = null;
            if (dashRes.ok) {
              const parsed = (await dashRes.json()) as { critical?: unknown; secondary?: unknown };
              if (parsed?.critical != null && parsed?.secondary != null) dashboardRaw = parsed;
            }
            if (tasksRes.ok) {
              const parsed = await tasksRes.json();
              if (Array.isArray(parsed)) tasksRaw = parsed as unknown[];
            }

            if (dashboardRaw || tasksRaw) {
              const fallbackBootstrap: BootstrapTodayResponse = {
                date: dateStr,
                ...(dashboardRaw ? { dashboard: { critical: dashboardRaw.critical, secondary: dashboardRaw.secondary } } : {}),
                ...(tasksRaw ? { tasks: { [dateStr]: tasksRaw } } : {}),
                ...(tasksRaw
                  ? {
                      completedToday: tasksRaw.filter(
                        (t) => !!(t as { completed?: boolean; completed_at?: string | null }).completed
                      ),
                    }
                  : {}),
              };
              bootstrapTodayCapture = fallbackBootstrap;
              bootstrapTodayEtagCapture = null;
              return mergeBootstrapTodayIntoDailySnapshot(snapshot, fallbackBootstrap);
            }
          } catch {
            // fall through to old behavior
          }
          return snapshot;
        }
        const data = boot.data as {
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
        bootstrapTodayCapture = data as BootstrapTodayResponse;
        bootstrapTodayEtagCapture = boot.etag;
        const dateStr = (data.date as string) ?? snapshot.date;
        const merged = mergeBootstrapTodayIntoDailySnapshot(snapshot, data as BootstrapTodayResponse);
        void seedHubBundlesFromBootstrapToday(data as BootstrapTodayResponse).catch(() => {});

        let calendar: DailySnapshot["calendar"] = merged.calendar ?? null;
        try {
          const calRes = await fetch(
            `/api/tasks/calendar-tab?month=${encodeURIComponent(dateStr.slice(0, 7))}&anchorDate=${encodeURIComponent(dateStr)}`,
            { credentials: "include", cache: "no-store", headers: { "x-neurohq-refresh": "1" } }
          );
          if (calRes.ok) {
            calendar = (await calRes.json()) as DailySnapshot["calendar"];
          }
        } catch {
          // ignore
        }

        return {
          ...merged,
          calendar,
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
            cache: "no-store",
            headers: { "x-neurohq-refresh": "1" },
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
          cache: "no-store",
          headers: { "x-neurohq-refresh": "1" },
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
          cache: "no-store",
          headers: { "x-neurohq-refresh": "1" },
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
        const data = await fetchSettingsPayload();
        if (!data) return snapshot;
        const dateStr = snapshot.date || getTodayKey();
        return {
          ...snapshot,
          settings: {
            today: dateStr,
            preferences: data.preferences as unknown as Record<string, unknown>,
            payday: data.payday,
          },
        };
      } catch {
        return snapshot;
      }
    }
    default:
      return snapshot;
  }
}

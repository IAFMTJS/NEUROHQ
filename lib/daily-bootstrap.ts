"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";
import { mergeDailySnapshotFromNetwork, type BootstrapTodayResponse } from "@/lib/daily-snapshot-full-sync";
import { applyDCICModeOverrideIfAny } from "@/lib/dcic/dcic-mode-override";
import { PERIODIC_SNAPSHOT_REFRESH_MINUTES } from "@/lib/client-refresh";
import { getTodayKey } from "@/lib/daily-date";
import {
  NEUROHQ_DAILY_SNAPSHOT_UPDATED,
  type NeurohqDailySnapshotUpdatedDetail,
  seedBootstrapTodayInCache,
} from "@/lib/bootstrap-query";
import { patchPersistedDailyFromBootstrap } from "@/lib/daily-init-persist";
import { getBootstrapQueryClient } from "@/lib/bootstrap-query-client-ref";
import type { MissionsPipelinePayload } from "@/lib/missions/derive-mission-capacity";
import type { LearningSnapshot as StoreLearningSnapshot } from "@/types/hq-store.types";

let lastBootstrapApplyFingerprint: string | null = null;

function djb2Hex(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h, 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

/** Zelfde semantiek als “snapshot niet gewijzigd”: geen store- of cache-write (voorkomt rerender-cascade). */
function computeBootstrapApplyFingerprint(bootstrap: BootstrapTodayResponse): string {
  const serial = JSON.stringify({
    date: bootstrap.date,
    tasks: bootstrap.tasks,
    dailyState: bootstrap.dailyState,
    energyBudget: bootstrap.energyBudget,
    budget: bootstrap.budget,
    learning: bootstrap.learning,
    dcicGameState: bootstrap.dcicGameState,
    dashboard: bootstrap.dashboard,
    missionsPipeline: bootstrap.missionsPipeline,
  });
  return djb2Hex(serial);
}

/** O.a. na uitloggen / account delete — volgende merge moet weer mogen schrijven. */
export function resetBootstrapApplyFingerprint(): void {
  lastBootstrapApplyFingerprint = null;
}

/** Single place: Zustand + TanStack Query cache + listeners (alerts, PWA chip, storage persist hint). */
export function applyBootstrapTodayToApp(bootstrap: BootstrapTodayResponse): void {
  const fp = computeBootstrapApplyFingerprint(bootstrap);
  if (fp === lastBootstrapApplyFingerprint) return;
  lastBootstrapApplyFingerprint = fp;

  const dateStr = (bootstrap.date as string | undefined) ?? getTodayKey();
  seedBootstrapTodayInCache(getBootstrapQueryClient(), dateStr, bootstrap);

  const { applyBootstrapHydration } = useHQStore.getState();

  const criticalMp = (bootstrap.dashboard?.critical as { missionsPipeline?: MissionsPipelinePayload } | undefined)
    ?.missionsPipeline;
  const rootMp = bootstrap.missionsPipeline as MissionsPipelinePayload | undefined;
  const missionsPipe = criticalMp ?? rootMp ?? null;

  let gameStatePatched: any = undefined;
  if (bootstrap.dcicGameState) {
    const nextDcic = bootstrap.dcicGameState as any;
    applyDCICModeOverrideIfAny(nextDcic);
    gameStatePatched = nextDcic;
  }

  applyBootstrapHydration({
    todayDate: dateStr,
    ...(bootstrap.dashboard
      ? {
          dashboardCritical: bootstrap.dashboard.critical as any,
          dashboardSecondary: bootstrap.dashboard.secondary as any,
        }
      : {}),
    ...(missionsPipe ? { missionsPipeline: missionsPipe } : {}),
    ...(gameStatePatched !== undefined ? { gameState: gameStatePatched as any } : {}),
    ...(bootstrap.dailyState ? { todayDailyState: bootstrap.dailyState } : {}),
    ...(bootstrap.energyBudget ? { todayEnergyBudget: bootstrap.energyBudget } : {}),
    ...(bootstrap.budget ? { budgetSnapshot: bootstrap.budget as any } : {}),
    ...(bootstrap.learning && typeof bootstrap.learning === "object"
      ? {
          learningSnapshot: {
            ...(bootstrap.learning as StoreLearningSnapshot),
          },
        }
      : {}),
  });

  const detail: NeurohqDailySnapshotUpdatedDetail = { savedAt: Date.now() };
  window.dispatchEvent(new CustomEvent(NEUROHQ_DAILY_SNAPSHOT_UPDATED, { detail }));

  void patchPersistedDailyFromBootstrap(bootstrap).catch(() => {});

  void import("@/lib/mobile/native-extended-cache").then(({ mirrorBootstrapToNativeExtendedKv }) =>
    mirrorBootstrapToNativeExtendedKv(bootstrap).catch(() => {})
  );
}

/** Merge server `/api/bootstrap/today` into HQ store and shared query cache. */
export async function refreshMergedSnapshotFromNetwork(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const bootstrap = await mergeDailySnapshotFromNetwork();
    if (!bootstrap) return;
    applyBootstrapTodayToApp(bootstrap);
  } catch {
    // non-fatal; router.refresh still runs
  }
}

/**
 * Initial load: BootstrapGate runs `initializeDailySystem()` (sequential API steps), then
 * `StoreHydrator` fills the HQ store. `useDailySnapshot()` is in-memory only for the session.
 *
 * Periodic refresh refetches `/api/bootstrap/today` and patches the HQ store.
 * Interval: `PERIODIC_SNAPSHOT_REFRESH_MINUTES` in `lib/client-refresh.ts`.
 */

/**
 * Background refresh: bootstrap refetch + HQ store updates.
 */
export function usePeriodicBootstrapRefresh(intervalMinutes = PERIODIC_SNAPSHOT_REFRESH_MINUTES) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: number | undefined;
    let stopped = false;
    let inFlight = false;
    let lastRunAt = 0;

    const runOnce = async () => {
      if (stopped || inFlight) return;
      const now = Date.now();
      if (now - lastRunAt < 25_000) return;
      inFlight = true;
      lastRunAt = now;
      try {
        const bootstrap = await mergeDailySnapshotFromNetwork();
        if (stopped || !bootstrap) return;
        applyBootstrapTodayToApp(bootstrap);
      } catch {
        // ignore periodic errors; will try again on next tick
      } finally {
        inFlight = false;
      }
    };

    const schedule = () => {
      if (stopped) return;
      const ms = Math.max(5, intervalMinutes) * 60 * 1000;
      timer = window.setTimeout(async () => {
        await runOnce();
        schedule();
      }, ms);
    };

    const kickoffId = window.setTimeout(() => void runOnce(), 4_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void runOnce();
    };
    const onFocus = () => void runOnce();
    const onOnline = () => void runOnce();

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);

    schedule();
    return () => {
      stopped = true;
      window.clearTimeout(kickoffId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [intervalMinutes]);
}

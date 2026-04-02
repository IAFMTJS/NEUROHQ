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
import { getBootstrapQueryClient } from "@/lib/bootstrap-query-client-ref";

/** Single place: Zustand + TanStack Query cache + listeners (alerts, PWA chip, storage persist hint). */
export function applyBootstrapTodayToApp(bootstrap: BootstrapTodayResponse): void {
  const dateStr = (bootstrap.date as string | undefined) ?? getTodayKey();
  seedBootstrapTodayInCache(getBootstrapQueryClient(), dateStr, bootstrap);

  const {
    setTodayDate,
    setDashboardSnapshot,
    setGameState,
    setTodayDailyState,
    setTodayEnergyBudget,
    setBudgetSnapshot,
    setLearningSnapshot,
  } = useHQStore.getState();

  setTodayDate(dateStr);
  if (bootstrap.dashboard) {
    setDashboardSnapshot({
      critical: bootstrap.dashboard.critical as any,
      secondary: bootstrap.dashboard.secondary as any,
    });
  }
  if (bootstrap.dcicGameState) {
    const nextDcic = bootstrap.dcicGameState as any;
    applyDCICModeOverrideIfAny(nextDcic);
    setGameState(nextDcic);
  }
  if (bootstrap.dailyState) setTodayDailyState(bootstrap.dailyState);
  if (bootstrap.energyBudget) setTodayEnergyBudget(bootstrap.energyBudget);
  if (bootstrap.budget) setBudgetSnapshot(bootstrap.budget as any);
  if (bootstrap.learning) setLearningSnapshot(bootstrap.learning as any);

  const detail: NeurohqDailySnapshotUpdatedDetail = { savedAt: Date.now() };
  window.dispatchEvent(new CustomEvent(NEUROHQ_DAILY_SNAPSHOT_UPDATED, { detail }));
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

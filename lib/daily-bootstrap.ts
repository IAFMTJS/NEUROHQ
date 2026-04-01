"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";
import { mergeDailySnapshotFromNetwork } from "@/lib/daily-snapshot-full-sync";
import { applyDCICModeOverrideIfAny } from "@/lib/dcic/dcic-mode-override";
import { PERIODIC_SNAPSHOT_REFRESH_MINUTES } from "@/lib/client-refresh";

/** Merge server bootstrap into IndexedDB snapshot and HQ store (after brain save, payday, etc.). */
export async function refreshMergedSnapshotFromNetwork(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const bootstrap = await mergeDailySnapshotFromNetwork();
    if (!bootstrap) return;
    const {
      setTodayDate,
      setDashboardSnapshot,
      setGameState,
      setTodayDailyState,
      setTodayEnergyBudget,
      setBudgetSnapshot,
      setLearningSnapshot,
    } = useHQStore.getState();
    const dateStr = (bootstrap.date as string | undefined) ?? undefined;
    if (dateStr) setTodayDate(dateStr);
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
  } catch {
    // non-fatal; router.refresh still runs
  }
}

/**
 * Initial daily bootstrap is handled by the DailySnapshot system:
 * - BootstrapGate runs initializeDailySystem(), which calls /api/bootstrap/today in fetchMissions (includes dashboard critical+secondary — no separate dashboard step)
 * - DashboardLayoutClient hydrates todayDate from useDailySnapshot()
 * - MissionsProvider, BudgetSnapshotProvider, and DashboardDataProvider hydrate from snapshot
 *
 * Periodic refresh runs a full snapshot merge (dashboard, bootstrap, xp, strategy, analytics, settings)
 * so localStorage stays aligned with all server slices. Interval: `PERIODIC_SNAPSHOT_REFRESH_MINUTES` in `lib/client-refresh.ts`.
 */

/**
 * Background refresh: full network merge into DailySnapshot + HQ store updates from bootstrap.
 */
export function usePeriodicBootstrapRefresh(intervalMinutes = PERIODIC_SNAPSHOT_REFRESH_MINUTES) {
  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const setDashboardSnapshot = useHQStore((s) => s.setDashboardSnapshot);
  const setGameState = useHQStore((s) => s.setGameState);
  const setTodayDailyState = useHQStore((s) => s.setTodayDailyState);
  const setTodayEnergyBudget = useHQStore((s) => s.setTodayEnergyBudget);
  const setBudgetSnapshot = useHQStore((s) => s.setBudgetSnapshot);
  const setLearningSnapshot = useHQStore((s) => s.setLearningSnapshot);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer: number | undefined;
    let stopped = false;
    let inFlight = false;
    let lastRunAt = 0;

    const runOnce = async () => {
      if (stopped || inFlight) return;
      const now = Date.now();
      // Avoid rapid repeat (focus + visibility + online can fire together).
      if (now - lastRunAt < 25_000) return;
      inFlight = true;
      lastRunAt = now;
      try {
        const bootstrap = await mergeDailySnapshotFromNetwork();
        if (stopped || !bootstrap) return;

        const dateStr = (bootstrap.date as string | undefined) ?? undefined;

        if (dateStr) setTodayDate(dateStr);
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

    // Keep the day snappy: run soon after mount (but not synchronously during first paint).
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
  }, [
    intervalMinutes,
    setBudgetSnapshot,
    setDashboardSnapshot,
    setGameState,
    setLearningSnapshot,
    setTodayDate,
    setTodayDailyState,
    setTodayEnergyBudget,
  ]);
}

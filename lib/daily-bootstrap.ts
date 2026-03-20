"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";
import { mergeDailySnapshotFromNetwork } from "@/lib/daily-snapshot-full-sync";
import { applyDCICModeOverrideIfAny } from "@/lib/dcic/dcic-mode-override";

/**
 * Initial daily bootstrap is handled by the DailySnapshot system:
 * - BootstrapGate runs initializeDailySystem(), which calls /api/bootstrap/today in fetchMissions
 * - DashboardLayoutClient hydrates todayDate from useDailySnapshot()
 * - MissionsProvider, BudgetSnapshotProvider, and DashboardDataProvider hydrate from snapshot
 *
 * Periodic refresh runs a full snapshot merge (dashboard, bootstrap, xp, strategy, analytics, settings)
 * so localStorage stays aligned with all server slices.
 */

/**
 * Background refresh: full network merge into DailySnapshot + HQ store updates from bootstrap.
 */
export function usePeriodicBootstrapRefresh(intervalMinutes = 45) {
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

    const runOnce = async () => {
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

    schedule();
    return () => {
      stopped = true;
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

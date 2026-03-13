"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";

/**
 * Initial daily bootstrap is handled by the DailySnapshot system:
 * - BootstrapGate runs initializeDailySystem(), which calls /api/bootstrap/today in fetchMissions
 * - DashboardLayoutClient hydrates todayDate from useDailySnapshot()
 * - MissionsProvider, BudgetSnapshotProvider, and DashboardDataProvider hydrate from snapshot
 *
 * This module only provides the optional periodic background refresh below.
 */

/**
 * Lightweight periodic refresh for headline metrics (dashboard, budget, learning, etc.).
 * Uses /api/bootstrap/today; does not affect first paint. Call only where a background
 * refresh is desired (e.g. long-lived dashboard shell).
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
        const res = await fetch("/api/bootstrap/today", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          date?: string;
          dashboard?: { critical?: unknown; secondary?: unknown };
          dcicGameState?: unknown;
          dailyState?: Record<string, unknown> | null;
          energyBudget?: Record<string, unknown> | null;
          budget?: Record<string, unknown> | null;
          learning?: unknown;
        };
        if (stopped) return;

        if (data.date) setTodayDate(data.date);
        if (data.dashboard) {
          setDashboardSnapshot({
            critical: data.dashboard.critical,
            secondary: data.dashboard.secondary,
          });
        }
        if (data.dcicGameState) setGameState(data.dcicGameState);
        if (data.dailyState) setTodayDailyState(data.dailyState);
        if (data.energyBudget) setTodayEnergyBudget(data.energyBudget);
        if (data.budget) setBudgetSnapshot(data.budget);
        if (data.learning) setLearningSnapshot(data.learning);
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

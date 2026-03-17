"use client";

import { useEffect } from "react";
import { useHQStore } from "@/lib/hq-store";
import {
  loadDailySnapshot,
  saveDailySnapshot,
  isCurrentSnapshot,
} from "@/lib/daily-snapshot-storage";
import type { DailySnapshot } from "@/types/daily-snapshot";

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

        const dateStr = (data.date as string | undefined) ?? undefined;

        if (dateStr) setTodayDate(dateStr);
        if (data.dashboard) {
          setDashboardSnapshot({
            critical: data.dashboard.critical as any,
            secondary: data.dashboard.secondary as any,
          });
        }
        if (data.dcicGameState) setGameState(data.dcicGameState as any);
        if (data.dailyState) setTodayDailyState(data.dailyState);
        if (data.energyBudget) setTodayEnergyBudget(data.energyBudget);
        if (data.budget) setBudgetSnapshot(data.budget as any);
        if (data.learning) setLearningSnapshot(data.learning as any);

        // Best-effort: merge refreshed bootstrap payload back into the existing
        // same-day DailySnapshot so the next cold-start uses the latest data.
        try {
          const existing = await loadDailySnapshot();
          if (existing && isCurrentSnapshot(existing)) {
            const next: DailySnapshot = {
              ...existing,
              date: dateStr ?? existing.date,
              missions:
                data.dailyState || data.energyBudget
                  ? {
                      ...(existing.missions ?? {
                        dateStr: dateStr ?? existing.date,
                        tasksByDate: {},
                        completedToday: [],
                        energyBudget: null,
                        dailyState: null,
                      }),
                      dateStr: dateStr ?? existing.missions?.dateStr ?? existing.date,
                      energyBudget: (data.energyBudget as Record<string, unknown>) ?? existing.missions?.energyBudget ?? null,
                      dailyState: (data.dailyState as Record<string, unknown>) ?? existing.missions?.dailyState ?? null,
                    }
                  : existing.missions,
              budget:
                data.budget != null
                  ? (({
                      ...(existing.budget ?? {
                        today: dateStr ?? existing.date,
                        settings: {},
                        currentMonthExpenses: null,
                        currentMonthIncome: null,
                        budgetRemainingCents: null,
                        currency: "EUR",
                        isWeekly: false,
                        periodLabel: "this month",
                        isPaydayCycle: false,
                        disciplineScore: null,
                        disciplineXpThisWeek: 0,
                        disciplineCompletedToday: false,
                        daysUnderBudgetThisWeek: null,
                        unplannedSummary: { count: 0, totalCents: 0 },
                      }),
                      ...data.budget,
                      today:
                        (data as { budget?: { today?: string } }).budget?.["today"] ??
                        existing.budget?.today ??
                        dateStr ??
                        existing.date,
                    }) as DailySnapshot["budget"])
                  : existing.budget,
              learning:
                data.learning != null
                  ? (({
                      ...(existing.learning ?? {
                        today: dateStr ?? existing.date,
                        weeklyMinutes: 0,
                        weeklyLearningTarget: 0,
                        learningStreak: 0,
                        focus: null,
                        streams: [],
                        consistency: null,
                        reflection: { lastEntryDate: null, reflectionRequired: false },
                      }),
                      ...data.learning,
                      today:
                        (data as { learning?: { today?: string } }).learning?.["today"] ??
                        existing.learning?.today ??
                        dateStr ??
                        existing.date,
                    }) as DailySnapshot["learning"])
                  : existing.learning,
              ui: {
                ...existing.ui,
                savedAt: Date.now(),
              },
            };
            await saveDailySnapshot(next);
          }
        } catch {
          // non-critical; ignore snapshot merge errors
        }
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

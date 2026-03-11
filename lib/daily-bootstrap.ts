"use client";

import { useEffect, useRef } from "react";
import { useHQStore } from "@/lib/hq-store";

const LAST_BOOTSTRAP_KEY = "neurohq-last-bootstrap-date";

type Status = "idle" | "loading" | "ready" | "error";

export function useDailyBootstrap() {
  const todayDate = useHQStore((s) => s.todayDate);
  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const setDashboardSnapshot = useHQStore((s) => s.setDashboardSnapshot);
  const setGameState = useHQStore((s) => s.setGameState);
  const setTodayDailyState = useHQStore((s) => s.setTodayDailyState);
  const setTodayEnergyBudget = useHQStore((s) => s.setTodayEnergyBudget);
  const setBudgetSnapshot = useHQStore((s) => s.setBudgetSnapshot);
  const setLearningSnapshot = useHQStore((s) => s.setLearningSnapshot);

  const statusRef = useRef<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (statusRef.current === "loading" || statusRef.current === "ready") return;

    const lastBootstrap = window.localStorage.getItem(LAST_BOOTSTRAP_KEY);

    const run = async () => {
      statusRef.current = "loading";
      try {
        const res = await fetch("/api/bootstrap/today", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          statusRef.current = "error";
          return;
        }
        const data = await res.json();

        const date: string = data.date;
        setTodayDate(date);

        if (data.dashboard) {
          setDashboardSnapshot({
            critical: data.dashboard.critical,
            secondary: data.dashboard.secondary,
          });
        }
        if (data.dcicGameState) {
          setGameState(data.dcicGameState);
        }
        if (data.dailyState) {
          setTodayDailyState(data.dailyState);
        }
        if (data.energyBudget) {
          setTodayEnergyBudget(data.energyBudget);
        }
        if (data.budget) {
          setBudgetSnapshot(data.budget);
        }
        if (data.learning) {
          setLearningSnapshot(data.learning);
        }

        try {
          window.localStorage.setItem(LAST_BOOTSTRAP_KEY, date);
        } catch {
          // ignore
        }

        statusRef.current = "ready";
      } catch (err) {
        console.error("[daily-bootstrap]", err);
        statusRef.current = "error";
      }
    };

    // If we already bootstrapped today, skip network and rely on persisted store.
    if (lastBootstrap && todayDate && lastBootstrap === todayDate) {
      statusRef.current = "ready";
      return;
    }

    void run();
  }, [setBudgetSnapshot, setDashboardSnapshot, setGameState, setLearningSnapshot, setTodayDate, setTodayDailyState, setTodayEnergyBudget, todayDate]);
}

/**
 * Lightweight periodic refresh for headline metrics (XP, streak, budget, learning, dashboard snapshot).
 * Uses the same /api/bootstrap/today endpoint but does not affect first paint; call this only after initial bootstrap.
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
        const data = await res.json();
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
  }, [intervalMinutes, setBudgetSnapshot, setDashboardSnapshot, setGameState, setLearningSnapshot, setTodayDate, setTodayDailyState, setTodayEnergyBudget]);
}
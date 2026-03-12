"use client";

import { useEffect, useRef } from "react";
import { useHQStore } from "@/lib/hq-store";

const LAST_BOOTSTRAP_KEY = "neurohq-last-bootstrap-date";
const BOOTSTRAP_CACHE_KEY = "neurohq-daily-bootstrap-cache";

type BootstrapTodayPayload = {
  date: string;
  dashboard?: {
    critical?: unknown;
    secondary?: unknown;
  };
  dcicGameState?: unknown;
  dailyState?: Record<string, unknown> | null;
  energyBudget?: Record<string, unknown> | null;
  budget?: Record<string, unknown> | null;
  learning?: unknown;
  tasks?: Record<string, unknown>;
};

type DailyMemoryCache = {
  date: string | null;
  data: BootstrapTodayPayload | null;
};

const dailyMemoryCache: DailyMemoryCache = {
  date: null,
  data: null,
};

function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function loadBootstrapToday(): Promise<BootstrapTodayPayload | null> {
  const today = getTodayDateStr();

  // 1. MEMORY CACHE (fastest)
  if (dailyMemoryCache.date === today && dailyMemoryCache.data) {
    return dailyMemoryCache.data;
  }

  // 2. LOCAL STORAGE (survives refresh / app reopen)
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(BOOTSTRAP_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { date?: string; data?: BootstrapTodayPayload };
        if (parsed && parsed.date === today && parsed.data) {
          dailyMemoryCache.date = today;
          dailyMemoryCache.data = parsed.data;
          return parsed.data;
        }
      }
    }
  } catch {
    // Ignore cache read errors and fall back to network.
  }

  // 3. NETWORK (Supabase via /api/bootstrap/today) – once per day
  const res = await fetch("/api/bootstrap/today", {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as BootstrapTodayPayload;
  const date = data.date ?? today;

  const payload: BootstrapTodayPayload = {
    ...data,
    date,
  };

  dailyMemoryCache.date = date;
  dailyMemoryCache.data = payload;

  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        BOOTSTRAP_CACHE_KEY,
        JSON.stringify({
          date,
          data: payload,
        })
      );
      window.localStorage.setItem(LAST_BOOTSTRAP_KEY, date);
    }
  } catch {
    // Ignore quota or security errors.
  }

  return payload;
}

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
  const setTasksForDate = useHQStore((s) => s.setTasksForDate);

  const statusRef = useRef<Status>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (statusRef.current === "loading" || statusRef.current === "ready") return;

    const run = async () => {
      statusRef.current = "loading";
      try {
        const data = await loadBootstrapToday();
        if (!data) {
          statusRef.current = "error";
          return;
        }

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
        if (data.tasks && typeof data.tasks === "object") {
          const tasksForToday = (data.tasks as Record<string, unknown[]>)[date];
          if (Array.isArray(tasksForToday)) {
            setTasksForDate(date, tasksForToday as unknown as Parameters<typeof setTasksForDate>[1]);
          }
        }

        statusRef.current = "ready";
      } catch (err) {
        console.error("[daily-bootstrap]", err);
        statusRef.current = "error";
      }
    };

    void run();
  }, [setBudgetSnapshot, setDashboardSnapshot, setGameState, setLearningSnapshot, setTasksForDate, setTodayDate, setTodayDailyState, setTodayEnergyBudget, todayDate]);
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
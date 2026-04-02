"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Task } from "@/types/database.types";
import type { MissionsSnapshot } from "@/types/daily-snapshot";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { getTodayKey } from "@/lib/daily-date";
import { useHQStore } from "@/lib/hq-store";
import { useBootstrapToday } from "@/lib/use-bootstrap-today";
import { missionsFromBootstrapToday } from "@/lib/bootstrap-today-mappers";

type Props = {
  dateStr: string;
  children: ReactNode;
};

const MissionsContext = createContext<MissionsSnapshot | null>(null);

export function useMissionsSnapshot(): MissionsSnapshot | null {
  return useContext(MissionsContext);
}

/**
 * Makes the daily missions snapshot available to client components and hydrates the
 * HQ store from it so existing task flows can reuse the same source of truth.
 */
export function MissionsProvider({ dateStr, children }: Props) {
  const snapshot = useDailySnapshot();
  const { data: bootstrapToday } = useBootstrapToday(dateStr);
  const missions = useMemo((): MissionsSnapshot | null => {
    if (snapshot?.missions && snapshot.missions.dateStr === dateStr) {
      return snapshot.missions;
    }
    return missionsFromBootstrapToday(bootstrapToday, dateStr);
  }, [snapshot?.missions, bootstrapToday, dateStr]);

  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const setTodayDailyState = useHQStore((s) => s.setTodayDailyState);
  const setTodayEnergyBudget = useHQStore((s) => s.setTodayEnergyBudget);
  const setTasksForDate = useHQStore((s) => s.setTasksForDate);
  const setTasksStatus = useHQStore((s) => s.setTasksStatus);
  const setTasksError = useHQStore((s) => s.setTasksError);
  const existingTodayCount = useHQStore((s) => (s.tasksByDate[dateStr]?.length ?? 0));

  useEffect(() => {
    if (!missions) return;
    const todayKey = getTodayKey();
    setTodayDate(dateStr);
    if (missions.dailyState) {
      setTodayDailyState(missions.dailyState);
    }
    if (missions.energyBudget) {
      setTodayEnergyBudget(missions.energyBudget);
    }
    for (const [day, tasks] of Object.entries(missions.tasksByDate)) {
      const list = tasks as Task[];
      const withoutDeleted = list.filter((t) => !(t as { deleted_at?: string | null }).deleted_at);
      // Only hydrate today's tasks when the store doesn't already have them (avoid clobbering fresh client changes).
      if (day === todayKey && existingTodayCount > 0) continue;
      setTasksForDate(day, withoutDeleted);
    }
    setTasksError(null);
    setTasksStatus("ready");
  }, [
    dateStr,
    existingTodayCount,
    missions,
    setTasksError,
    setTasksForDate,
    setTasksStatus,
    setTodayDailyState,
    setTodayDate,
    setTodayEnergyBudget,
  ]);

  return (
    <MissionsContext.Provider value={missions}>
      {children}
    </MissionsContext.Provider>
  );
}


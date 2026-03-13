"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import type { Task } from "@/types/database.types";
import type { MissionsSnapshot } from "@/types/daily-snapshot";
import { useDailySnapshot } from "@/components/bootstrap/BootstrapGate";
import { useHQStore } from "@/lib/hq-store";

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
  const missions =
    snapshot?.missions && snapshot.missions.dateStr === dateStr
      ? snapshot.missions
      : null;

  const setTodayDate = useHQStore((s) => s.setTodayDate);
  const setTodayDailyState = useHQStore((s) => s.setTodayDailyState);
  const setTodayEnergyBudget = useHQStore((s) => s.setTodayEnergyBudget);
  const setTasksForDate = useHQStore((s) => s.setTasksForDate);
  const setTasksStatus = useHQStore((s) => s.setTasksStatus);
  const setTasksError = useHQStore((s) => s.setTasksError);

  useEffect(() => {
    if (!missions) return;
    setTodayDate(dateStr);
    if (missions.dailyState) {
      setTodayDailyState(missions.dailyState);
    }
    if (missions.energyBudget) {
      setTodayEnergyBudget(missions.energyBudget);
    }
    for (const [day, tasks] of Object.entries(missions.tasksByDate)) {
      setTasksForDate(day, tasks as Task[]);
    }
    setTasksError(null);
    setTasksStatus("ready");
  }, [
    dateStr,
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


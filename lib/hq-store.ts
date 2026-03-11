import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState } from "@/lib/dcic/types";
import type { DashboardCritical, DashboardSecondary } from "@/types/dashboard-data.types";
import type { Task } from "@/types/database.types";
import type { LearningState } from "@/app/actions/learning-state";

export type LearningSnapshot = {
  weeklyMinutes: number;
  weeklyLearningTarget: number;
  learningStreak: number;
  focus: LearningState["focus"] | null;
  streams: LearningState["streams"];
  consistency: LearningState["consistency"];
  reflection: Pick<LearningState["reflection"], "lastEntryDate" | "reflectionRequired">;
};

type DCICSlice = {
  gameState: GameState | null;
  gameStateStatus: "idle" | "loading" | "ready" | "error";
  gameStateError: string | null;
  setGameState: (state: GameState | null) => void;
  setGameStateStatus: (status: DCICSlice["gameStateStatus"]) => void;
  setGameStateError: (error: string | null) => void;
};

type DashboardSlice = {
  dashboardCritical: DashboardCritical | null;
  dashboardSecondary: DashboardSecondary | null;
  setDashboardSnapshot: (payload: { critical?: DashboardCritical | null; secondary?: DashboardSecondary | null }) => void;
};

type TasksSlice = {
  /** tasksByDate[YYYY-MM-DD] = tasks for that day */
  tasksByDate: Record<string, Task[]>;
  tasksStatus: "idle" | "loading" | "ready" | "error";
  tasksError: string | null;
  setTasksForDate: (date: string, tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (id: string, date: string) => void;
  setTasksStatus: (status: TasksSlice["tasksStatus"]) => void;
  setTasksError: (error: string | null) => void;
};

type TodaySlice = {
  todayDate: string | null;
  todayDailyState: Record<string, unknown> | null;
  todayMode: string | null;
  todayEnergyBudget: Record<string, unknown> | null;
  setTodayDate: (date: string) => void;
  setTodayDailyState: (state: Record<string, unknown> | null) => void;
  setTodayMode: (mode: string | null) => void;
  setTodayEnergyBudget: (budget: Record<string, unknown> | null) => void;
};

type BudgetSlice = {
  budgetSnapshot: Record<string, unknown> | null;
  budgetStatus: "idle" | "loading" | "ready" | "error";
  budgetError: string | null;
  setBudgetSnapshot: (snapshot: Record<string, unknown> | null) => void;
  setBudgetStatus: (status: BudgetSlice["budgetStatus"]) => void;
  setBudgetError: (error: string | null) => void;
};

type LearningSlice = {
  learningSnapshot: LearningSnapshot | null;
  learningStatus: "idle" | "loading" | "ready" | "error";
  learningError: string | null;
  setLearningSnapshot: (snapshot: LearningSnapshot | null) => void;
  setLearningStatus: (status: LearningSlice["learningStatus"]) => void;
  setLearningError: (error: string | null) => void;
};

type HQStore = DCICSlice & DashboardSlice & TasksSlice & TodaySlice & BudgetSlice & LearningSlice;

const HQ_PERSIST_KEY = "neurohq-hq-store";

function partialize(state: HQStore) {
  return {
    gameState: state.gameState,
    gameStateStatus: state.gameStateStatus,
    gameStateError: state.gameStateError,
    dashboardCritical: state.dashboardCritical,
    dashboardSecondary: state.dashboardSecondary,
    tasksByDate: state.tasksByDate,
    tasksStatus: state.tasksStatus,
    tasksError: state.tasksError,
    todayDate: state.todayDate,
    todayDailyState: state.todayDailyState,
    todayMode: state.todayMode,
    todayEnergyBudget: state.todayEnergyBudget,
    budgetSnapshot: state.budgetSnapshot,
    budgetStatus: state.budgetStatus,
    budgetError: state.budgetError,
    learningSnapshot: state.learningSnapshot,
    learningStatus: state.learningStatus,
    learningError: state.learningError,
  };
}

/**
 * Read persisted dashboard from localStorage synchronously (same key as persist).
 * Use for first-paint so the dashboard can show without waiting for rehydration or IndexedDB.
 */
export function getPersistedDashboardSync(): {
  critical: DashboardCritical | null;
  secondary: DashboardSecondary | null;
} {
  try {
    if (typeof window === "undefined" || !window.localStorage) return { critical: null, secondary: null };
    const raw = window.localStorage.getItem(HQ_PERSIST_KEY);
    if (!raw) return { critical: null, secondary: null };
    const parsed = JSON.parse(raw) as {
      dashboardCritical?: DashboardCritical | null;
      dashboardSecondary?: DashboardSecondary | null;
    };
    return {
      critical: parsed.dashboardCritical ?? null,
      secondary: parsed.dashboardSecondary ?? null,
    };
  } catch {
    return { critical: null, secondary: null };
  }
}

/**
 * Write current HQ store state to localStorage immediately.
 * Call when the app is hidden or closed so a full reload restores the latest state.
 */
export function flushHQStoreToStorage(): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const state = useHQStore.getState();
    window.localStorage.setItem(HQ_PERSIST_KEY, JSON.stringify(partialize(state)));
  } catch {
    // Ignore quota or security errors
  }
}

export const useHQStore = create<HQStore>()(
  persist(
    (set) => ({
      // DCIC
      gameState: null,
      gameStateStatus: "idle",
      gameStateError: null,
      setGameState: (state) => set({ gameState: state }),
      setGameStateStatus: (status) => set({ gameStateStatus: status }),
      setGameStateError: (error) => set({ gameStateError: error }),
      // Dashboard snapshot
      dashboardCritical: null,
      dashboardSecondary: null,
      setDashboardSnapshot: ({ critical, secondary }) =>
        set((prev) => ({
          dashboardCritical: critical !== undefined ? critical : prev.dashboardCritical,
          dashboardSecondary: secondary !== undefined ? secondary : prev.dashboardSecondary,
        })),
      // Tasks
      tasksByDate: {},
      tasksStatus: "idle",
      tasksError: null,
      setTasksForDate: (date, tasks) =>
        set((prev) => ({
          tasksByDate: {
            ...prev.tasksByDate,
            [date]: tasks,
          },
        })),
      upsertTask: (task) =>
        set((prev) => {
          const date = (task as { due_date?: string | null }).due_date ?? "";
          if (!date) return prev;
          const list = prev.tasksByDate[date] ?? [];
          const idx = list.findIndex((t) => t.id === task.id);
          const next =
            idx === -1
              ? [...list, task]
              : [...list.slice(0, idx), task, ...list.slice(idx + 1)];
          return {
            tasksByDate: {
              ...prev.tasksByDate,
              [date]: next,
            },
          };
        }),
      removeTask: (id, date) =>
        set((prev) => {
          const list = prev.tasksByDate[date] ?? [];
          return {
            tasksByDate: {
              ...prev.tasksByDate,
              [date]: list.filter((t) => t.id !== id),
            },
          };
        }),
      setTasksStatus: (tasksStatus) => set({ tasksStatus }),
      setTasksError: (tasksError) => set({ tasksError }),
      // Today slice (daily state + mode + energy)
      todayDate: null,
      todayDailyState: null,
      todayMode: null,
      todayEnergyBudget: null,
      setTodayDate: (todayDate) => set({ todayDate }),
      setTodayDailyState: (todayDailyState) => set({ todayDailyState }),
      setTodayMode: (todayMode) => set({ todayMode }),
      setTodayEnergyBudget: (todayEnergyBudget) => set({ todayEnergyBudget }),
      // Budget
      budgetSnapshot: null,
      budgetStatus: "idle",
      budgetError: null,
      setBudgetSnapshot: (budgetSnapshot) => set({ budgetSnapshot }),
      setBudgetStatus: (budgetStatus) => set({ budgetStatus }),
      setBudgetError: (budgetError) => set({ budgetError }),
      // Learning
      learningSnapshot: null,
      learningStatus: "idle",
      learningError: null,
      setLearningSnapshot: (learningSnapshot) => set({ learningSnapshot }),
      setLearningStatus: (learningStatus) => set({ learningStatus }),
      setLearningError: (learningError) => set({ learningError }),
    }),
    {
      name: HQ_PERSIST_KEY,
      partialize,
    }
  )
);


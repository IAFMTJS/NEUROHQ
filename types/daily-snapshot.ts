export const LATEST_SNAPSHOT_VERSION = 1 as const;

export type DailySnapshotVersion = typeof LATEST_SNAPSHOT_VERSION;

// Dashboard
import type {
  DashboardCritical,
  DashboardSecondary,
} from "@/types/dashboard-data.types";
import type { XPCachePayload } from "@/lib/xp-cache";

/**
 * Snapshot of dashboard data required for first render.
 * Mirrors what `/api/dashboard/data?part=all` returns today.
 */
export interface DashboardSnapshot {
  critical: DashboardCritical;
  secondary: DashboardSecondary;
}

/**
 * Snapshot of missions/tasks state required for first render of the Missions page.
 * This is intentionally generic for now and will be refined as we wire it in.
 */
export interface MissionsSnapshot {
  dateStr: string;
  tasksByDate: Record<string, unknown[]>;
  completedToday: unknown[];
  energyBudget: Record<string, unknown> | null;
  dailyState: Record<string, unknown> | null;
}

/**
 * Snapshot of XP/identity/forecast context used by the XP Command Center and insights.
 * Mirrors the XPCachePayload structure used by XPDataProvider.
 */
export interface XPSnapshot {
  today: string;
  cache: XPCachePayload;
}

/**
 * Snapshot of strategy focus and related analytics.
 */
export interface StrategySnapshot {
  today: string;
  payload: unknown;
}

/**
 * Snapshot of learning/growth state – currently mirrors the existing LearningSnapshot
 * used by the HQ store bootstrap API.
 */
export interface LearningSnapshot {
  today: string;
  weeklyMinutes: number;
  weeklyLearningTarget: number;
  learningStreak: number;
  focus: unknown | null;
  streams: unknown;
  consistency: unknown;
  reflection: {
    lastEntryDate: string | null;
    reflectionRequired: boolean;
  };
}

/**
 * Snapshot of the user's budget/finance state for the current period.
 * Extended to cover first-paint hero + summary data.
 */
export interface BudgetSnapshot {
  today: string;
  settings: Record<string, unknown>;
  currentMonthExpenses: number | null;
  currentMonthIncome: number | null;
  budgetRemainingCents: number | null;
  currency: string;
  isWeekly: boolean;
  periodLabel: string;
  isPaydayCycle: boolean;
  disciplineScore: number | null;
  disciplineXpThisWeek: number;
  disciplineCompletedToday: boolean;
  daysUnderBudgetThisWeek: number | null;
  unplannedSummary: { count: number; totalCents: number };
}

/**
 * Snapshot of analytics/insights aggregates (7d/30d, funnels, etc.).
 */
export interface AnalyticsSnapshot {
  today: string;
  payload: unknown;
}

/**
 * Minimal settings for first-paint (theme, compact_ui, push_personality_mode, etc.). No secrets.
 */
export interface SettingsSnapshot {
  today: string;
  preferences: Record<string, unknown>;
  payday: { last_payday_date: string | null; payday_day_of_month: number | null };
}

export interface DailySnapshotUIState {
  /**
   * Absolute routes that were prefetched during the preload step.
   */
  pagesPrefetched: string[];
  /**
   * Indicates whether the preloadAssets step completed successfully.
   */
  assetsPrefetched: boolean;
  /**
   * When true, we are running from a previous-day snapshot in offline/degraded mode.
   */
  offlineMode?: boolean;
}

export interface DailySnapshot {
  version: DailySnapshotVersion;
  /**
   * Canonical date key for which this snapshot is valid (YYYY-MM-DD in app timezone).
   */
  date: string;

  dashboard: DashboardSnapshot | null;
  missions: MissionsSnapshot | null;
  xp: XPSnapshot | null;
  strategy: StrategySnapshot | null;
  learning: LearningSnapshot | null;
  budget: BudgetSnapshot | null;
  analytics: AnalyticsSnapshot | null;
  /** Optional for backward compat with snapshots saved before this field existed. */
  settings?: SettingsSnapshot | null;

  ui: DailySnapshotUIState;
}

export function isCompatibleSnapshot(value: unknown): value is DailySnapshot {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<DailySnapshot>;
  if (typeof v.version !== "number" || v.version !== LATEST_SNAPSHOT_VERSION) {
    return false;
  }
  if (typeof v.date !== "string") return false;
  if (!v.ui || typeof v.ui !== "object") return false;
  return true;
}


/**
 * Bump when the persisted snapshot contract changes (new required slices, incompatible shape).
 * v2: DCIC mode is day-locked server-side (`daily_state.dcic_mode`); `dcicGameState` in the snapshot
 * must match bootstrap `getGameState` for that date. Stale v1 snapshots are discarded via `isCompatibleSnapshot`.
 * v3: Budget slice matches `/api/bootstrap/today` (weekly month income/expense, `financeState`, `financialInsights`);
 * invalidates older caches so first paint uses the full current bootstrap shape.
 */
export const LATEST_SNAPSHOT_VERSION = 3 as const;

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
 * Calendar tab: month grid task range + agenda events (matches `getCalendarTabData`).
 * `monthKey` is the visible month (YYYY-MM); range covers adjacent grid bleed days.
 */
export interface CalendarTabSnapshot {
  monthKey: string;
  anchorDate: string;
  rangeStart: string;
  rangeEnd: string;
  tasksByDate: Record<string, unknown[]>;
  upcomingCalendarEvents: Array<{
    id: string;
    title: string | null;
    start_at: string;
    end_at: string;
    is_social: boolean;
    source: string | null;
  }>;
  hasGoogle: boolean;
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
  /** Present when `budget_period` is weekly; mirrors bootstrap `currentWeekExpenses`. */
  currentWeekExpenses: number | null;
  currentWeekIncome: number | null;
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
  /** Same object as bootstrap `budget.financeState` (period, discipline, etc.). */
  financeState: unknown | null;
  financialInsights: unknown | null;
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
  /**
   * Client-side timestamp (ms since epoch) when this snapshot was last saved (metadata).
   */
  savedAt?: number;
  /**
   * True when the last write to `localStorage` was verified with a byte-identical read-back.
   */
  persistVerified?: boolean;
  /**
   * True when the service worker finished the authenticated day-cache warmup (within timeout).
   */
  swCacheWarmupOk?: boolean;
  /** Epoch ms when `router.prefetch` was invoked for the bootstrap route list. */
  prefetchInvokedAt?: number;
  /** Shell raster URLs that finished load+decode (see `shellVisualsTotal`). */
  shellVisualsLoadedCount?: number;
  shellVisualsTotal?: number;
  /** True when decode/load succeeded for all shell visuals (or none to load). */
  shellVisualsDecodeOk?: boolean;
  /** True when `navigator.storage.estimate()` usage is above a high threshold of quota. */
  storagePressure?: boolean;
  /** Set after a full fresh bootstrap finishes and the final snapshot is persisted. */
  bootstrapCompletedAt?: number;
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
  /** Tasks calendar month grid + events; optional for older persisted snapshots. */
  calendar?: CalendarTabSnapshot | null;
  /** Optional for backward compat with snapshots saved before this field existed. */
  settings?: SettingsSnapshot | null;
  /**
   * DCIC game state from `/api/bootstrap/today` — same object as server `getGameState` after
   * `lock_daily_dcic_mode_if_unset` (mode stable for the calendar day). Refreshed by
   * `mergeDailySnapshotFromNetwork` / `scheduleSyncDailySnapshot` after mutations.
   */
  dcicGameState?: unknown | null;

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


import type { AppMode } from "@/lib/app-mode";

/** Shape of GET /api/dashboard/data?part=critical — single source for today's mode, tasks, state, etc. */
export interface DashboardCritical {
  dateStr: string;
  isMinimalUI: boolean;
  energyPct: number;
  focusPct: number;
  loadPct: number;
  budgetRemainingCents: number | null;
  currency: string;
  xp: { total_xp: number; level: number };
  economy: { discipline_points: number; focus_credits: number; momentum_boosters: number };
  actionsCount: number;
  topQuickActions: { key: string; label: string; href: string }[];
  missionLabel: string;
  singleGoalLabel: string | null;
  missionSubtext: string;
  emptyMissionMessage: string;
  emptyMissionHref: string;
  dailyQuoteText: string | null;
  dailyQuoteAuthor: string | null;
  streakAtRisk: boolean;
  todaysTasks: { id: string; title: string; carryOverCount: number }[];
  timeWindow: string;
  isTimeWindowActive: boolean;
  energyBudget: Record<string, unknown>;
  state: { energy?: number; focus?: number; sensory_load?: number; sleep_hours?: number; social_load?: number } | null;
  yesterdayState: { energy?: number; focus?: number; sensory_load?: number; sleep_hours?: number; social_load?: number } | null;
  mode: AppMode;
  carryOverCount: number;
  copyVariant?: string;
  accountabilitySettings?: { enabled: boolean; streakFreezeTokens: number };
  learningStreak?: number;
  autoSuggestions?: { text: string; type: string }[];
  burnout?: boolean;
}

/** Secondary payload is large and shape varies by usage; type narrowly where needed. */
export type DashboardSecondary = Record<string, unknown>;

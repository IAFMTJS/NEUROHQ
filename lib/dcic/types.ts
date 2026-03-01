/**
 * Dark Commander Intelligence Core - Type Definitions
 * Core state structures and interfaces
 */

// ============================================================================
// GAME STATE (Gameplay Core)
// ============================================================================

export type MissionType = "routine" | "milestone" | "skill_bound" | "challenge" | "habit";
export type LifeArea = "physical" | "mental" | "work" | "social" | "financial";

export interface Mission {
  id: string;
  name: string;
  xpReward: number;
  energyCost: number;
  completed: boolean;
  active: boolean;
  startedAt: string | null;
  completedAt: string | null;
  difficultyLevel: number; // 0.1 - 1.0
  /** 1–10 focus required (Brain Circle); aligned with tasks. */
  focusRequirement?: number | null;
  /** 1–10 social intensity; aligned with tasks.social_load. */
  socialIntensity?: number | null;
  missionType?: MissionType;
  category?: LifeArea | string | null;
  skillLink?: string | null;
  recurrenceType?: "daily" | "weekly" | "monthly" | null;
  streakEligible?: boolean;
}

// ============================================================================
// FINANCE STATE (Cashflow Intelligence)
// ============================================================================

export interface IncomeSource {
  id: string;
  name: string;
  amount: number; // in cents
  dayOfMonth: number; // 1-31
  type: "monthly" | "weekly" | "biweekly";
}

export interface BudgetTarget {
  category: string;
  target: number; // in cents
  priority: number; // 1-3, lower = higher priority
  flexible: boolean;
}

export interface Expense {
  id: string;
  amount: number; // in cents (negative for expenses)
  date: string;
  category: string | null;
  note: string | null;
  recurring: boolean;
  isPlanned: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number; // in cents
  current: number; // in cents
  deadline: string | null;
}

export interface FinanceState {
  income: {
    sources: IncomeSource[];
  };
  cycle: {
    startDay: number; // Budget cycle start = salary day (1-31) when no startDate
    /** When set, budget period runs from this date until next expected payday. */
    startDate?: string; // YYYY-MM-DD
  };
  balance: {
    current: number; // in cents
  };
  budgetTargets: BudgetTarget[];
  expenses: Expense[];
  goals: SavingsGoal[];
  disciplineScore: number; // 0-100
  /** Optional: how many weekly reviews completed in the last N weeks. */
  weeklyReviewsCompletedLast4Weeks?: number;
  weeksConsideredForReviews?: number;
}

export interface GameState {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  stats: {
    energy: number;
    focus: number;
    load: number;
  };
  missions: Mission[];
  skills: Record<string, boolean>;
  streak: {
    current: number;
    longest: number;
    lastCompletionDate: string | null;
  };
  rank: string;
  achievements: Record<string, boolean>;
  finance?: FinanceState; // Integrated finance state
}

// ============================================================================
// ASSISTANT STATE (Conversation Intelligence)
// ============================================================================

export type Intent =
  | "start_mission"
  | "complete_mission"
  | "create_calendar_event"
  | "ask_status"
  | "resistance"
  | "confirm_action"
  | "unknown";

export interface AssistantState {
  lastIntent: Intent | null;
  lastTopic: string | null;
  pendingAction: ActionObject | null;
  clarificationNeeded: boolean;
  recentEntities: {
    missionId: string | null;
    dateReference: string | null;
    taskId: string | null;
  };
  userSignals: {
    resistance: boolean;
    fatigue: boolean;
    doubt: boolean;
    urgency: boolean;
  };
  patterns: {
    averageStartTime: string | null;
    averageMissionDuration: number | null;
    streakBreakDay: string | null;
  };
}

// ============================================================================
// ACTION OBJECT MODEL
// ============================================================================

export interface ActionObject {
  type: Intent;
  priority: number;
  requiresConfirmation: boolean;
  data: {
    missionId?: string;
    date?: string;
    time?: string;
    [key: string]: unknown;
  };
  simulation: SimulationResult | null;
}

// ============================================================================
// SIMULATION RESULT
// ============================================================================

export interface SimulationResult {
  xpGain: number;
  newLevel: number;
  newRank: string;
  energyAfter: number;
  streakAfter: number;
  projectedAchievements: string[];
}

// ============================================================================
// BEHAVIOUR LOG
// ============================================================================

export interface BehaviourLogEntry {
  date: string;
  missionStartedAt: string | null;
  missionCompletedAt: string | null;
  energyBefore: number;
  energyAfter: number;
  resistedBeforeStart: boolean;
  difficultyLevel: number;
  xpGained?: number;
  /** Fase 3: 0–100 */
  performanceScore?: number | null;
  /** Fase 3: S/A/B/C */
  performanceRank?: "S" | "A" | "B" | "C" | null;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// ============================================================================
// CONFIDENCE LEVELS
// ============================================================================

export type ConfidenceLevel = "strong" | "medium" | "low" | "reduced" | "very_low";

export interface IntentScore {
  intent: Intent;
  score: number;
  confidence: ConfidenceLevel;
}

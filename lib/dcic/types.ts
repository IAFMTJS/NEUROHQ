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
  /** normal | recovery | push | chaos | scarcity (gevaarlijke modules). */
  missionIntent?: "normal" | "recovery" | "push" | "chaos" | "scarcity" | null;
  /** Time-bound missions that disappear or change after this moment. */
  expiresAt?: string | null;
  /** How unstable this mission is; 0–1 determines chance of escalation/expiry. */
  volatility?: number | null;
  /** Risk profile used for penalties/rewards and anti-cheat analysis. */
  riskLevel?: "low" | "medium" | "high" | null;
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
    /** When set (e.g. after "Vandaag loon gehad"), use for days until next income and labels. */
    nextPaydayDate?: string; // YYYY-MM-DD
    daysUntilNextIncome?: number;
  };
  balance: {
    current: number; // in cents
  };
  planning?: {
    plannedBudgetCents: number;
    plannedSavingsCents: number;
    plannedSpendableCents: number;
    plannedRemainingCents: number;
    periodSpentCents: number;
    budgetPeriod: "monthly" | "weekly";
    periodStart: string;
    periodEnd: string;
    weekStart: string;
    weekEnd: string;
    weekSpentCents: number;
  };
  budgetTargets: BudgetTarget[];
  expenses: Expense[];
  goals: SavingsGoal[];
  disciplineScore: number; // 0-100
  /** Optional: how many weekly reviews completed in the last N weeks. */
  weeklyReviewsCompletedLast4Weeks?: number;
  weeksConsideredForReviews?: number;
}

// ============================================================================
// DIFFICULTY ENGINE (Behavioural scaling 1–100)
// ============================================================================

export interface DifficultyEngine {
  dailyMissions: number;
  missionDurationMin: number;
  missionDurationMax: number;
  cognitiveTier: number;
  discomfortTier: number;
  autopilotLevel: number;
}

/** Generated daily mission spec (before persistence). */
export interface GeneratedMission {
  name: string;
  xpReward: number;
  difficultyTier: number;
  estimatedDuration: number;
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
  difficultyEngine: DifficultyEngine;
  /** Global mode system: wraps existing Focus behaviour and adds War/Recovery. */
  mode: {
    current: "focus" | "war" | "recovery";
    /** ISO timestamp until which mode cannot be changed (war lock). */
    lockedUntil: string | null;
    /** Last time a mode switch occurred (ISO). */
    lastSwitch: string | null;
    /** Escalation stage for war mode (1–3). */
    warStage: 1 | 2 | 3;
    /** Optional suggestion from auto-mode/authority layer (not enforced). */
    suggested?: "war" | "recovery" | null;
    /** Optional bonus applied on next war session after good recovery. */
    nextWarBonus?: number | null;
  };
  /** System authority and behavioural patterns used for overrides and anti-cheat. */
  authority: {
    /** Chance (0–1) that the system enforces a mode for today. */
    overrideChance: number;
    /** Last date (YYYY-MM-DD) an override happened to avoid spamming. */
    lastOverrideDate: string | null;
    /** Last mode the system suggested rather than enforced. */
    lastSuggestedMode: "war" | "recovery" | null;
    patterns: {
      /** Rapidly starting/completing many trivial missions. */
      missionSpamCount: number;
      /** Overuse of very low-risk, low-XP missions. */
      easyTaskAbuseCount: number;
      /** Excessive switching between modes to evade constraints. */
      modeSwitchAbuseCount: number;
      /** Last date (YYYY-MM-DD) abuse was detected. */
      lastAbuseDate: string | null;
      /** How many war sessions have been run this week. */
      warSessionsThisWeek: number;
      /** How many recovery sessions have been run this week. */
      recoverySessionsThisWeek: number;
      /** Days without meaningful work this week. */
      idleDaysThisWeek: number;
    };
  };
  /** Short-lived global events that modify XP, stats, or mission dynamics. */
  activeEvents: {
    type: "boost" | "penalty" | "disruption";
    /** Stable identifier to allow specific behaviour per event. */
    code: string;
    /** ISO timestamp when this event expires. */
    expiresAt: string;
  }[];
  /**
   * Identity traits and constraints derived from long-term behaviour.
   * Acts as the bridge between modes and the user's self-image.
   */
  identity: {
    discipline: number; // 0–10
    resilience: number; // 0–10
    consistency: number; // 0–10
    constraints: {
      /** Once active, skipping missions without penalty is disallowed. */
      noExcusesConstraint?: boolean;
      /** Once active, at least one war session per day is expected. */
      dailyWarRequired?: boolean;
      [key: string]: boolean | undefined;
    };
  };
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
  /** normal | recovery | push | chaos | scarcity (gevaarlijke modules). */
  missionIntent?: "normal" | "recovery" | "push" | "chaos" | "scarcity" | null;
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

import type { BrainMode } from "@/lib/brain-mode";
import {
  rankUnifiedDecisionCandidates,
  type UnifiedDecisionRankingMode,
} from "@/lib/unified-decision-ranker";
import type { UnifiedDecisionMissionsSummary } from "@/lib/missions/missions-summary-for-decision";

export type { UnifiedDecisionMissionsSummary };

export type UnifiedDecisionInput = {
  dateStr: string;
  hasBrainCheckIn: boolean;
  tasksCount: number;
  /**
   * Compacte mission-signalen (zelfde bron als Missions-pipeline), geen decisionBlocks-structuur.
   * Als gezet, gebruikt de engine `todayOpenCount` i.p.v. ruwe `tasksCount` waar dat van toepassing is.
   */
  missionsSummary?: UnifiedDecisionMissionsSummary | null;
  budgetRemainingCents: number | null;
  energyRemaining: number | null;
  carryOverCount?: number | null;
  streakAtRisk?: boolean;
  suggestedTaskCapacity?: number | null;
  completedTaskCount?: number | null;
  brainMode?: BrainMode | null;
  brainState?: {
    energy: number | null;
    focus: number | null;
    sensoryLoad: number | null;
    mentalBattery?: number | null;
  };
  adaptiveSignals?: {
    /** Recent horizon (typically 7 days) */
    completionRate: number | null;
    skipDeleteRate: number | null;
    skipped: number;
    deleted: number;
    aborted: number;
    frictionHigh: boolean;
    /** Baseline horizon (typically 30 days) */
    completionRate30d?: number | null;
    skipDeleteRate30d?: number | null;
  };
  weeklyLearning?: {
    minutes: number | null;
    targetMinutes: number | null;
  } | null;
  studyPlan?: {
    dailyGoalMinutes?: number | null;
    preferredTime?: string | null;
    reminderEnabled?: boolean;
  } | null;
  accountability?: {
    enabled?: boolean;
    penaltyXPEnabled?: boolean;
    penaltyXPAmount?: number | null;
    streakFreezeTokens?: number | null;
  } | null;
  temporal?: {
    hourOfDay?: number | null;
    dayOfWeek?: number | null;
  } | null;
  settings?: {
    selectedEmotion?: string | null;
    isUsualDayOff?: boolean;
    dayOffMode?: "soft" | "hard" | null;
    pushPersonalityMode?: string | null;
    autoMasterMissions?: boolean;
  } | null;
  budgetIntelligence?: {
    monthlyTrendPct?: number | null;
    projectedEndBalanceCents?: number | null;
    daysToPayday?: number | null;
  } | null;
  behavior?: {
    disciplineLevel?: "low" | "medium" | "high";
    hasNeuroProfile?: boolean;
    confrontationMode?: "mild" | "standard" | "strong";
    weekTheme?: string | null;
    energyPattern?: "morning_low" | "stable" | "evening_crash";
    identityTargetCount?: number;
  };
};

type UnifiedDecisionCore = {
  decisionId: string;
  decisionType:
    | "check_in"
    | "budget_guardrail"
    | "streak_rescue"
    | "recovery_protocol"
    | "reduce_overload"
    | "create_mission"
    | "learning_block"
    | "light_mission"
    | "execute_next_mission";
  source:
    | "brain_mode"
    | "budget_state"
    | "mission_state"
    | "assistant_bridge"
    | "adaptive_loop"
    | "temporal_model"
    | "settings_profile";
  title: string;
  description: string;
  href: string;
  cta: string;
  surface: "dashboard" | "assistant" | "tasks" | "budget";
  confidence: "low" | "medium" | "high";
  horizon: "past" | "present" | "future" | "blended";
  reasonCodes: string[];
};

export type UnifiedDecision = UnifiedDecisionCore & {
  engineVersion: string;
  rankingMode: UnifiedDecisionRankingMode;
  modelVersion: string;
  selectedScore: number;
  candidateCount: number;
  candidateSnapshot: UnifiedDecisionCandidateSnapshot[];
  featureSnapshot: UnifiedDecisionFeatureSnapshot;
};

export type UnifiedDecisionCandidateSnapshot = {
  candidateId: string;
  decisionType: UnifiedDecision["decisionType"];
  source: UnifiedDecision["source"];
  score: number;
  confidence: UnifiedDecision["confidence"];
  horizon: UnifiedDecision["horizon"];
  reasonCodes: string[];
};

export type UnifiedDecisionFeatureSnapshot = Record<
  string,
  string | number | boolean | null
>;

const LOW_BUDGET_STRESS_CENTS = 5_000; // ~EUR 50
const LATE_DAY_HOUR = 19;
const OVERLOAD_BUFFER_TASKS = 2;
const LEARNING_BEHIND_RATIO = 0.7;
const LOW_ENERGY_EMOTIONS = new Set(["drained", "sleepy", "angry"]);
const HIGH_DRIVE_EMOTIONS = new Set(["motivated", "excited", "hyped", "evil"]);
const UNIFIED_DECISION_ENGINE_VERSION = "ude-v1-hybrid-ready";
const DEFAULT_MODEL_VERSION = "rules-v1";

type DecisionCandidate = Omit<UnifiedDecisionCore, "decisionId"> & {
  score: number;
};

function safeRate(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.max(0, Math.min(1, value));
}

function estimateConfidence(score: number): UnifiedDecision["confidence"] {
  if (score >= 85) return "high";
  if (score >= 68) return "medium";
  return "low";
}

function currentHour(input: UnifiedDecisionInput): number {
  const raw = input.temporal?.hourOfDay;
  if (raw != null && Number.isFinite(raw)) {
    return Math.max(0, Math.min(23, Math.floor(raw)));
  }
  return new Date().getHours();
}

function preferredHour(input: UnifiedDecisionInput): number | null {
  const raw = input.studyPlan?.preferredTime;
  if (!raw || !/^\d{2}:\d{2}$/.test(raw)) return null;
  const hh = Number(raw.slice(0, 2));
  if (!Number.isFinite(hh)) return null;
  return Math.max(0, Math.min(23, hh));
}

function getCompletionTrend(
  input: UnifiedDecisionInput
): "improving" | "declining" | "stable" | null {
  const recent = safeRate(input.adaptiveSignals?.completionRate ?? null);
  const baseline = safeRate(input.adaptiveSignals?.completionRate30d ?? null);
  if (recent == null || baseline == null) return null;
  const delta = recent - baseline;
  if (delta <= -0.12) return "declining";
  if (delta >= 0.12) return "improving";
  return "stable";
}

function getAvoidanceTrend(
  input: UnifiedDecisionInput
): "better" | "worse" | "stable" | null {
  const recent = safeRate(input.adaptiveSignals?.skipDeleteRate ?? null);
  const baseline = safeRate(input.adaptiveSignals?.skipDeleteRate30d ?? null);
  if (recent == null || baseline == null) return null;
  const delta = recent - baseline;
  if (delta >= 0.12) return "worse";
  if (delta <= -0.12) return "better";
  return "stable";
}

function normalizeEmotion(input: UnifiedDecisionInput): string | null {
  const raw = input.settings?.selectedEmotion;
  if (!raw) return null;
  return raw.trim().toLowerCase();
}

function buildFeatureSnapshot(input: UnifiedDecisionInput): UnifiedDecisionFeatureSnapshot {
  const ms = input.missionsSummary;
  return {
    hasBrainCheckIn: input.hasBrainCheckIn,
    tasksCount: Math.max(0, input.tasksCount),
    ...(ms
      ? {
          missionTodayOpenCount: ms.todayOpenCount,
          missionTopTaskId: ms.topTaskId,
          missionHasBacklog: ms.hasBacklog,
          missionRecommendedCount: ms.recommendedCount,
          missionOverloadRisk: ms.overloadRisk,
          missionRecoveryOnly: ms.recoveryOnly,
        }
      : {}),
    carryOverCount: Math.max(0, input.carryOverCount ?? 0),
    streakAtRisk: input.streakAtRisk === true,
    budgetRemainingCents: input.budgetRemainingCents ?? null,
    projectedEndBalanceCents:
      input.budgetIntelligence?.projectedEndBalanceCents ?? null,
    monthlyTrendPct: input.budgetIntelligence?.monthlyTrendPct ?? null,
    daysToPayday: input.budgetIntelligence?.daysToPayday ?? null,
    energyRemaining: input.energyRemaining ?? null,
    suggestedTaskCapacity: input.suggestedTaskCapacity ?? null,
    completedTaskCount: input.completedTaskCount ?? null,
    brainEnergy: input.brainState?.energy ?? null,
    brainFocus: input.brainState?.focus ?? null,
    brainSensoryLoad: input.brainState?.sensoryLoad ?? null,
    brainMentalBattery: input.brainState?.mentalBattery ?? null,
    completionRate7d: input.adaptiveSignals?.completionRate ?? null,
    skipDeleteRate7d: input.adaptiveSignals?.skipDeleteRate ?? null,
    completionRate30d: input.adaptiveSignals?.completionRate30d ?? null,
    skipDeleteRate30d: input.adaptiveSignals?.skipDeleteRate30d ?? null,
    adaptiveFrictionHigh: input.adaptiveSignals?.frictionHigh ?? false,
    weeklyLearningMinutes: input.weeklyLearning?.minutes ?? null,
    weeklyLearningTargetMinutes: input.weeklyLearning?.targetMinutes ?? null,
    studyDailyGoalMinutes: input.studyPlan?.dailyGoalMinutes ?? null,
    preferredExecutionHour: preferredHour(input),
    reminderEnabled: input.studyPlan?.reminderEnabled ?? false,
    accountabilityEnabled: input.accountability?.enabled ?? false,
    penaltyXPEnabled: input.accountability?.penaltyXPEnabled ?? false,
    penaltyXPAmount: input.accountability?.penaltyXPAmount ?? null,
    streakFreezeTokens: input.accountability?.streakFreezeTokens ?? null,
    selectedEmotion: normalizeEmotion(input),
    isUsualDayOff: input.settings?.isUsualDayOff ?? false,
    dayOffMode: input.settings?.dayOffMode ?? null,
    confrontationMode: input.behavior?.confrontationMode ?? null,
    disciplineLevel: input.behavior?.disciplineLevel ?? null,
    energyPattern: input.behavior?.energyPattern ?? null,
    hourOfDay: currentHour(input),
    dayOfWeek: input.temporal?.dayOfWeek ?? null,
  };
}

function isLowBrainCapacity(input: UnifiedDecisionInput): boolean {
  const energy = input.brainState?.energy;
  const focus = input.brainState?.focus;
  const sensoryLoad = input.brainState?.sensoryLoad;
  const lowMentalBattery =
    input.brainState?.mentalBattery != null && input.brainState.mentalBattery <= 3;
  return (
    (energy != null && energy <= 3) ||
    (focus != null && focus <= 3) ||
    (sensoryLoad != null && sensoryLoad >= 8) ||
    lowMentalBattery ||
    input.brainMode?.suggestRecovery === true
  );
}

function isAvoidancePressureHigh(input: UnifiedDecisionInput): boolean {
  if (input.adaptiveSignals?.frictionHigh) return true;
  const skipDeleteRate = input.adaptiveSignals?.skipDeleteRate ?? null;
  const avoidCount =
    (input.adaptiveSignals?.skipped ?? 0) +
    (input.adaptiveSignals?.deleted ?? 0) +
    (input.adaptiveSignals?.aborted ?? 0);
  return avoidCount >= 3 || (skipDeleteRate != null && skipDeleteRate >= 0.45);
}

function candidate(
  data: Omit<DecisionCandidate, "score" | "confidence"> & { score: number }
): DecisionCandidate {
  return {
    ...data,
    confidence: estimateConfidence(data.score),
  };
}

export function deriveUnifiedDecision(input: UnifiedDecisionInput): UnifiedDecision {
  const safeTasksCount = Math.max(0, input.tasksCount);
  const missionAlignedCount =
    input.missionsSummary != null
      ? Math.max(0, input.missionsSummary.todayOpenCount)
      : safeTasksCount;
  const baseId = `${input.dateStr}-${missionAlignedCount}-${input.hasBrainCheckIn ? "checkin" : "nocheckin"}`;
  const lowBrainCapacity = isLowBrainCapacity(input);
  const selectedEmotion = normalizeEmotion(input);
  const lowCapacityByEmotion =
    selectedEmotion != null && LOW_ENERGY_EMOTIONS.has(selectedEmotion);
  const highDriveByEmotion =
    selectedEmotion != null && HIGH_DRIVE_EMOTIONS.has(selectedEmotion);
  const effectiveLowBrainCapacity = lowBrainCapacity || lowCapacityByEmotion;
  const avoidancePressureHigh = isAvoidancePressureHigh(input);
  const budgetNegative =
    input.budgetRemainingCents != null && input.budgetRemainingCents < 0;
  const budgetUnderStressBuffer =
    input.budgetRemainingCents != null &&
    input.budgetRemainingCents <= LOW_BUDGET_STRESS_CENTS;
  const lowDiscipline = input.behavior?.disciplineLevel === "low";
  const confrontationStrong = input.behavior?.confrontationMode === "strong";
  const hardDayOff =
    input.settings?.isUsualDayOff === true && input.settings?.dayOffMode === "hard";
  const projectedEndBalanceCents =
    input.budgetIntelligence?.projectedEndBalanceCents ?? null;
  const forecastNegative =
    projectedEndBalanceCents != null && projectedEndBalanceCents < 0;
  const monthlyTrendPct = input.budgetIntelligence?.monthlyTrendPct ?? null;
  const spendingTrendRising =
    monthlyTrendPct != null && monthlyTrendPct >= 0.12;
  const daysToPayday = input.budgetIntelligence?.daysToPayday ?? null;
  const longRunwayToPayday = daysToPayday != null && daysToPayday >= 5;
  const carryOverCount = Math.max(0, input.carryOverCount ?? 0);
  const suggestedCapacity = input.suggestedTaskCapacity ?? null;
  const completedTaskCount = Math.max(0, input.completedTaskCount ?? 0);
  const hour = currentHour(input);
  const preferredExecutionHour = preferredHour(input);
  const preferredWindowMatch =
    preferredExecutionHour != null && Math.abs(hour - preferredExecutionHour) <= 2;
  const isLateDay = hour >= LATE_DAY_HOUR;
  const accountabilityEnabled = input.accountability?.enabled === true;
  const penaltyXPEnabled = input.accountability?.penaltyXPEnabled === true;
  const penaltyXPAmount = input.accountability?.penaltyXPAmount ?? null;
  const penaltyPressureHigh =
    accountabilityEnabled &&
    penaltyXPEnabled &&
    penaltyXPAmount != null &&
    penaltyXPAmount >= 75;
  const freezeTokens = input.accountability?.streakFreezeTokens ?? 0;
  const learningTargetDaily = input.studyPlan?.dailyGoalMinutes ?? null;
  const learningTargetAggressive = learningTargetDaily != null && learningTargetDaily >= 45;
  const learningRemindersEnabled = input.studyPlan?.reminderEnabled === true;
  const overloadNow =
    suggestedCapacity != null &&
    missionAlignedCount >= suggestedCapacity + OVERLOAD_BUFFER_TASKS;
  const overloadFromCarryOver = carryOverCount >= 4;
  const streakRescueState =
    input.streakAtRisk === true &&
    missionAlignedCount > 0 &&
    completedTaskCount === 0 &&
    isLateDay;
  const completionTrend = getCompletionTrend(input);
  const avoidanceTrend = getAvoidanceTrend(input);
  const performanceDrift =
    completionTrend === "declining" || avoidanceTrend === "worse";
  const learningMinutes = input.weeklyLearning?.minutes ?? null;
  const learningTarget = input.weeklyLearning?.targetMinutes ?? null;
  const learningRatio =
    learningMinutes != null &&
    learningTarget != null &&
    learningTarget > 0
      ? learningMinutes / learningTarget
      : null;
  const learningBehind =
    learningRatio != null && learningRatio < LEARNING_BEHIND_RATIO;
  const featureSnapshot = buildFeatureSnapshot({
    ...input,
    tasksCount: missionAlignedCount,
  });

  if (!input.hasBrainCheckIn) {
    const reasonCodes = ["missing_brain_checkin"];
    return {
      decisionId: `${baseId}-check_in`,
      decisionType: "check_in",
      source: "assistant_bridge",
      title: "Start met een brain check-in",
      description: "Leg eerst energie, focus en load vast zodat alle modules op dezelfde state sturen.",
      href: "/dashboard",
      cta: "Check-in now",
      surface: "dashboard",
      confidence: "high",
      horizon: "present",
      reasonCodes,
      engineVersion: UNIFIED_DECISION_ENGINE_VERSION,
      rankingMode: "rules",
      modelVersion: DEFAULT_MODEL_VERSION,
      selectedScore: 100,
      candidateCount: 1,
      candidateSnapshot: [
        {
          candidateId: "candidate-check_in",
          decisionType: "check_in",
          source: "assistant_bridge",
          score: 100,
          confidence: "high",
          horizon: "present",
          reasonCodes,
        },
      ],
      featureSnapshot,
    };
  }

  const candidates: DecisionCandidate[] = [];

  if (
    budgetNegative ||
    (budgetUnderStressBuffer && (effectiveLowBrainCapacity || lowDiscipline)) ||
    (forecastNegative && longRunwayToPayday)
  ) {
    const score = budgetNegative
      ? 97
      : forecastNegative
        ? 84 + (spendingTrendRising ? 5 : 0)
        : 80 + (effectiveLowBrainCapacity ? 5 : 0) + (lowDiscipline ? 3 : 0);
    const forecastText =
      forecastNegative && projectedEndBalanceCents != null
        ? `Forecast laat een verwacht tekort zien van ongeveer EUR ${(Math.abs(projectedEndBalanceCents) / 100).toFixed(0)} aan het einde van je cyclus.`
        : null;
    candidates.push(
      candidate({
        score,
        decisionType: "budget_guardrail",
        source: "budget_state",
        title: budgetNegative ? "Stabiliseer je budget eerst" : "Budget staat onder stress",
        description:
          budgetNegative
            ? "Je zit over je veilige uitgavenlijn. Verwerk frozen purchases of annuleer impulsen."
            : forecastText ??
              "Minder dan EUR 50 resterend, gecombineerd met lage capaciteit of lage discipline. Stabiliseer je budgetruimte eerst.",
        href: "/budget",
        cta: budgetNegative ? "Open budget guardrail" : "Open budget check",
        surface: "budget",
        horizon: "future",
        reasonCodes: budgetNegative
          ? ["budget_negative", "prevent_future_overload"]
          : forecastNegative
            ? [
                "budget_forecast_negative",
                spendingTrendRising ? "monthly_spend_rising" : "cycle_projection_risk",
              ]
            : ["budget_low_buffer", effectiveLowBrainCapacity ? "low_capacity" : "low_discipline"],
      })
    );
  }

  if (streakRescueState) {
    candidates.push(
      candidate({
        score: 86,
        decisionType: "streak_rescue",
        source: "temporal_model",
        title: "Red je streak met 1 kleine completion",
        description:
          "Het is laat en je hebt nog geen completion. Pak nu een missie met lage frictie om je ritme te behouden.",
        href: "/tasks",
        cta: "Start streak rescue",
        surface: "tasks",
        horizon: "future",
        reasonCodes: ["streak_risk", "late_day", "no_completion_today"],
      })
    );
  }

  if (preferredWindowMatch && !effectiveLowBrainCapacity && missionAlignedCount > 0) {
    candidates.push(
      candidate({
        score: 72 + (freezeTokens > 0 ? 3 : 0),
        decisionType: "execute_next_mission",
        source: "temporal_model",
        title: "Gebruik je voorkeursvenster",
        description:
          "Dit is je ingestelde focusmoment. Start nu 1 missie met hoge slagingskans zodat de rest van je dag lichter blijft.",
        href: "/tasks",
        cta: "Start in focusvenster",
        surface: "tasks",
        horizon: "present",
        reasonCodes: [
          "preferred_execution_window",
          freezeTokens > 0 ? "freeze_tokens_available" : "no_freeze_tokens",
        ],
      })
    );
  }

  if (
    (effectiveLowBrainCapacity && (avoidancePressureHigh || performanceDrift)) ||
    (penaltyPressureHigh && performanceDrift)
  ) {
    const driftLabel =
      completionTrend === "declining"
        ? "completion daalt t.o.v. je 30d-baseline"
        : avoidanceTrend === "worse"
          ? "avoidance stijgt t.o.v. je 30d-baseline"
          : "frictie ligt hoger dan normaal";
    const pressureSuffix = penaltyPressureHigh
      ? " Je accountability-penalty staat hoog, dus kies nu vooral op zekere completion."
      : "";
    candidates.push(
      candidate({
        score: 82 + (penaltyPressureHigh ? 6 : 0),
        decisionType: "recovery_protocol",
        source: "adaptive_loop",
        title: "Schakel over naar recovery-protocol",
        description: `Lage capaciteit + adaptieve signalen (${driftLabel}). Kies 1 korte missie om stress te verlagen en momentum te herstellen.${pressureSuffix}`,
        href: "/tasks",
        cta: "Open recovery flow",
        surface: "tasks",
        horizon: "blended",
        reasonCodes: [
          "low_capacity",
          lowCapacityByEmotion ? "emotion_capacity_penalty" : "brain_capacity_penalty",
          "adaptive_drift",
          "avoidance_or_decline",
          penaltyPressureHigh ? "penalty_pressure_high" : "penalty_pressure_low",
        ],
      })
    );
  }

  if (hardDayOff && !budgetNegative && missionAlignedCount > 0) {
    candidates.push(
      candidate({
        score: 76 + (effectiveLowBrainCapacity ? 6 : 0),
        decisionType: "light_mission",
        source: "settings_profile",
        title: "Respecteer je vrije-dag ritme",
        description:
          "Je instellingen staan op hard day-off mode. Houd vandaag je actie klein en onderhoudend in plaats van zwaar uitvoerend.",
        href: "/tasks",
        cta: "Open low-friction tasks",
        surface: "tasks",
        horizon: "present",
        reasonCodes: ["hard_day_off_mode", "usual_day_off", "settings_driven_pacing"],
      })
    );
  }

  if (confrontationStrong && avoidancePressureHigh && !effectiveLowBrainCapacity) {
    candidates.push(
      candidate({
        score: 74,
        decisionType: "execute_next_mission",
        source: "settings_profile",
        title: "Pak 1 confront-missie direct",
        description:
          "Je confrontatiemodus staat op strong en avoidance is verhoogd. Kies nu 1 duidelijke missie en start direct om uitstel te breken.",
        href: "/tasks",
        cta: "Open confront missions",
        surface: "tasks",
        horizon: "present",
        reasonCodes: ["confrontation_mode_strong", "avoidance_pressure", "direct_action_bias"],
      })
    );
  }

  if (overloadNow || overloadFromCarryOver) {
    const score =
      74 +
      (overloadNow ? 7 : 0) +
      (overloadFromCarryOver ? 5 : 0) +
      (performanceDrift ? 4 : 0);
    const capacityText =
      suggestedCapacity != null
        ? `Je hebt ${missionAlignedCount} open missies tegenover een capaciteit van ${suggestedCapacity}.`
        : "Je open missiebelasting loopt op ten opzichte van je recente uitvoeringsritme.";
    candidates.push(
      candidate({
        score,
        decisionType: "reduce_overload",
        source: "adaptive_loop",
        title: "Verlaag eerst je overload",
        description: `${capacityText} Herplan of snooze 1-2 taken zodat je vandaag haalbaar blijft.`,
        href: "/tasks?tab=calendar",
        cta: "Open calendar planning",
        surface: "tasks",
        horizon: "future",
        reasonCodes: [
          overloadNow ? "capacity_overload" : "carry_over_pressure",
          performanceDrift ? "performance_drift" : "stability_guard",
        ],
      })
    );
  }

  if (missionAlignedCount === 0) {
    const createMissionScore = 79 - (penaltyPressureHigh ? 8 : 0);
    candidates.push(
      candidate({
        score: createMissionScore,
        decisionType: "create_mission",
        source: "assistant_bridge",
        title: "Genereer je volgende missie",
        description:
          penaltyPressureHigh
            ? "Geen actieve missie vandaag. Zet 1 haalbare missie klaar met hoge slagingskans, zodat je penalty-risico laag blijft."
            : "Geen actieve missie vandaag. Laat assistant of missions een haalbare volgende stap bouwen.",
        href: "/assistant",
        cta: "Create mission",
        surface: "assistant",
        horizon: "present",
        reasonCodes: [
          "no_active_tasks",
          penaltyPressureHigh ? "penalty_pressure_high" : "penalty_pressure_low",
        ],
      })
    );
  }

  if (
    learningBehind &&
    !budgetNegative &&
    !effectiveLowBrainCapacity &&
    missionAlignedCount > 0
  ) {
    const shortfall =
      learningMinutes != null && learningTarget != null
        ? Math.max(0, learningTarget - learningMinutes)
        : null;
    candidates.push(
      candidate({
        score:
          66 +
          (learningTargetAggressive ? 6 : 0) +
          (learningRemindersEnabled ? 2 : 0),
        decisionType: "learning_block",
        source: "adaptive_loop",
        title: "Plan een korte growth-block",
        description:
          shortfall != null
            ? `Je zit ongeveer ${shortfall} minuten onder je weekdoel. Plan nu 20-30 minuten learning om je weeklijn te beschermen.${learningTargetAggressive ? " Je hebt een hoger persoonlijk dagdoel ingesteld, dus consistency weegt extra zwaar." : ""}`
            : `Je learning-consistentie daalt. Plan nu een korte growth-block om je weeklijn te beschermen.${learningRemindersEnabled ? " Reminder-profiel staat aan, dus dit moment past bij je ingestelde ritme." : ""}`,
        href: "/learning",
        cta: "Open growth command",
        surface: "dashboard",
        horizon: "future",
        reasonCodes: [
          "learning_behind",
          "consistency_protection",
          learningTargetAggressive ? "aggressive_learning_goal" : "standard_learning_goal",
        ],
      })
    );
  }

  if (
    (input.energyRemaining ?? 0) < 0 ||
    effectiveLowBrainCapacity ||
    avoidancePressureHigh ||
    (budgetUnderStressBuffer && lowDiscipline) ||
    hardDayOff ||
    penaltyPressureHigh
  ) {
    const pressureReason =
      avoidancePressureHigh
        ? "Je recente skip/delete patroon is hoog; pak een kleine zekere completion."
        : hardDayOff
          ? "Vandaag is ingesteld als vrije dag; kies een lichte onderhoudsmissie om ritme te bewaren zonder overload."
        : penaltyPressureHigh
          ? "Je accountability-penalty staat hoog. Kies een missie met lage frictie en hoge afrondkans."
        : budgetUnderStressBuffer
          ? "Kleine budgetbuffer kan extra stress geven; houd je missie licht en haalbaar."
          : "Je capaciteit is krap. Pak een lage-frictie missie om momentum te houden.";
    const score =
      63 +
      (effectiveLowBrainCapacity ? 8 : 0) +
      (avoidancePressureHigh ? 6 : 0) +
      ((input.energyRemaining ?? 0) < 0 ? 4 : 0) +
      (hardDayOff ? 4 : 0) +
      (penaltyPressureHigh ? 5 : 0);
    candidates.push(
      candidate({
        score,
        decisionType: "light_mission",
        source: "brain_mode",
        title: "Kies een lichte missie",
        description: pressureReason,
        href: "/tasks",
        cta: "Open light missions",
        surface: "tasks",
        horizon: "present",
        reasonCodes: [
          effectiveLowBrainCapacity ? "low_capacity" : "energy_guard",
          avoidancePressureHigh ? "avoidance_pressure" : "friction_control",
          penaltyPressureHigh ? "penalty_pressure_high" : "penalty_pressure_low",
        ],
      })
    );
  }

  candidates.push(
    candidate({
      score:
        52 +
        (completionTrend === "improving" ? 5 : 0) +
        (highDriveByEmotion ? 4 : 0),
      decisionType: "execute_next_mission",
      source: "mission_state",
      title: "Voer je volgende missie uit",
      description:
        "Je state is stabiel genoeg. Gebruik je huidige capaciteit voor de hoogste impact-taak.",
      href: "/tasks",
      cta: "Start next mission",
      surface: "tasks",
      horizon: "present",
      reasonCodes: [
        completionTrend === "improving" ? "positive_momentum" : "stable_execution",
      ],
    })
  );

  const candidatesWithIds = candidates.map((entry, index) => ({
    candidateId: `candidate-${index + 1}-${entry.decisionType}`,
    entry,
  }));
  const rankOutput = rankUnifiedDecisionCandidates({
    dateStr: input.dateStr,
    featureSnapshot,
    candidates: candidatesWithIds.map((row) => ({
      candidateId: row.candidateId,
      ruleScore: row.entry.score,
    })),
  });
  const candidateById = new Map(
    candidatesWithIds.map((row) => [row.candidateId, row.entry] as const)
  );
  const rankedCandidates = rankOutput.rankedCandidateIds
    .map((candidateId) => {
      const entry = candidateById.get(candidateId);
      if (!entry) return null;
      return { candidateId, entry };
    })
    .filter(
      (
        row
      ): row is {
        candidateId: string;
        entry: DecisionCandidate;
      } => row != null
    );
  if (rankedCandidates.length === 0) {
    rankedCandidates.push(
      ...candidatesWithIds
        .sort((a, b) => b.entry.score - a.entry.score)
        .map((row) => ({ candidateId: row.candidateId, entry: row.entry }))
    );
  }
  const selectedRow = rankedCandidates[0];
  const selected = selectedRow.entry;
  const reasonPart =
    selected.reasonCodes.length > 0
      ? selected.reasonCodes.slice(0, 3).join("_")
      : "default";
  const candidateSnapshot = rankedCandidates.slice(0, 8).map((row) => ({
    candidateId: row.candidateId,
    decisionType: row.entry.decisionType,
    source: row.entry.source,
    score: row.entry.score,
    confidence: row.entry.confidence,
    horizon: row.entry.horizon,
    reasonCodes: row.entry.reasonCodes,
  }));

  return {
    decisionId: `${baseId}-${selected.decisionType}-${reasonPart}`,
    decisionType: selected.decisionType,
    source: selected.source,
    title: selected.title,
    description: selected.description,
    href: selected.href,
    cta: selected.cta,
    surface: selected.surface,
    confidence: selected.confidence,
    horizon: selected.horizon,
    reasonCodes: selected.reasonCodes,
    engineVersion: UNIFIED_DECISION_ENGINE_VERSION,
    rankingMode: rankOutput.rankingMode,
    modelVersion: rankOutput.modelVersion,
    selectedScore: selected.score,
    candidateCount: candidatesWithIds.length,
    candidateSnapshot,
    featureSnapshot,
  };
}

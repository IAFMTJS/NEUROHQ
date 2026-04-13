/**
 * NEUROHQ Assistant – POST /api/assistant/message
 * Flow: auth → intent/signals/crisis → state → updater → escalation → mode → response assembly → log → return.
 * No AI/LLM; responses from structured behavioral engine.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyIntent } from "@/lib/assistant/intent";
import { extractSignals } from "@/lib/assistant/signals";
import { evaluateCrisis } from "@/lib/assistant/crisis";
import { updateStateFromSignals } from "@/lib/assistant/state-updater";
import { evaluateEscalation } from "@/lib/assistant/escalation-engine";
import { determineConversationMode } from "@/lib/assistant/conversation-mode";
import { assembleResponse } from "@/lib/assistant/response-assembly";
import { extractMentionedItem } from "@/lib/assistant/entity-extraction";
import {
  extractRequestedAction,
  getSuggestedActionsFromContext,
  type SuggestedAction,
} from "@/lib/assistant/action-extraction";
import { getEngineState, getAssistantFeatureFlags } from "@/app/actions/assistant/get-engine-state";
import {
  getAssistantUserContext,
  saveAssistantUserContext,
  getLastTurn,
  saveLastTurn,
} from "@/app/actions/assistant/assistant-context";
import { createTask } from "@/app/actions/tasks";
import { addManualEvent } from "@/app/actions/calendar";
import { addBudgetEntry } from "@/app/actions/budget";
import { addLearningSession } from "@/app/actions/learning";
import { processDCICMessage } from "@/lib/dcic/assistant-integration";
import { getDailyState } from "@/app/actions/daily-state";
import { getEnergyBudget } from "@/app/actions/energy";
import { getTodaysTasks } from "@/app/actions/tasks";
import {
  getBudgetSettings,
  getCurrentMonthExpensesCents,
  getMonthExpensesCents,
} from "@/app/actions/budget";
import { todayDateString } from "@/lib/utils/timezone";
import { deriveUnifiedDecision } from "@/lib/unified-decision-engine";
import { trackEvent } from "@/app/actions/analytics-events";
import { getAdaptiveDecisionSignalsLast7 } from "@/app/actions/analytics-events";
import { getBehaviorProfile } from "@/app/actions/behavior-profile";
import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyLearningTarget, getWeeklyMinutes } from "@/app/actions/learning";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getFinancialInsightsSafe } from "@/app/actions/dcic/finance-state";

const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const store: Map<string, number[]> = new Map();

function rateLimit(userId: string): boolean {
  const now = Date.now();
  let timestamps = store.get(userId) ?? [];
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT_MAX) return true;
  timestamps.push(now);
  store.set(userId, timestamps);
  return false;
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ASSISTANT_ENABLED !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: "Invalid message" },
        { status: 400 }
      );
    }

    if (rateLimit(user.id)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Check if message is DCIC mission-related
    const dcicResponse = await processDCICMessage(message);
    
    // If DCIC action, return early with simulation for confirmation
    if (dcicResponse?.isDCICAction) {
      return NextResponse.json({
        response: dcicResponse.responseText || "Actie herkend.",
        dcicAction: {
          intent: dcicResponse.intent,
          requiresConfirmation: dcicResponse.requiresConfirmation,
          simulation: dcicResponse.simulation,
          action: dcicResponse.action,
        },
        escalationTier: 1,
        identityAlert: false,
        courageFlag: false,
      });
    }

    const dateStr = todayDateString();
    const weekBounds = getWeekBounds(new Date(dateStr + "T12:00:00"));
    const dateUtc = new Date(dateStr + "T12:00:00Z");
    const currentYear = dateUtc.getUTCFullYear();
    const currentMonth = dateUtc.getUTCMonth() + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const isoDay = dateUtc.getUTCDay() === 0 ? 7 : dateUtc.getUTCDay();
    const [
      dailyStateForDecision,
      energyBudgetForDecision,
      todaysTasksForDecision,
      budgetSettingsForDecision,
      monthExpensesForDecision,
      behaviorProfileForDecision,
      userPreferencesForDecision,
      adaptiveDecisionSignals,
      adaptiveDecisionSignals30d,
      weeklyLearningMinutes,
      weeklyLearningTarget,
      financialInsights,
      monthExpenseTrend,
    ] = await Promise.all([
      getDailyState(dateStr),
      getEnergyBudget(dateStr),
      getTodaysTasks(dateStr, "normal"),
      getBudgetSettings(),
      getCurrentMonthExpensesCents(),
      getBehaviorProfile(),
      getUserPreferencesOrDefaults(),
      getAdaptiveDecisionSignalsLast7(7),
      getAdaptiveDecisionSignalsLast7(30),
      getWeeklyMinutes(weekBounds.start, weekBounds.end),
      getWeeklyLearningTarget(),
      getFinancialInsightsSafe(),
      (async () => {
        const [currentMonthExpenses, previousMonthExpenses] = await Promise.all([
          getMonthExpensesCents(currentYear, currentMonth),
          getMonthExpensesCents(prevMonthYear, prevMonth),
        ]);
        return { currentMonthExpenses, previousMonthExpenses };
      })(),
    ]);
    const monthlyTrendPct =
      monthExpenseTrend.previousMonthExpenses > 0
        ? (monthExpenseTrend.currentMonthExpenses -
            monthExpenseTrend.previousMonthExpenses) /
          monthExpenseTrend.previousMonthExpenses
        : null;
    const spendableCents = Math.max(
      0,
      (budgetSettingsForDecision.monthly_budget_cents ?? 0) - (budgetSettingsForDecision.monthly_savings_cents ?? 0)
    );
    const budgetRemainingCents =
      budgetSettingsForDecision.monthly_budget_cents != null
        ? spendableCents - monthExpensesForDecision
        : null;
    const unifiedDecision = deriveUnifiedDecision({
      dateStr,
      hasBrainCheckIn:
        dailyStateForDecision?.energy != null &&
        dailyStateForDecision?.focus != null &&
        dailyStateForDecision?.sensory_load != null,
      tasksCount: (todaysTasksForDecision.tasks ?? []).length,
      carryOverCount: todaysTasksForDecision.carryOverCount ?? 0,
      suggestedTaskCapacity: energyBudgetForDecision.suggestedTaskCount ?? null,
      completedTaskCount: energyBudgetForDecision.completedTaskCount ?? null,
      budgetRemainingCents,
      energyRemaining: energyBudgetForDecision.remaining ?? null,
      brainMode: energyBudgetForDecision.brainMode ?? null,
      brainState: {
        energy: dailyStateForDecision?.energy ?? null,
        focus: dailyStateForDecision?.focus ?? null,
        sensoryLoad: dailyStateForDecision?.sensory_load ?? null,
        mentalBattery:
          (dailyStateForDecision as { mental_battery?: number | null } | null)
            ?.mental_battery ?? null,
      },
      adaptiveSignals: {
        completionRate: adaptiveDecisionSignals.completionRate,
        skipDeleteRate: adaptiveDecisionSignals.skipDeleteRate,
        skipped: adaptiveDecisionSignals.skipped,
        deleted: adaptiveDecisionSignals.deleted,
        aborted: adaptiveDecisionSignals.aborted,
        frictionHigh: adaptiveDecisionSignals.frictionHigh,
        completionRate30d: adaptiveDecisionSignals30d.completionRate,
        skipDeleteRate30d: adaptiveDecisionSignals30d.skipDeleteRate,
      },
      weeklyLearning: {
        minutes: weeklyLearningMinutes,
        targetMinutes: weeklyLearningTarget,
      },
      temporal: {
        hourOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
      },
      settings: {
        selectedEmotion: userPreferencesForDecision.selected_emotion ?? null,
        isUsualDayOff: (userPreferencesForDecision.usual_days_off ?? []).includes(
          isoDay
        ),
        dayOffMode: userPreferencesForDecision.day_off_mode ?? null,
        pushPersonalityMode:
          userPreferencesForDecision.push_personality_mode ?? null,
        autoMasterMissions: userPreferencesForDecision.auto_master_missions,
      },
      budgetIntelligence: {
        monthlyTrendPct,
        projectedEndBalanceCents: financialInsights?.forecast?.projectedBalance ?? null,
        daysToPayday: financialInsights?.daysUntilNextIncome ?? null,
      },
      behavior: {
        disciplineLevel: behaviorProfileForDecision.disciplineLevel,
        hasNeuroProfile:
          behaviorProfileForDecision.neuroProfileTags.length > 0,
        confrontationMode: behaviorProfileForDecision.confrontationMode,
        weekTheme: behaviorProfileForDecision.weekTheme,
        energyPattern: behaviorProfileForDecision.energyPattern,
        identityTargetCount: behaviorProfileForDecision.identityTargets.length,
      },
    });

    const intent = classifyIntent(message);
    const signals = extractSignals(message);
    const crisisAssessment = evaluateCrisis(message, signals);

    const currentState = await getEngineState(user.id);
    const updatedState = updateStateFromSignals(
      currentState,
      signals,
      crisisAssessment
    );

    const escalationDecision = evaluateEscalation(updatedState);
    const conversationMode = determineConversationMode(
      updatedState,
      escalationDecision,
      crisisAssessment
    );

    await getAssistantFeatureFlags(user.id);

    const [userContext, lastTurn] = await Promise.all([
      getAssistantUserContext(user.id),
      getLastTurn(user.id),
    ]);
    const extractedItem = extractMentionedItem(message);

    let responseText = assembleResponse({
      state: updatedState,
      decision: escalationDecision,
      intent,
      conversationMode,
      crisisAssessment,
      userMessage: message,
      userContext: userContext ?? undefined,
      lastTurn: lastTurn ?? undefined,
      extractedItem: extractedItem ?? undefined,
    });

    const requestedAction = extractRequestedAction(message);
    let executedAction: string | null = null;
    let suggestedActions: SuggestedAction[] = [];

    if (requestedAction) {
      try {
        await trackEvent("decision_action", {
          decisionId: unifiedDecision.decisionId,
          decisionType: unifiedDecision.decisionType,
          surface: "assistant",
          actionType: requestedAction.type,
          decisionSource: unifiedDecision.source,
          decisionConfidence: unifiedDecision.confidence,
          decisionHorizon: unifiedDecision.horizon,
          decisionReasonCodes: unifiedDecision.reasonCodes,
          decisionEngineVersion: unifiedDecision.engineVersion,
          decisionRankingMode: unifiedDecision.rankingMode,
          decisionModelVersion: unifiedDecision.modelVersion,
          decisionCandidateCount: unifiedDecision.candidateCount,
          decisionSelectedScore: unifiedDecision.selectedScore,
          decisionCandidates: unifiedDecision.candidateSnapshot,
          decisionFeatureSnapshot: unifiedDecision.featureSnapshot,
        });
        if (requestedAction.type === "add_task") {
          await createTask({
            title: requestedAction.payload.title,
            due_date: requestedAction.payload.due_date,
          });
          executedAction = "task";
          responseText = responseText + ` Taak '${requestedAction.payload.title}' toegevoegd.`;
        } else if (requestedAction.type === "add_routine_task") {
          await createTask({
            title: requestedAction.payload.title,
            due_date: requestedAction.payload.due_date,
            recurrence_rule: requestedAction.payload.recurrence_rule,
            recurrence_weekdays: requestedAction.payload.recurrence_weekdays,
          });
          executedAction = "routine_task";
          responseText =
            responseText +
            ` Routine '${requestedAction.payload.title}' toegevoegd (${requestedAction.payload.recurrence_rule}).`;
        } else if (requestedAction.type === "add_expense") {
          await addBudgetEntry({
            amount_cents: requestedAction.payload.amount_cents,
            date: requestedAction.payload.date,
            category: requestedAction.payload.category,
            note: requestedAction.payload.note,
          });
          executedAction = "expense";
          const euro = Math.abs(requestedAction.payload.amount_cents) / 100;
          responseText = responseText + ` Uitgave van €${euro.toFixed(2)}${requestedAction.payload.category ? ` (${requestedAction.payload.category})` : ""} toegevoegd.`;
        } else if (requestedAction.type === "add_calendar") {
          await addManualEvent({
            title: requestedAction.payload.title,
            start_at: requestedAction.payload.start_at,
            end_at: requestedAction.payload.end_at,
            sync_to_google: requestedAction.payload.sync_to_google ?? false,
          });
          executedAction = "calendar";
          responseText = responseText + ` Afspraak '${requestedAction.payload.title}' in agenda gezet.`;
        } else if (requestedAction.type === "add_learning") {
          await addLearningSession({
            minutes: requestedAction.payload.minutes,
            date: requestedAction.payload.date,
            topic: requestedAction.payload.topic,
          });
          executedAction = "learning";
          const topicPart = requestedAction.payload.topic ? ` (${requestedAction.payload.topic})` : "";
          responseText = responseText + ` Leersessie${topicPart} gelogd.`;
        }
        await trackEvent("decision_outcome", {
          decisionId: unifiedDecision.decisionId,
          decisionType: unifiedDecision.decisionType,
          surface: "assistant",
          outcome: "success",
          actionType: requestedAction.type,
          decisionSource: unifiedDecision.source,
          decisionConfidence: unifiedDecision.confidence,
          decisionHorizon: unifiedDecision.horizon,
          decisionReasonCodes: unifiedDecision.reasonCodes,
          decisionEngineVersion: unifiedDecision.engineVersion,
          decisionRankingMode: unifiedDecision.rankingMode,
          decisionModelVersion: unifiedDecision.modelVersion,
          decisionCandidateCount: unifiedDecision.candidateCount,
          decisionSelectedScore: unifiedDecision.selectedScore,
          decisionCandidates: unifiedDecision.candidateSnapshot,
          decisionFeatureSnapshot: unifiedDecision.featureSnapshot,
        });
      } catch (err) {
        console.error("[assistant] Execute action failed", err);
        responseText = responseText + " Toevoegen mislukt. Probeer het opnieuw.";
        await trackEvent("decision_outcome", {
          decisionId: unifiedDecision.decisionId,
          decisionType: unifiedDecision.decisionType,
          surface: "assistant",
          outcome: "failed",
          actionType: requestedAction.type,
          decisionSource: unifiedDecision.source,
          decisionConfidence: unifiedDecision.confidence,
          decisionHorizon: unifiedDecision.horizon,
          decisionReasonCodes: unifiedDecision.reasonCodes,
          decisionEngineVersion: unifiedDecision.engineVersion,
          decisionRankingMode: unifiedDecision.rankingMode,
          decisionModelVersion: unifiedDecision.modelVersion,
          decisionCandidateCount: unifiedDecision.candidateCount,
          decisionSelectedScore: unifiedDecision.selectedScore,
          decisionCandidates: unifiedDecision.candidateSnapshot,
          decisionFeatureSnapshot: unifiedDecision.featureSnapshot,
        });
      }
    } else {
      suggestedActions = getSuggestedActionsFromContext(
        lastTurn ?? null,
        message,
        extractedItem ?? null
      );
      if (suggestedActions.length === 0 && unifiedDecision.decisionType === "create_mission") {
        suggestedActions = [{
          type: "add_task",
          label: "Maak 1 missie voor vandaag",
          payload: {
            title: "Eerste missie vandaag",
            due_date: dateStr,
          },
        }];
      }
    }

    if (extractedItem) {
      await saveAssistantUserContext(user.id, extractedItem.content, extractedItem.type);
    }
    const responseType = extractedItem
      ? extractedItem.type === "goal" || extractedItem.type === "skill"
        ? "goal_follow_up"
        : "concrete_action_follow_up"
      : String(conversationMode);
    await saveLastTurn(
      user.id,
      message,
      responseType,
      extractedItem?.content ?? lastTurn?.lastExtractedContent ?? null,
      extractedItem?.type ?? lastTurn?.lastExtractedType ?? null
    );

    if (escalationDecision.tier > 1) {
      await supabase.from("escalation_logs").insert({
        user_id: user.id,
        tier: escalationDecision.tier,
        trigger_type: escalationDecision.triggerType ?? "engine",
        evidence_snapshot: {
          avoidanceTrend: updatedState.avoidanceTrend,
          identityAlignmentScore: updatedState.identityAlignmentScore,
          energy: updatedState.energy,
          stabilityIndex: updatedState.stabilityIndex,
        },
      });
    }

    await trackEvent("decision_exposed", {
      decisionId: unifiedDecision.decisionId,
      decisionType: unifiedDecision.decisionType,
      surface: "assistant",
      conversationMode,
      decisionSource: unifiedDecision.source,
      decisionConfidence: unifiedDecision.confidence,
      decisionHorizon: unifiedDecision.horizon,
      decisionReasonCodes: unifiedDecision.reasonCodes,
      decisionEngineVersion: unifiedDecision.engineVersion,
      decisionRankingMode: unifiedDecision.rankingMode,
      decisionModelVersion: unifiedDecision.modelVersion,
      decisionCandidateCount: unifiedDecision.candidateCount,
      decisionSelectedScore: unifiedDecision.selectedScore,
      decisionCandidates: unifiedDecision.candidateSnapshot,
      decisionFeatureSnapshot: unifiedDecision.featureSnapshot,
    });

    return NextResponse.json({
      response: responseText,
      escalationTier: escalationDecision.tier,
      identityAlert: escalationDecision.identityAlert,
      courageFlag: escalationDecision.courageFlag,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      executedAction: executedAction ?? undefined,
      unifiedDecision,
      dcicAction: undefined, // Not a DCIC action
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("[assistant] Error", err.message, err.stack);
    const isDb =
      err.message.includes("relation") ||
      err.message.includes("does not exist") ||
      err.message.includes("undefined");
    return NextResponse.json(
      {
        error: isDb
          ? "Database niet klaar. Draai eerst de migratie (021_assistant_escalation_identity.sql)."
          : "Er ging iets mis. Probeer het opnieuw.",
      },
      { status: 500 }
    );
  }
}

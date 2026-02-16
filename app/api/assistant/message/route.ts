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
        if (requestedAction.type === "add_task") {
          await createTask({
            title: requestedAction.payload.title,
            due_date: requestedAction.payload.due_date,
          });
          executedAction = "task";
          responseText = responseText + ` Taak '${requestedAction.payload.title}' toegevoegd.`;
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
          responseText = responseText + ` ${requestedAction.payload.minutes} min geleerd${topicPart} gelogd.`;
        }
      } catch (err) {
        console.error("[assistant] Execute action failed", err);
        responseText = responseText + " Toevoegen mislukt. Probeer het opnieuw.";
      }
    } else {
      suggestedActions = getSuggestedActionsFromContext(
        lastTurn ?? null,
        message,
        extractedItem ?? null
      );
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

    return NextResponse.json({
      response: responseText,
      escalationTier: escalationDecision.tier,
      identityAlert: escalationDecision.identityAlert,
      courageFlag: escalationDecision.courageFlag,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      executedAction: executedAction ?? undefined,
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

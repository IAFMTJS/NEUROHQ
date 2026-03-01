/**
 * GET /api/assistant/check – Verifieert dat de behavioral engine (response assembly) werkt.
 * Geen OpenAI/API key nodig. Draait intent → signals → crisis → state → escalation → mode → assemble.
 */

import { NextResponse } from "next/server";
import { classifyIntent } from "@/lib/assistant/intent";
import { extractSignals } from "@/lib/assistant/signals";
import { evaluateCrisis } from "@/lib/assistant/crisis";
import { updateStateFromSignals } from "@/lib/assistant/state-updater";
import { evaluateEscalation } from "@/lib/assistant/escalation-engine";
import { determineConversationMode } from "@/lib/assistant/conversation-mode";
import { assembleResponse } from "@/lib/assistant/response-assembly";

const DUMMY_STATE = {
  energy: 6,
  focus: 6,
  sensoryLoad: 5,
  sleepHours: 7,
  carryOverLevel: 0.3,
  avoidanceTrend: 0.25,
  identityAlignmentScore: 65,
  stabilityIndex: 70,
  courageGapScore: 20,
  defensiveIdentityProbability: 0.2,
  daysActive: 14,
  crisis: false,
};

export async function GET() {
  try {
    const message = "Vandaag ging het wel oké, maar ik stel dingen uit.";
    const intent = classifyIntent(message);
    const signals = extractSignals(message);
    const crisisAssessment = evaluateCrisis(message, signals);
    const updatedState = updateStateFromSignals(DUMMY_STATE, signals, crisisAssessment);
    const decision = evaluateEscalation(updatedState);
    const conversationMode = determineConversationMode(
      updatedState,
      decision,
      crisisAssessment
    );
    const response = assembleResponse({
      state: updatedState,
      decision,
      intent,
      conversationMode,
      crisisAssessment,
      userMessage: message,
    });

    if (typeof response !== "string" || !response.trim()) {
      return NextResponse.json({
        ok: false,
        step: "assembly",
        message: "Response assembly gaf geen tekst terug.",
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "Behavioral engine (response assembly) werkt. Geen OpenAI of API key nodig.",
      sampleResponse: response.slice(0, 80) + (response.length > 80 ? "…" : ""),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        step: "engine",
        message: "Engine check mislukt: " + msg,
      },
      { status: 200 }
    );
  }
}

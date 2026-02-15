/**
 * NEUROHQ Assistant – signal extractor (message → signals).
 * Deterministic; no AI. See Master Plan sectie 4.2.
 */

import type { Signals } from "./types";

export function extractSignals(message: string): Signals {
  const lower = message.toLowerCase().trim();

  return {
    reportedEnergy: detectEnergy(lower),
    taskCompleted: detectCompletion(lower),
    externalBlame: detectExternalBlame(lower),
    avoidanceAdmitted: detectAvoidance(lower),
    identityDoubt: detectIdentityDoubt(lower),
  };
}

function detectEnergy(text: string): number | null {
  if (text.includes("weinig energie") || text.includes("geen energie"))
    return 3;
  if (text.includes("veel energie") || text.includes("goede energie"))
    return 8;
  if (text.includes("energie 1") || text.includes("energie 2")) return 2;
  if (text.includes("energie 4") || text.includes("energie 5")) return 5;
  if (text.includes("energie 6") || text.includes("energie 7")) return 7;
  return null;
}

function detectCompletion(text: string): boolean {
  return (
    text.includes("ik heb gedaan") ||
    text.includes("klaar") ||
    text.includes("afgewerkt") ||
    text.includes("voltooid")
  );
}

function detectExternalBlame(text: string): boolean {
  return (
    text.includes("te druk") ||
    text.includes("anderen") ||
    text.includes("geen tijd") ||
    text.includes("door anderen")
  );
}

function detectAvoidance(text: string): boolean {
  return (
    text.includes("uitgesteld") ||
    text.includes("vermeden") ||
    text.includes("niet gedaan") ||
    text.includes("overgedragen")
  );
}

function detectIdentityDoubt(text: string): boolean {
  return (
    text.includes("twijfel") ||
    text.includes("richting klopt niet") ||
    text.includes("weet niet of")
  );
}

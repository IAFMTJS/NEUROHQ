/**
 * NEUROHQ Assistant – crisis detection engine.
 * Deterministic; no AI. See Master Plan sectie 4.3.
 */

import type { CrisisAssessment } from "./types";
import type { Signals } from "./types";

function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

export function evaluateCrisis(message: string, signals: Signals): CrisisAssessment {
  const lower = message.toLowerCase().trim();
  let severity = 0;

  if (
    containsAny(lower, [
      "ik trek het niet",
      "alles is te veel",
      "ik ben kapot",
      "overweldigd",
    ])
  )
    severity += 2;

  if (signals.reportedEnergy !== null && signals.reportedEnergy <= 2)
    severity += 1;

  const active = severity >= 2;

  return { active, severity };
}

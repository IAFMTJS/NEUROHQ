/**
 * NEUROHQ Assistant – intent classifier (message → intent).
 * Deterministic; no AI. See Master Plan sectie 4.1.
 */

import type { Intent } from "./types";

function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

export function classifyIntent(message: string): Intent {
  const lower = message.toLowerCase().trim();
  if (!lower) return "status_update";

  if (
    containsAny(lower, [
      "ik trek het niet",
      "ik ben kapot",
      "overweldigd",
      "alles is te veel",
    ])
  )
    return "crisis";

  if (
    containsAny(lower, [
      "weinig energie",
      "geen tijd",
      "te druk",
      "verkeerde mindset",
    ])
  )
    return "rationalisation";

  if (
    containsAny(lower, [
      "ik twijfel",
      "ik weet dat ik mezelf",
      "misschien moet ik",
      "richting klopt niet",
    ])
  )
    return "reflection";

  if (
    containsAny(lower, ["ik heb gedaan", "afgewerkt", "klaar", "voltooid"])
  )
    return "execution_update";

  return "status_update";
}

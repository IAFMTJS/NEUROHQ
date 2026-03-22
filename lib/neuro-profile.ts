/**
 * Canonical neuro profile tags for personalization (not clinical labels in UI copy).
 * Aligned with product spec: ADHD, ADD, autism, ODD, AUDHD.
 */

export const NEURO_PROFILE_TAG_IDS = ["adhd", "add", "autism", "odd", "audhd"] as const;

export type NeuroProfileTagId = (typeof NEURO_PROFILE_TAG_IDS)[number];

export const NEURO_PROFILE_TAG_LABELS_NL: Record<NeuroProfileTagId, string> = {
  adhd: "ADHD",
  add: "ADD",
  autism: "Autisme",
  odd: "Oppositioneel (OOD)",
  audhd: "AUDHD (ADHD + autisme)",
};

/** Short explainer shown in settings — avoids medical claims. */
export const NEURO_PROFILE_SETTINGS_INTRO_NL =
  "Optioneel: kies wat op jou van toepassing is. Dit helpt de app straks beter af te stemmen op jouw ritme en triggers. Geen diagnose — alleen voor personalisatie in NEUROHQ.";

export function sanitizeNeuroProfileTags(input: string[] | null | undefined): NeuroProfileTagId[] {
  const out: NeuroProfileTagId[] = [];
  const seen = new Set<string>();
  for (const raw of input ?? []) {
    const t = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (!t || seen.has(t)) continue;
    if ((NEURO_PROFILE_TAG_IDS as readonly string[]).includes(t)) {
      seen.add(t);
      out.push(t as NeuroProfileTagId);
    }
  }
  return out;
}

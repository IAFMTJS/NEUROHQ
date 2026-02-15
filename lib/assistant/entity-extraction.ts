/**
 * NEUROHQ – Entity extraction: herkennen wat de user noemt (taak vs. doel/skill).
 * Rule-based; geen AI. Zie docs/ASSISTANT_ADVANCED_DESIGN.md.
 */

export type MentionedItemType = "task" | "goal" | "skill";

export type MentionedItem = {
  type: MentionedItemType;
  content: string;
};

function normalizeContent(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** "X leren", "leren X", "X willen leren" → goal/skill. */
function isGoalOrSkillMessage(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  if (lower.length > 70) return false;
  return (
    lower.includes(" leren") ||
    lower.endsWith(" leren") ||
    lower.startsWith("leren ") ||
    lower.includes("willen leren") ||
    lower.includes("gaan leren")
  );
}

function isUncertainty(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  const phrases = [
    "geen idee", "ik weet het niet", "weet ik niet", "geen flauw idee",
    "weet niet", "geen antwoord", "geen plan",
  ];
  return phrases.some((p) => lower.includes(p));
}

function isDeflection(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  const phrases = [
    "je moeder", "je vader", "niks", "geen zin", "boeie", "maakt niet uit", "who cares",
  ];
  if (phrases.some((p) => lower === p || lower.includes(p))) return true;
  if (lower.length <= 2 && !/^\d+$/.test(lower)) return true;
  return false;
}

function isNoGoPhrase(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  const noGo = [
    "waarom", "hoe ", "wat ", "wie ", "wanneer", "waar ", "welke",
    "ik wil niet", "geen zin", "ik kan niet", "ik heb geen",
  ];
  return noGo.some((p) => lower.startsWith(p) || lower.includes(" " + p));
}

/** Begroetingen: nooit als taak of suggestie. */
const GREETING_PHRASES = [
  "hey", "hi", "hallo", "hoi", "ha", "yo", "sup", "dag",
  "hey daar", "hallo daar", "goedemorgen", "goedemiddag", "goedenavond", "goedenacht",
  "hello", "heya", "hé", "hee",
];

function isGreeting(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  if (lower.length > 25) return false;
  return GREETING_PHRASES.some(
    (p) => lower === p || lower.startsWith(p + " ") || lower === p + "!"
  );
}

/** Korte, duidelijke taak (geen vraag, geen uncertainty/deflection). */
const TIME_ONLY_PHRASES = [
  "vanavond", "straks", "morgen", "vanmiddag", "vannacht",
  "zo meteen", "later", "vandaag", "deze week",
];

function isTimeOnlyMessage(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  if (lower.length > 20) return false;
  return TIME_ONLY_PHRASES.some(
    (w) => lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w)
  );
}

function looksLikeTask(msg: string): boolean {
  const t = msg.trim();
  if (t.length < 3 || t.length > 70) return false;
  if (t.endsWith("?")) return false;
  if (isGreeting(msg)) return false;
  if (isTimeOnlyMessage(msg)) return false;
  if (isUncertainty(msg)) return false;
  if (isDeflection(msg)) return false;
  if (isNoGoPhrase(msg)) return false;
  return true;
}

/**
 * Haalt één genoemde entiteit uit het bericht: taak of doel/skill.
 * Gebruik voor opslaan in assistant_user_context en voor templates.
 */
export function extractMentionedItem(message: string): MentionedItem | null {
  const raw = message.trim();
  if (!raw) return null;
  if (isGreeting(raw)) return null;
  if (isTimeOnlyMessage(raw)) return null;

  if (isGoalOrSkillMessage(raw)) {
    return { type: "goal", content: normalizeContent(raw) };
  }

  if (looksLikeTask(raw)) {
    return { type: "task", content: normalizeContent(raw) };
  }

  return null;
}

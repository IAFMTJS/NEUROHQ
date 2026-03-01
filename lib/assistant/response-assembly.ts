/**
 * NEUROHQ – Structured behavioral engine (response assembly).
 * Assembles responses from rules and intervention pools. No AI/LLM.
 * See Master Plan: conversation modes, 200-intervention style.
 */

import type { EngineState } from "./types";
import type { EscalationDecision } from "./types";
import type { Intent } from "./types";
import type { ConversationMode } from "./types";
import type { CrisisAssessment } from "./types";
import { classifySentiment } from "./sentiment";

const DIAGNOSTIC = [
  "Wat is er concreet gebeurd?",
  "Wat heb je vermeden?",
  "Wat laat de data zien?",
  "Wat is de kleinste mogelijke actie?",
  "Waar begon de weerstand?",
];

const STRATEGIC = [
  "Wat is de kleinste uitvoerbare stap?",
  "Wat past bij je focus deze periode?",
  "Wat is je volgende zichtbare actie?",
  "Wat vermindert wrijving?",
];

/** Wanneer de gebruiker geen idee heeft: concreet, kleine stap, geen herhaling. */
const UNCERTAINTY_FOLLOW_UP = [
  "Wat is de kleinste uitvoerbare stap?",
  "Welke éne taak zou nu het meeste verschil maken?",
  "Wat staat er concreet op je lijst voor vandaag?",
  "Wat laat je agenda of takenlijst nu zien?",
  "Kies één ding dat binnen 30 min kan. Wat zou dat zijn?",
];

const REFLECTIVE = [
  "Waarom koos je deze richting?",
  "Wat voelt aligned?",
  "Wat zou moed hier zijn?",
  "Wat is de eerlijke reden?",
];

const PRESSURE_STATEMENTS = [
  "De data laat een patroon zien.",
  "Je energie was voldoende; het patroon wijst op prioritering.",
  "Dit patroon herhaalt zich.",
];

const STABILISATION = [
  "Vandaag: focus op stabiliteit.",
  "Wat past binnen je energie vandaag?",
  "Wat is genoeg voor vandaag?",
  "Eén kleine stap is genoeg.",
];

/** Zachte varianten (energy < 5). */
const STABILISATION_SOFT = [
  "Vandaag even rustig aan.",
  "Wat past er vandaag wél bij je energie?",
  "Eén klein ding is genoeg.",
];
const STRATEGIC_SOFT = [
  "Wat zou vandaag één kleine stap kunnen zijn?",
  "Wat past nu bij je focus?",
  "Welke éne actie voelt haalbaar?",
];
const DIAGNOSTIC_SOFT = [
  "Wat is er gebeurd?",
  "Wat heb je gedaan of uitgesteld?",
  "Wat is de kleinste stap die je nu zou zetten?",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(Math.abs(seed) % arr.length)] ?? arr[0];
}

function seedFromState(state: EngineState): number {
  return (
    state.energy * 7 +
    state.avoidanceTrend * 100 +
    state.identityAlignmentScore +
    state.daysActive
  );
}

/** Seed ook op bericht zodat verschillende antwoorden andere vragen geven. */
function seedFromMessage(msg: string): number {
  let h = 0;
  const s = msg.trim().toLowerCase();
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function isUncertaintyMessage(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  if (lower.length > 50) return false;
  const phrases = [
    "geen idee",
    "ik weet het niet",
    "weet ik niet",
    "geen flauw idee",
    "weet niet",
    "geen antwoord",
    "geen plan",
  ];
  return phrases.some((p) => lower.includes(p));
}

/** Begroetingen: geen taak, geen "zet op de lijst". */
function isGreetingMessage(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  if (lower.length > 25) return false;
  const greetings = [
    "hey", "hi", "hallo", "hoi", "ha", "yo", "sup", "dag",
    "hey daar", "hallo daar", "goedemorgen", "goedemiddag", "goedenavond", "goedenacht",
    "hello", "heya", "hé", "hee",
  ];
  return greetings.some((p) => lower === p || lower.startsWith(p + " ") || lower === p + "!");
}

/** Korte, duidelijke taak/actie als antwoord (bv. "Eten maken") → daarop doorbouwen. */
function isConcreteAction(msg: string): boolean {
  const t = msg.trim();
  if (t.length < 3 || t.length > 70) return false;
  if (t.endsWith("?")) return false;
  const lower = t.toLowerCase();
  if (isGreetingMessage(msg)) return false;
  if (isUncertaintyMessage(msg)) return false;
  if (isDeflectionMessage(msg)) return false;
  const noGo = [
    "waarom", "hoe ", "wat ", "wie ", "wanneer", "waar ", "welke",
    "ik wil niet", "geen zin", "ik kan niet", "ik heb geen",
  ];
  if (noGo.some((p) => lower.startsWith(p) || lower.includes(" " + p))) return false;
  return true;
}

/** Deflectie / grap / "niet serieus" → rustig omleiden. (Geen "geen idee" hier: dat is uncertainty.) */
function isDeflectionMessage(msg: string): boolean {
  const lower = msg.trim().toLowerCase();
  const phrases = [
    "je moeder", "je vader", "niks", "geen zin", "boeie", "maakt niet uit",
    "who cares",
  ];
  if (phrases.some((p) => lower === p || lower.includes(p))) return true;
  if (lower.length <= 2 && !/^\d+$/.test(lower)) return true;
  return false;
}

const CONCRETE_ACTION_FOLLOW_UP = [
  "Wanneer ga je dat doen?",
  "Zet dat als eerste op je lijst.",
  "Helder. Dat als eerste stap.",
  "Goed. Wat is het volgende na dat?",
];

/** Doel/skill (bv. japans leren): andere follow-up dan taak. */
const GOAL_FOLLOW_UP = [
  "Wat is de kleinste stap om vandaag te beginnen?",
  "Hoe ga je vandaag een stukje verder komen?",
  "Zet één korte sessie in je agenda. Wanneer?",
];

/** Korte tijdwoorden: user geeft moment voor de laatste task. */
function isTimeForLastTask(
  msg: string,
  lastTurn: LastTurnInput | null | undefined
): boolean {
  if (!lastTurn?.lastExtractedContent || lastTurn.lastExtractedType !== "task")
    return false;
  const lower = msg.trim().toLowerCase();
  if (lower.length > 25) return false;
  const timeWords = [
    "vanavond", "straks", "morgen", "vanmiddag", "vannacht",
    "zo meteen", "zo", "later", "vandaag", "deze week",
  ];
  return timeWords.some((w) => lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w));
}

function pickTimeWord(msg: string): string {
  const lower = msg.trim().toLowerCase();
  if (lower.includes("vanavond")) return "vanavond";
  if (lower.includes("morgen")) return "morgen";
  if (lower.includes("vanmiddag")) return "vanmiddag";
  if (lower.includes("straks") || lower.includes("zo meteen")) return "straks";
  if (lower.includes("vandaag")) return "vandaag";
  if (lower.includes("deze week")) return "deze week";
  return "dan";
}

/** Negatief: frustratie, schelden, deflectie → rustig aanspreken, niet escaleren. */
const NEGATIVE_RESPONSES = [
  "Geen probleem. Wat staat er concreet op je lijst vandaag?",
  "Oké. Als je wilt kunnen we het hebben over één kleine stap.",
  "Geen druk. Wat zou je wél willen doen vandaag?",
  "Snap het. Wat staat er op je takenlijst of in je agenda?",
  "Rustig. Wat is de kleinste stap die je nu zou zetten?",
  "Geen oordeel. Wat heeft nu prioriteit?",
];

/** Positief: gelukt, goed, fijn → bevestigen en doorvragen. */
const POSITIVE_RESPONSES = [
  "Mooi. Wat is de volgende stap?",
  "Goed bezig. Wat wil je als volgende doen?",
  "Helder. Wat heeft nu prioriteit?",
  "Lekker. Wat zet je daarna op de lijst?",
  "Top. Wat is je volgende zichtbare actie?",
  "Fijn. Wat past bij je focus nu?",
];

export type UserContextInput = {
  recentGoals: string[];
  recentTasks: string[];
};

export type LastTurnInput = {
  lastUserMessage: string | null;
  lastResponseType: string | null;
  lastExtractedContent: string | null;
  lastExtractedType: string | null;
};

export type ExtractedItemInput = {
  type: "task" | "goal" | "skill";
  content: string;
};

export type AssembleInput = {
  state: EngineState;
  decision: EscalationDecision;
  intent: Intent;
  conversationMode: ConversationMode;
  crisisAssessment: CrisisAssessment;
  userMessage: string;
  userContext?: UserContextInput | null;
  lastTurn?: LastTurnInput | null;
  extractedItem?: ExtractedItemInput | null;
};

/**
 * Assembles a 1–2 sentence response from mode, tier, state and intervention pools.
 * Deterministic: same inputs → same response.
 */
export function assembleResponse(input: AssembleInput): string {
  const {
    state,
    decision,
    conversationMode,
    crisisAssessment,
    userMessage,
    userContext,
    lastTurn,
    extractedItem,
  } = input;
  const seed =
    seedFromState(state) + seedFromMessage(userMessage || "");
  const avoidancePct = Math.round(state.avoidanceTrend * 100);
  const uncertain = isUncertaintyMessage(userMessage || "");
  const concreteAction = isConcreteAction(userMessage || "");
  const softTone = state.energy < 5;
  const sentiment = classifySentiment(userMessage || "");

  if (crisisAssessment.active || state.energy <= 3) {
    const pool = softTone ? STABILISATION_SOFT : STABILISATION;
    const line = pick(pool, seed);
    return `Energie ${state.energy}/10. ${line}`;
  }

  if (conversationMode === "stabilisation") {
    const pool = softTone ? STABILISATION_SOFT : STABILISATION;
    const line = pick(pool, seed + 1);
    return `Energie ${state.energy}/10. ${line}`;
  }

  if (lastTurn && isTimeForLastTask(userMessage || "", lastTurn)) {
    const task = lastTurn.lastExtractedContent!;
    const cap = task.charAt(0).toUpperCase() + task.slice(1);
    const time = pickTimeWord(userMessage || "");
    return `${cap} ${time}. Zet het in je agenda.`;
  }

  if (sentiment === "negative") {
    const line = pick(NEGATIVE_RESPONSES, seed);
    return line;
  }

  if (sentiment === "positive") {
    const line = pick(POSITIVE_RESPONSES, seed);
    return line;
  }

  if (concreteAction) {
    const raw = (userMessage || "").trim();
    const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
    const isGoal = extractedItem?.type === "goal" || extractedItem?.type === "skill";
    const followPool = isGoal ? GOAL_FOLLOW_UP : CONCRETE_ACTION_FOLLOW_UP;
    const follow = pick(followPool, seed);
    return `${cap}. ${follow}`;
  }

  if (conversationMode === "pressure" && decision.tier >= 2) {
    const statement = pick(PRESSURE_STATEMENTS, seed);
    const evidence = `Energie ${state.energy}/10, avoidance ${avoidancePct}%, IAS ${state.identityAlignmentScore}.`;
    const question = pick(DIAGNOSTIC, seed + 2);
    return `${statement} ${evidence} ${question}`;
  }

  if (conversationMode === "reflective") {
    const q = pick(REFLECTIVE, seed);
    return `Identity alignment ${state.identityAlignmentScore}. ${q}`;
  }

  if (conversationMode === "strategic") {
    const pool = uncertain ? UNCERTAINTY_FOLLOW_UP : (softTone ? STRATEGIC_SOFT : STRATEGIC);
    const recentGoal = userContext?.recentGoals?.[0];
    if (recentGoal && !uncertain && seed % 3 === 0) {
      return `Energie ${state.energy}/10. Hoe ga je vandaag met ${recentGoal} verder?`;
    }
    const q = pick(pool, seed);
    return `Energie ${state.energy}/10, focus ${state.focus}/10. ${q}`;
  }

  if (conversationMode === "diagnostic") {
    const pool = softTone ? DIAGNOSTIC_SOFT : DIAGNOSTIC;
    const q = pick(pool, seed);
    return `Energie ${state.energy}/10, avoidance ${avoidancePct}%. ${q}`;
  }

  const pool = softTone ? DIAGNOSTIC_SOFT : DIAGNOSTIC;
  const q = pick(pool, seed);
  return `Energie ${state.energy}/10. ${q}`;
}

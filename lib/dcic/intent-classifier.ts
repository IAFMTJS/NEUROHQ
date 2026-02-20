/**
 * Dark Commander Intelligence Core - Intent Classifier
 * Detects mission-related intents from user messages
 * Works alongside existing assistant intent classifier
 */

import type { Intent } from "./types";

/**
 * Classifies intent for mission-related actions
 * Returns DCIC intent or null if not mission-related
 */
export function classifyDCICIntent(message: string): Intent | null {
  const lower = message.toLowerCase().trim();
  if (!lower) return null;

  // Start mission patterns
  if (matchesStartPattern(lower)) {
    return "start_mission";
  }

  // Complete mission patterns
  if (matchesCompletePattern(lower)) {
    return "complete_mission";
  }

  // Planning patterns
  if (matchesPlanningPattern(lower)) {
    return "create_calendar_event";
  }

  // Status queries
  if (matchesStatusPattern(lower)) {
    return "ask_status";
  }

  // Resistance patterns
  if (matchesResistancePattern(lower)) {
    return "resistance";
  }

  return null;
}

/**
 * Checks if message matches start mission patterns
 */
function matchesStartPattern(text: string): boolean {
  const startPhrases = [
    "ik start",
    "ik begin",
    "start missie",
    "begin missie",
    "ik ga starten",
    "we beginnen",
    "tijd om te starten",
    "activeer missie",
    "run deep work",
    "pak missie",
    "doe missie",
    "focus sessie",
    "start nu",
    "meteen beginnen",
  ];

  return startPhrases.some((phrase) => text.includes(phrase));
}

/**
 * Checks if message matches complete mission patterns
 */
function matchesCompletePattern(text: string): boolean {
  const completePhrases = [
    "ik ben klaar",
    "missie afgerond",
    "het zit erop",
    "done",
    "ik heb het gedaan",
    "voltooid",
    "afgerond",
    "klaar met missie",
    "missie klaar",
  ];

  return completePhrases.some((phrase) => text.includes(phrase));
}

/**
 * Checks if message matches planning patterns
 */
function matchesPlanningPattern(text: string): boolean {
  const planningPhrases = [
    "plan morgen",
    "zet morgen",
    "boek morgen",
    "plan vandaag",
    "zet vandaag",
    "plan om",
    "zet om",
    "plan focus",
    "plan deep work",
  ];

  const hasPlanningVerb = planningPhrases.some((phrase) => text.includes(phrase));
  const hasTimeReference = /morgen|vandaag|overmorgen|om \d|om \d{2}:\d{2}/.test(text);

  return hasPlanningVerb || (hasTimeReference && text.includes("plan"));
}

/**
 * Checks if message matches status query patterns
 */
function matchesStatusPattern(text: string): boolean {
  const statusPhrases = [
    "hoeveel xp",
    "wat is mijn level",
    "hoeveel dagen streak",
    "hoeveel energie",
    "wat is mijn rank",
    "check mijn xp",
    "check mijn level",
    "check mijn streak",
  ];

  return statusPhrases.some((phrase) => text.includes(phrase));
}

/**
 * Checks if message matches resistance patterns
 */
function matchesResistancePattern(text: string): boolean {
  const resistancePhrases = [
    "geen zin",
    "later",
    "ik stel uit",
    "skip vandaag",
    "ik start niet",
    "ik wil niet starten",
    "niet beginnen",
    "ik ga niet starten",
    "laat maar",
  ];

  return resistancePhrases.some((phrase) => text.includes(phrase));
}

/**
 * Extracts mission ID from message (if mentioned)
 * Returns null if not found
 */
export async function extractMissionId(message: string): Promise<string | null> {
  // Try to extract mission name from message
  const missionNameMatch = message.match(/(?:missie|mission|taak|task)\s+["']?([^"']+)["']?/i);
  if (missionNameMatch) {
    const missionName = missionNameMatch[1].trim();
    
    // Try to find mission by name
    const { getMissions } = await import("@/app/actions/dcic/mission-management");
    const missions = await getMissions();
    const matchingMission = missions.find(
      (m) => m.name.toLowerCase().includes(missionName.toLowerCase()) ||
             missionName.toLowerCase().includes(m.name.toLowerCase())
    );
    
    if (matchingMission) {
      return matchingMission.id;
    }
  }
  
  // Try UUID pattern
  const uuidMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) {
    return uuidMatch[0];
  }
  
  return null;
}

/**
 * Extracts time/date from message
 */
export function extractTimeReference(message: string): {
  date?: string;
  time?: string;
} {
  const lower = message.toLowerCase();
  const result: { date?: string; time?: string } = {};

  // Date extraction
  if (lower.includes("morgen")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    result.date = tomorrow.toISOString().split("T")[0];
  } else if (lower.includes("vandaag")) {
    result.date = new Date().toISOString().split("T")[0];
  } else if (lower.includes("overmorgen")) {
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    result.date = dayAfter.toISOString().split("T")[0];
  }

  // Time extraction
  const timeMatch = lower.match(/om (\d{1,2})(?:u|:(\d{2}))?/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    result.time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  return result;
}

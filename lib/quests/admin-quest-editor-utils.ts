import type { Json } from "@/types/database.types";
import type { QuestCampaignContent, QuestDayDef, QuestDayKind, QuestDayStep } from "@/lib/quests/types";
import { parseQuestContent } from "@/lib/quests/types";
import { getDefaultKatsuoQuestContent } from "@/lib/quests/default-katsuo-content";

export function contentToFormattedJson(content: QuestCampaignContent): string {
  return JSON.stringify(content, null, 2);
}

export function parseJsonToContent(raw: string): { ok: true; data: QuestCampaignContent } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Ongeldige JSON-syntax." };
  }
  const data = parseQuestContent(parsed as Json);
  if (!data) return { ok: false, error: "JSON voldoet niet aan het quest-schema (version + days met day/headline/kind)." };
  return { ok: true, data };
}

export function getDefaultContentForEditor(): QuestCampaignContent {
  return getDefaultKatsuoQuestContent();
}

export function emptyCampaignContent(): QuestCampaignContent {
  return { version: 1, storyEpigraph: "", days: [] };
}

const KINDS: QuestDayKind[] = ["paintings", "riddle", "multi", "coords"];

export function createEmptyDay(day: number, kind: QuestDayKind = "riddle"): QuestDayDef {
  const base = { day, headline: `Dag ${day}`, kind };
  if (kind === "paintings") {
    return {
      ...base,
      kind: "paintings",
      intro: "",
      storyLine: "",
      paintings: [{ title: "", letter: "", caption: "" }],
      accepts: [""],
      unlockMessage: "",
      unlockWord: "",
    };
  }
  if (kind === "riddle") {
    return {
      ...base,
      kind: "riddle",
      riddle: "",
      accepts: [""],
      unlockMessage: "",
      unlockWord: "",
    };
  }
  if (kind === "multi") {
    return {
      ...base,
      kind: "multi",
      intro: "",
      steps: [{ riddle: "", accepts: [""] }],
      unlockMessage: "",
      unlockWord: "",
    };
  }
  return {
    ...base,
    kind: "coords",
    riddle: "",
    acceptCoords: { lat: 0, lng: 0, epsilon: 0.01 },
    unlockMessage: "",
    unlockWord: "",
  };
}

export function nextDayNumber(days: QuestDayDef[]): number {
  if (days.length === 0) return 1;
  return Math.max(...days.map((d) => d.day), 0) + 1;
}

export function acceptsFromTextarea(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function acceptsToTextarea(accepts: string[] | undefined): string {
  return (accepts ?? []).join("\n");
}

export function validateContentForSave(c: QuestCampaignContent): string | null {
  if (typeof c.version !== "number") return "Versie ontbreekt.";
  if (!Array.isArray(c.days) || c.days.length === 0) return "Minstens één dag nodig.";
  const nums = c.days.map((d) => d.day);
  const uniq = new Set(nums);
  if (uniq.size !== nums.length) return "Dagnummers moeten uniek zijn.";
  for (const d of c.days) {
    if (!d.headline?.trim()) return `Dag ${d.day}: koptekst is leeg.`;
    if (!KINDS.includes(d.kind)) return `Dag ${d.day}: ongeldig type.`;
    if (d.kind === "paintings") {
      if (!d.paintings?.length) return `Dag ${d.day}: minstens één schilderij.`;
      for (const p of d.paintings) {
        if (!p.title?.trim() || !p.letter?.trim()) return `Dag ${d.day}: elk schilderij heeft titel + letter nodig.`;
      }
      if (!d.accepts?.some((a) => a.trim())) return `Dag ${d.day}: minstens één geaccepteerd antwoord.`;
    } else if (d.kind === "riddle") {
      if (!d.riddle?.trim()) return `Dag ${d.day}: raadseltekst is leeg.`;
      if (!d.accepts?.some((a) => a.trim())) return `Dag ${d.day}: minstens één geaccepteerd antwoord.`;
    } else if (d.kind === "multi") {
      if (!d.steps?.length) return `Dag ${d.day}: minstens één stap.`;
      for (let i = 0; i < d.steps.length; i++) {
        const s = d.steps[i];
        if (!s.riddle?.trim()) return `Dag ${d.day}, stap ${i + 1}: raadsel leeg.`;
        if (!s.accepts?.some((a) => a.trim())) return `Dag ${d.day}, stap ${i + 1}: minstens één antwoord.`;
      }
    } else if (d.kind === "coords") {
      if (!d.riddle?.trim()) return `Dag ${d.day}: toelichting/coördinaten-tekst is leeg.`;
      const ac = d.acceptCoords;
      if (!ac || typeof ac.lat !== "number" || typeof ac.lng !== "number" || typeof ac.epsilon !== "number") {
        return `Dag ${d.day}: breedtegraad, lengtegraad en tolerantie (epsilon) zijn verplicht.`;
      }
    }
  }
  return null;
}

export type { QuestCampaignContent, QuestDayDef, QuestDayKind, QuestDayStep };

import type { Json } from "@/types/database.types";

export type QuestDayKind = "paintings" | "riddle" | "multi" | "coords";

export type QuestDayStep = {
  riddle: string;
  accepts: string[];
};

export type QuestDayDef = {
  day: number;
  headline: string;
  kind: QuestDayKind;
  intro?: string;
  storyLine?: string;
  paintings?: { title: string; letter: string; caption?: string }[];
  riddle?: string;
  steps?: QuestDayStep[];
  accepts?: string[];
  acceptCoords?: { lat: number; lng: number; epsilon: number };
  unlockMessage?: string;
  unlockWord?: string;
};

export type QuestCampaignContent = {
  version: number;
  storyEpigraph?: string;
  days: QuestDayDef[];
};

export type QuestProgressState = {
  solvedDays: number[];
  /** Multi-step days: day number → current step index (0-based). */
  sub?: Record<string, number>;
};

export function parseQuestProgressState(raw: Json | null | undefined): QuestProgressState {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { solvedDays: [] };
  }
  const o = raw as Record<string, unknown>;
  const solvedRaw = o.solvedDays;
  const solvedDays = Array.isArray(solvedRaw)
    ? solvedRaw.filter((x): x is number => typeof x === "number" && x >= 1 && x <= 99)
    : [];
  const subRaw = o.sub;
  const sub: Record<string, number> = {};
  if (subRaw && typeof subRaw === "object" && !Array.isArray(subRaw)) {
    for (const [k, v] of Object.entries(subRaw as Record<string, unknown>)) {
      if (typeof v === "number" && v >= 0) sub[k] = v;
    }
  }
  return { solvedDays: [...new Set(solvedDays)].sort((a, b) => a - b), sub: Object.keys(sub).length ? sub : undefined };
}

export function toJsonState(s: QuestProgressState): Json {
  return {
    solvedDays: s.solvedDays,
    ...(s.sub && Object.keys(s.sub).length > 0 ? { sub: s.sub } : {}),
  } as Json;
}

export function parseQuestContent(raw: Json | null | undefined): QuestCampaignContent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const version = o.version;
  const days = o.days;
  if (typeof version !== "number" || !Array.isArray(days)) return null;
  const parsedDays: QuestDayDef[] = [];
  for (const d of days) {
    if (!d || typeof d !== "object" || Array.isArray(d)) continue;
    const day = d as Record<string, unknown>;
    const dayNum = day.day;
    const headline = day.headline;
    const kind = day.kind;
    if (typeof dayNum !== "number" || typeof headline !== "string" || typeof kind !== "string") continue;
    if (!["paintings", "riddle", "multi", "coords"].includes(kind)) continue;
    parsedDays.push(day as unknown as QuestDayDef);
  }
  if (parsedDays.length === 0) return null;
  return { version, storyEpigraph: typeof o.storyEpigraph === "string" ? o.storyEpigraph : undefined, days: parsedDays };
}

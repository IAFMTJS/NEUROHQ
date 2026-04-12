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
  /** `letter` = auteursnotitie (validatie loopt via `accepts`); niet tonen in UI. `imageUrl` = pad `/quests/...` of absolute URL. */
  paintings?: { title: string; letter: string; caption?: string; imageUrl?: string }[];
  riddle?: string;
  steps?: QuestDayStep[];
  accepts?: string[];
  acceptCoords?: { lat: number; lng: number; epsilon: number };
  unlockMessage?: string;
  unlockWord?: string;
};

export type QuestFinaleChoiceOption = {
  label: string;
  /** XP bij deze keuze (spec: geen bedrag tonen in UI). */
  xp: number;
  /** Gevolgen / epiloog na de keuze. */
  epilogue: string;
};

/** Na alle puzzels: morele keuze + tak-specifieke epiloog (optioneel). */
export type QuestFinaleChoiceBlock = {
  /** Tekst vóór de keuzeknoppen. */
  intro: string;
  help: QuestFinaleChoiceOption;
  stop: QuestFinaleChoiceOption;
  /** Gedeelde slotregels (bijv. “De realiteit”, “Laatste gedachte”). */
  closingThought?: string;
};

export type QuestCampaignContent = {
  version: number;
  storyEpigraph?: string;
  days: QuestDayDef[];
  finaleChoice?: QuestFinaleChoiceBlock;
};

export type QuestProgressState = {
  solvedDays: number[];
  /** Multi-step days: day number → current step index (0-based). */
  sub?: Record<string, number>;
  /** Gezet zodra de speler HELPEN of STOPPEN kiest (alleen bij quests met `finaleChoice`). */
  finaleChoice?: "help" | "stop";
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
  const fcRaw = o.finaleChoice;
  const finaleChoice =
    fcRaw === "help" || fcRaw === "stop" ? (fcRaw as "help" | "stop") : undefined;
  return {
    solvedDays: [...new Set(solvedDays)].sort((a, b) => a - b),
    sub: Object.keys(sub).length ? sub : undefined,
    ...(finaleChoice ? { finaleChoice } : {}),
  };
}

export function toJsonState(s: QuestProgressState): Json {
  return {
    solvedDays: s.solvedDays,
    ...(s.sub && Object.keys(s.sub).length > 0 ? { sub: s.sub } : {}),
    ...(s.finaleChoice === "help" || s.finaleChoice === "stop" ? { finaleChoice: s.finaleChoice } : {}),
  } as Json;
}

function parseQuestFinaleChoiceBlock(raw: unknown): QuestFinaleChoiceBlock | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const intro = o.intro;
  const help = o.help;
  const stop = o.stop;
  if (typeof intro !== "string" || !intro.trim()) return undefined;
  if (!help || typeof help !== "object" || Array.isArray(help)) return undefined;
  if (!stop || typeof stop !== "object" || Array.isArray(stop)) return undefined;
  const h = help as Record<string, unknown>;
  const s = stop as Record<string, unknown>;
  const hl = h.label;
  const sl = s.label;
  const hx = h.xp;
  const sx = s.xp;
  const he = h.epilogue;
  const se = s.epilogue;
  if (typeof hl !== "string" || !hl.trim()) return undefined;
  if (typeof sl !== "string" || !sl.trim()) return undefined;
  if (typeof hx !== "number" || !Number.isFinite(hx) || hx < 0) return undefined;
  if (typeof sx !== "number" || !Number.isFinite(sx) || sx < 0) return undefined;
  if (typeof he !== "string") return undefined;
  if (typeof se !== "string") return undefined;
  const closingThought = o.closingThought;
  return {
    intro: intro.trim(),
    help: { label: hl.trim(), xp: Math.round(hx), epilogue: he },
    stop: { label: sl.trim(), xp: Math.round(sx), epilogue: se },
    ...(typeof closingThought === "string" && closingThought.trim()
      ? { closingThought: closingThought.trim() }
      : {}),
  };
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
  const finaleChoice = parseQuestFinaleChoiceBlock(o.finaleChoice);
  return {
    version,
    storyEpigraph: typeof o.storyEpigraph === "string" ? o.storyEpigraph : undefined,
    days: parsedDays,
    ...(finaleChoice ? { finaleChoice } : {}),
  };
}

export function hasQuestFinaleChoice(content: QuestCampaignContent): boolean {
  return content.finaleChoice != null;
}

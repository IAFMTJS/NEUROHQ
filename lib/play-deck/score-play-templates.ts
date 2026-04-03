import type { PlayProfileDocument, PlayChallengeAppetite } from "@/types/play-profile.types";
import type { PlayDeckTemplate } from "./types";
import { PLAY_DECK_TEMPLATES } from "./builtin-templates";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function textBlob(doc: PlayProfileDocument): string {
  const d = doc.data;
  const parts = [
    typeof d.about_you === "string" ? d.about_you : "",
    typeof d.daily_life === "string" ? d.daily_life : "",
    typeof d.favorites === "string" ? d.favorites : "",
  ];
  return norm(parts.join(" \n "));
}

function userTagSet(doc: PlayProfileDocument): Set<string> {
  const set = new Set<string>();
  const d = doc.data;
  const styles = Array.isArray(d.fun_styles) ? d.fun_styles : [];
  for (const s of styles) {
    if (typeof s === "string" && s.trim()) set.add(norm(s).replace(/\s+/g, "_"));
  }
  const er = typeof d.energy_recharge === "string" ? d.energy_recharge : "";
  if (er) set.add(er);
  const gs = typeof d.grocery_shop_style === "string" ? d.grocery_shop_style : "";
  if (gs === "big_rare" || gs === "small_often" || gs === "mixed") set.add("shopping");
  const blob = textBlob(doc);
  const keywords: [string, string][] = [
    ["hond", "pets"],
    ["kat", "pets"],
    ["huisdier", "pets"],
    ["tuin", "nature"],
    ["bos", "nature"],
    ["wandelen", "outdoors"],
    ["fiets", "outdoors"],
    ["zwem", "sports"],
    ["yoga", "chill"],
    ["meditat", "quiet"],
    ["lezen", "reading"],
    ["boek", "reading"],
    ["puzzel", "puzzles"],
    ["brei", "crafting"],
    ["haak", "crafting"],
    ["teken", "creative"],
    ["schilder", "creative"],
    ["gitaar", "music"],
    ["piano", "music"],
    ["spotify", "music"],
    ["game", "games"],
    ["switch", "games"],
    ["steam", "games"],
    ["kook", "cooking"],
    ["bak", "cooking"],
    ["boodschap", "shopping"],
    ["supermarkt", "shopping"],
    ["lidl", "shopping"],
    ["albert", "shopping"],
    ["vriend", "social_light"],
    ["familie", "social_light"],
    ["film", "film"],
    ["serie", "film"],
    ["netflix", "film"],
    ["boardgame", "games"],
    ["strijd", "competitive"],
    ["sport", "sports"],
  ];
  for (const [needle, tag] of keywords) {
    if (blob.includes(needle)) set.add(tag);
  }
  return set;
}

function avoidList(doc: PlayProfileDocument): string[] {
  const raw = doc.data.avoid_topics;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map(norm);
}

function spiceRank(s: PlayDeckTemplate["spice"]): number {
  if (s === "high") return 3;
  if (s === "medium") return 2;
  return 1;
}

function appetiteRank(a: PlayChallengeAppetite | "" | undefined): number {
  if (a === "high") return 3;
  if (a === "medium") return 2;
  if (a === "low") return 1;
  return 2;
}

function templateBlockedByAvoid(t: PlayDeckTemplate, avoids: string[]): boolean {
  const nt = norm(t.title);
  for (const a of avoids) {
    if (a.length >= 2 && nt.includes(a)) return true;
  }
  return false;
}

function duplicateTitle(t: PlayDeckTemplate, existingTitles: string[]): boolean {
  const nt = norm(t.title);
  for (const ex of existingTitles) {
    const ne = norm(ex);
    if (ne === nt) return true;
    if (ne.length >= 18 && nt.includes(ne.slice(0, 18))) return true;
    if (nt.length >= 18 && ne.includes(nt.slice(0, 18))) return true;
  }
  return false;
}

/** Deterministic shuffle from seed string (Fisher–Yates). */
function seededOrder<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  function nextRand(): number {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function scorePlayTemplates(
  doc: PlayProfileDocument,
  existingTaskTitles: string[],
  options?: { seed?: string; limit?: number; cursor?: number }
): PlayDeckTemplate[] {
  const userTags = userTagSet(doc);
  const avoids = avoidList(doc);
  const appetite = doc.data.challenge_appetite as PlayChallengeAppetite | "" | undefined;
  const appetiteR = appetiteRank(appetite);
  const energyPref = typeof doc.data.energy_recharge === "string" ? doc.data.energy_recharge : "";

  const scored: { t: PlayDeckTemplate; score: number }[] = [];
  for (const t of PLAY_DECK_TEMPLATES) {
    if (templateBlockedByAvoid(t, avoids)) continue;
    if (duplicateTitle(t, existingTaskTitles)) continue;
    const spice = spiceRank(t.spice ?? "low");
    if (spice > appetiteR) continue;

    let score = 1;
    for (const tag of t.tags) {
      if (userTags.has(tag)) score += 3;
    }
    if (energyPref === "quiet" && t.tags.includes("quiet")) score += 2;
    if (energyPref === "active" && (t.tags.includes("outdoors") || t.tags.includes("sports"))) score += 2;
    if (energyPref === "social" && t.tags.includes("social_light")) score += 2;
    if (energyPref === "mixed") score += 1;

    scored.push({ t, score });
  }

  scored.sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));

  const seed = options?.seed ?? "playdeck";
  const limit = Math.min(12, Math.max(3, options?.limit ?? 6));
  const cursor = Math.max(0, options?.cursor ?? 0);

  const band = scored.length > 0 ? scored.slice(0, Math.min(100, scored.length)).map((r) => r.t) : [];
  const pool =
    band.length > 0
      ? band
      : PLAY_DECK_TEMPLATES.filter(
          (t) => !templateBlockedByAvoid(t, avoids) && !duplicateTitle(t, existingTaskTitles)
        );

  const shuffled = seededOrder(pool, seed);
  return shuffled.slice(cursor, cursor + limit);
}

export function getPlayTemplateById(id: string): PlayDeckTemplate | undefined {
  return PLAY_DECK_TEMPLATES.find((t) => t.id === id);
}

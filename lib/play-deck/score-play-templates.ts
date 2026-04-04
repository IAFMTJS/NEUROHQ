import type { PlayProfileDocument, PlayChallengeAppetite, PlayProfileDataV1 } from "@/types/play-profile.types";
import type { PlayDeckTemplate } from "./types";
import { PLAY_DECK_TEMPLATES, PLAY_DECK_STARTER_IDS } from "./builtin-templates";

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** All string fields we scan for hobby / keyword hints. */
const PLAY_PROFILE_TEXT_KEYS: (keyof PlayProfileDataV1)[] = [
  "about_you",
  "daily_life",
  "favorites",
  "weekend_vibes",
  "micro_delights",
  "sensory_notes",
  "indoor_hobbies",
  "games_and_platforms",
  "travel_daydream",
  "animals_and_plants",
  "learning_for_fun",
  "ideal_microbreak",
];

function textBlob(doc: PlayProfileDocument): string {
  const d = doc.data;
  const parts: string[] = [];
  for (const key of PLAY_PROFILE_TEXT_KEYS) {
    const v = d[key];
    if (typeof v === "string" && v.trim()) parts.push(v);
  }
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

  const morningEnergy = typeof d.morning_energy === "string" ? d.morning_energy : "";
  if (morningEnergy === "early_bird") {
    set.add("outdoors");
    set.add("morning");
  }
  if (morningEnergy === "night_owl") {
    set.add("chill");
    set.add("film");
    set.add("quiet");
  }

  const socialBat = typeof d.social_battery === "string" ? d.social_battery : "";
  if (socialBat === "introvert") {
    set.add("quiet");
    set.add("chill");
  }
  if (socialBat === "extravert") {
    set.add("social_light");
    set.add("games");
  }

  const humor = typeof d.humor_vibe === "string" ? d.humor_vibe : "";
  if (humor === "silly") set.add("silly");
  if (humor === "wholesome") set.add("wholesome");
  if (humor === "dry") {
    set.add("writing");
    set.add("reading");
  }

  const musicH = typeof d.music_habit === "string" ? d.music_habit : "";
  if (musicH === "always_bg" || musicH === "active_listen") set.add("music");
  if (musicH === "rare") set.add("quiet");

  const moveB = typeof d.movement_baseline === "string" ? d.movement_baseline : "";
  if (moveB === "high") set.add("sports");
  if (moveB === "low") set.add("chill");

  const outdoorA = typeof d.outdoor_access === "string" ? d.outdoor_access : "";
  if (outdoorA === "green_close" || outdoorA === "rural") set.add("nature");
  if (outdoorA === "city") set.add("outdoors");

  const cookV = typeof d.cooking_vibe === "string" ? d.cooking_vibe : "";
  if (cookV === "enjoy" || cookV === "love_it") set.add("cooking");

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
    ["podcast", "podcasts"],
    ["fotografie", "photography"],
    ["foto", "photography"],
    ["schrijf", "writing"],
    ["journal", "writing"],
    ["blog", "writing"],
    ["boardgame", "boardgames"],
    ["bordspel", "boardgames"],
    ["dans", "dancing"],
    ["dance", "dancing"],
    ["diy", "diy"],
    ["hout", "diy"],
    ["breien", "crafting"],
    ["borduur", "crafting"],
    ["aquarium", "pets"],
    ["plant", "nature"],
    ["kamerplant", "nature"],
    ["steam deck", "games"],
    ["playstation", "games"],
    ["xbox", "games"],
    ["switch", "games"],
    ["wandeling", "outdoors"],
    ["strand", "nature"],
    ["museum", "learning"],
    ["trivia", "puzzles"],
    ["karaoke", "music"],
    ["comedy", "silly"],
    ["grap", "silly"],
    ["manga", "manga"],
    ["manhwa", "manga"],
    ["manhua", "manga"],
    ["anime", "anime"],
    ["cosplay", "anime"],
    ["crunchyroll", "anime"],
    ["ghibli", "anime"],
    ["otaku", "anime"],
    ["strip", "comics"],
    ["graphic novel", "comics"],
    ["strips", "comics"],
    ["decor", "decorating"],
    ["decoreren", "decorating"],
    ["interieur", "decorating"],
    ["styling", "decorating"],
    ["huisinrichting", "decorating"],
    ["verlichting", "decorating"],
    ["kleurstal", "decorating"],
    ["online shop", "online_shopping"],
    ["webshop", "online_shopping"],
    ["webwinkel", "online_shopping"],
    ["bol.com", "online_shopping"],
    ["amazon", "online_shopping"],
    ["vinted", "online_shopping"],
    ["marktplaats", "online_shopping"],
    ["wishlist", "online_shopping"],
    ["filosofie", "philosophy"],
    ["stoïc", "philosophy"],
    ["ethiek", "philosophy"],
    ["existential", "philosophy"],
    ["true crime", "true_crime"],
    ["truecrime", "true_crime"],
    ["moordzaak", "true_crime"],
    ["misdaad", "true_crime"],
    ["detective", "true_crime"],
    ["k-drama", "kdrama"],
    ["kdrama", "kdrama"],
    ["korean drama", "kdrama"],
    ["documentaire", "documentaries"],
    ["docu", "documentaries"],
    ["tweedehands", "thrifting"],
    ["vintage", "thrifting"],
    ["kringloop", "thrifting"],
    ["rommelmarkt", "thrifting"],
    ["sterren", "astronomy"],
    ["astronomie", "astronomy"],
    ["ruimtevaart", "astronomy"],
    ["telescoop", "astronomy"],
    ["maan", "astronomy"],
    ["geschiedenis", "history"],
    ["oorlog", "history"],
    ["middeleeuwen", "history"],
  ];
  for (const [needle, tag] of keywords) {
    if (blob.includes(needle)) set.add(tag);
  }
  return set;
}

function avoidList(doc: PlayProfileDocument): string[] {
  const raw = doc.data.avoid_topics;
  const fromArr = !Array.isArray(raw)
    ? []
    : raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map(norm);
  const hard = typeof doc.data.play_hard_nos === "string" ? doc.data.play_hard_nos : "";
  const fromHard = hard
    .split(/[,;\n]+/)
    .map(norm)
    .filter((s) => s.length >= 2);
  return [...fromArr, ...fromHard];
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
  options?: { seed?: string; limit?: number; cursor?: number; starterOnly?: boolean }
): PlayDeckTemplate[] {
  const userTags = userTagSet(doc);
  const avoids = avoidList(doc);
  const appetite = doc.data.challenge_appetite as PlayChallengeAppetite | "" | undefined;
  const appetiteR = appetiteRank(appetite);
  const energyPref = typeof doc.data.energy_recharge === "string" ? doc.data.energy_recharge : "";

  const movementLow = doc.data.movement_baseline === "low";
  const starterOnly = options?.starterOnly === true;

  const scored: { t: PlayDeckTemplate; score: number }[] = [];
  for (const t of PLAY_DECK_TEMPLATES) {
    if (starterOnly && !PLAY_DECK_STARTER_IDS.has(t.id)) continue;
    if (movementLow && t.energy >= 3 && t.tags.includes("sports")) continue;
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

    if (appetiteR >= 3 && spice >= 2) score += 2;
    else if (appetiteR >= 2 && spice >= 2) score += 1;

    const humor = typeof doc.data.humor_vibe === "string" ? doc.data.humor_vibe : "";
    if (humor === "silly" && (t.tags.includes("silly") || spice >= 2)) score += 1;

    scored.push({ t, score });
  }

  scored.sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));

  const seed = options?.seed ?? "playdeck";
  const limit = Math.min(16, Math.max(1, options?.limit ?? 8));
  const cursor = Math.max(0, options?.cursor ?? 0);

  const band = scored.length > 0 ? scored.slice(0, Math.min(100, scored.length)).map((r) => r.t) : [];
  const pool =
    band.length > 0
      ? band
      : PLAY_DECK_TEMPLATES.filter((t) => {
          if (starterOnly && !PLAY_DECK_STARTER_IDS.has(t.id)) return false;
          return !templateBlockedByAvoid(t, avoids) && !duplicateTitle(t, existingTaskTitles);
        });

  const shuffled = seededOrder(pool, seed);
  return shuffled.slice(cursor, cursor + limit);
}

export function getPlayTemplateById(id: string): PlayDeckTemplate | undefined {
  return PLAY_DECK_TEMPLATES.find((t) => t.id === id);
}

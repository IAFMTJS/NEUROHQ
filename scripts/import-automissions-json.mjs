#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "Automissions update 23 pe.json");
const missionTemplatesPath = path.join(repoRoot, "lib", "mission-templates.ts");
const outputPath = path.join(repoRoot, "lib", "automissions-update-23-pe.normalized.json");

const CATEGORY_MAP = {
  discipline: {
    domain: "discipline",
    subcategory: "focus_attention",
    tags: ["focus", "self_discipline"],
    category: "personal",
  },
  learning: {
    domain: "learning",
    subcategory: "growth_learning",
    tags: ["growth", "learning"],
    category: "personal",
  },
  health: {
    domain: "health",
    subcategory: "energy_movement",
    tags: ["energy", "health_body"],
    category: "personal",
  },
  recovery: {
    domain: "health",
    subcategory: "energy_recovery",
    tags: ["recovery", "health_body"],
    category: "personal",
  },
  business: {
    domain: "business",
    subcategory: "structure_planning",
    tags: ["strategy", "structure"],
    category: "work",
  },
  plezier: {
    domain: "learning",
    subcategory: "hobby_creative",
    tags: ["hobby", "recovery"],
    category: "personal",
  },
  sociaal: {
    domain: "discipline",
    subcategory: "courage",
    tags: ["courage", "social"],
    category: "personal",
  },
  breinloos: {
    domain: "health",
    subcategory: "energy_recovery",
    tags: ["recovery", "decompress"],
    category: "personal",
  },
  hyperfocus: {
    domain: "discipline",
    subcategory: "focus_attention",
    tags: ["focus", "deep_work"],
    category: "work",
  },
};

function normCategory(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function energyFromDuration(duration) {
  const d = Number(duration);
  if (!Number.isFinite(d) || d <= 0) return 1;
  if (d <= 10) return 1;
  if (d <= 20) return 2;
  if (d <= 35) return 3;
  if (d <= 60) return 4;
  if (d <= 90) return 5;
  return 6;
}

function normalizeBaseXP(xp) {
  const n = Number(xp);
  if (!Number.isFinite(n)) return 50;
  return clamp(Math.round(n / 5) * 5, 25, 150);
}

function extractTopLevelArrays(source) {
  const arrays = [];
  let depth = 0;
  let start = -1;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];
    const prev = source[i - 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inSingle) {
      if (ch === "'" && prev !== "\\") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '"' && prev !== "\\") inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === "`" && prev !== "\\") inTemplate = false;
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inTemplate = true;
      continue;
    }

    if (ch === "[") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (ch === "]") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        arrays.push(source.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return arrays;
}

function extractCoreMasterPool(source) {
  const marker = "const CORE_MASTER_MISSION_POOL";
  const markerIdx = source.indexOf(marker);
  if (markerIdx === -1) {
    return [];
  }
  const equalsIdx = source.indexOf("=", markerIdx);
  const arrayStart = source.indexOf("[", equalsIdx);
  if (arrayStart === -1) return [];
  let depth = 0;
  let end = -1;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  for (let i = arrayStart; i < source.length; i += 1) {
    const ch = source[i];
    const prev = source[i - 1];
    if (inSingle) {
      if (ch === "'" && prev !== "\\") inSingle = false;
      continue;
    }
    if (inDouble) {
      if (ch === '"' && prev !== "\\") inDouble = false;
      continue;
    }
    if (inTemplate) {
      if (ch === "`" && prev !== "\\") inTemplate = false;
      continue;
    }
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === "`") {
      inTemplate = true;
      continue;
    }
    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) return [];
  const literal = source.slice(arrayStart, end);
  const value = new Function(`"use strict"; return (${literal});`)();
  return Array.isArray(value) ? value : [];
}

function makeNormalizedMission(entry) {
  const idNum = Number(entry.id);
  const title = String(entry.name ?? "").trim();
  const sourceCategory = normCategory(entry.category);
  const map = CATEGORY_MAP[sourceCategory] ?? CATEGORY_MAP.discipline;
  const description =
    String(entry.description ?? "").trim() ||
    (Array.isArray(entry.examples) && entry.examples.length > 0
      ? `Voorbeelden: ${entry.examples.join(", ")}`
      : "Uitgevoerde automissie.");
  const generatedId = `ext-${Number.isFinite(idNum) ? idNum : "x"}-${slugify(title || "mission")}`;

  return {
    id: generatedId,
    source_id: Number.isFinite(idNum) ? idNum : null,
    source_category: sourceCategory || "discipline",
    title: title || "Untitled mission",
    domain: map.domain,
    category: map.category,
    subcategory: map.subcategory,
    tags: map.tags,
    baseXP: normalizeBaseXP(entry.xp),
    energy: energyFromDuration(entry.duration_min),
    durationMinutes: Number.isFinite(Number(entry.duration_min)) ? Number(entry.duration_min) : null,
    description,
  };
}

function main() {
  const sourceText = fs.readFileSync(sourcePath, "utf8");
  const arrays = extractTopLevelArrays(sourceText);
  const flattened = arrays.flatMap((chunk) => {
    try {
      const parsed = JSON.parse(chunk);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const missionTemplatesSource = fs.readFileSync(missionTemplatesPath, "utf8");
  const corePool = extractCoreMasterPool(missionTemplatesSource);
  const coreTitles = new Set(corePool.map((m) => String(m.title ?? "").trim().toLowerCase()));
  const coreIds = new Set(corePool.map((m) => String(m.id ?? "").trim()));

  const external = [];
  const seenTitles = new Set();
  const seenIds = new Set();

  for (const raw of flattened) {
    const normalized = makeNormalizedMission(raw);
    const titleKey = normalized.title.toLowerCase();
    if (coreTitles.has(titleKey) || seenTitles.has(titleKey)) continue;
    if (coreIds.has(normalized.id) || seenIds.has(normalized.id)) continue;
    seenTitles.add(titleKey);
    seenIds.add(normalized.id);
    external.push(normalized);
  }

  external.sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    if (a.subcategory !== b.subcategory) return a.subcategory.localeCompare(b.subcategory);
    return a.title.localeCompare(b.title);
  });

  fs.writeFileSync(outputPath, `${JSON.stringify(external, null, 2)}\n`, "utf8");

  console.log(`[import-automissions] arrays parsed: ${arrays.length}`);
  console.log(`[import-automissions] source entries: ${flattened.length}`);
  console.log(`[import-automissions] imported entries: ${external.length}`);
  console.log(`[import-automissions] wrote ${path.relative(repoRoot, outputPath).replace(/\\/g, "/")}`);
}

main();

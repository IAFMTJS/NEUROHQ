#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "lib", "mission-templates.ts");
const externalSeedPath = path.join(repoRoot, "lib", "automissions-update-23-pe.normalized.json");
const reportPath = path.join(repoRoot, "docs", "qa", "auto-missions-inventory.md");

function extractMasterMissionPool(source) {
  const markers = ["const CORE_MASTER_MISSION_POOL", "export const MASTER_MISSION_POOL"];
  const markerIdx = markers.reduce((found, marker) => {
    if (found !== -1) return found;
    const idx = source.indexOf(marker);
    return idx === -1 ? -1 : idx;
  }, -1);
  if (markerIdx === -1) {
    throw new Error("Could not find a master mission pool marker in lib/mission-templates.ts");
  }

  const equalsIdx = source.indexOf("=", markerIdx);
  if (equalsIdx === -1) {
    throw new Error("Could not locate assignment for MASTER_MISSION_POOL");
  }

  const arrayStart = source.indexOf("[", equalsIdx);
  if (arrayStart === -1) {
    throw new Error("Could not locate array start for MASTER_MISSION_POOL");
  }

  let i = arrayStart;
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let arrayEnd = -1;

  for (; i < source.length; i += 1) {
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
      depth += 1;
      continue;
    }
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = i + 1;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    throw new Error("Could not locate array end for MASTER_MISSION_POOL");
  }

  return source.slice(arrayStart, arrayEnd);
}

function evaluatePool(arrayLiteral) {
  const fn = new Function(`"use strict"; return (${arrayLiteral});`);
  const value = fn();
  if (!Array.isArray(value)) {
    throw new Error("MASTER_MISSION_POOL did not evaluate to an array");
  }
  return value;
}

function xpLevelFromBaseXP(baseXP) {
  return baseXP >= 75 ? "high" : baseXP >= 40 ? "normal" : "low";
}

function loadExternalSeed() {
  if (!fs.existsSync(externalSeedPath)) return [];
  try {
    const raw = fs.readFileSync(externalSeedPath, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function mergeCoreWithExternal(corePool, externalSeed) {
  const merged = [...corePool];
  const seenIds = new Set(corePool.map((mission) => mission.id));
  const seenTitles = new Set(corePool.map((mission) => normalizeText(mission.title).toLowerCase()));

  for (const seed of externalSeed) {
    const id = normalizeText(seed.id);
    const title = normalizeText(seed.title);
    if (!id || !title) continue;

    const titleKey = title.toLowerCase();
    if (seenIds.has(id) || seenTitles.has(titleKey)) continue;

    const baseXP = Number(seed.baseXP);
    const safeBaseXP = Number.isFinite(baseXP) ? Math.max(10, Math.min(300, Math.round(baseXP))) : 50;
    const energy = Number(seed.energy);
    const safeEnergy = Number.isFinite(energy) ? Math.max(1, Math.min(10, Math.round(energy))) : 3;

    merged.push({
      id,
      title,
      domain: normalizeText(seed.domain),
      category: normalizeText(seed.category) || "personal",
      baseXP: safeBaseXP,
      xpLevel: xpLevelFromBaseXP(safeBaseXP),
      energy: safeEnergy,
      description: normalizeText(seed.description) || "Imported mission template.",
      subcategory: normalizeText(seed.subcategory) || null,
      tags: Array.isArray(seed.tags) ? seed.tags : [],
    });
    seenIds.add(id);
    seenTitles.add(titleKey);
  }

  return merged;
}

function normalizeText(v) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function validatePool(pool) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();
  const seenTitles = new Map();

  for (let idx = 0; idx < pool.length; idx += 1) {
    const mission = pool[idx] ?? {};
    const row = idx + 1;

    const id = normalizeText(mission.id);
    const title = normalizeText(mission.title);
    const domain = normalizeText(mission.domain);
    const subcategory = normalizeText(mission.subcategory);
    const description = normalizeText(mission.description);
    const baseXP = Number(mission.baseXP);
    const energy = Number(mission.energy);
    const tags = Array.isArray(mission.tags) ? mission.tags.filter((tag) => typeof tag === "string" && tag.trim()) : [];

    if (!id) {
      errors.push(`Row ${row}: missing id`);
    } else if (seenIds.has(id)) {
      errors.push(`Row ${row}: duplicate id "${id}" (first at row ${seenIds.get(id)})`);
    } else {
      seenIds.set(id, row);
    }

    if (!title) {
      errors.push(`Row ${row}: missing title`);
    } else {
      const key = title.toLowerCase();
      if (seenTitles.has(key)) {
        errors.push(`Row ${row}: duplicate title "${title}" (first at row ${seenTitles.get(key)})`);
      } else {
        seenTitles.set(key, row);
      }
    }

    if (!domain) {
      errors.push(`Row ${row}: missing domain`);
    }
    if (!Number.isFinite(baseXP) || baseXP < 10 || baseXP > 300) {
      errors.push(`Row ${row}: baseXP out of range (expected 10..300, got "${mission.baseXP}")`);
    }
    if (!Number.isFinite(energy) || energy < 1 || energy > 10) {
      errors.push(`Row ${row}: energy out of range (expected 1..10, got "${mission.energy}")`);
    }
    if (!description) {
      errors.push(`Row ${row}: missing description`);
    }
    if (tags.length === 0) {
      warnings.push(`Row ${row}: missing tags array values`);
    }
    if (!subcategory) {
      warnings.push(`Row ${row}: missing subcategory`);
    }
  }

  return { errors, warnings };
}

function groupCounts(pool, field) {
  const counts = new Map();
  for (const mission of pool) {
    const key = normalizeText(mission[field]) || "(none)";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function toInventoryMarkdown(pool, validation, sourceFile) {
  const generatedAt = new Date().toISOString();
  const domainCounts = groupCounts(pool, "domain");
  const subcategoryCounts = groupCounts(pool, "subcategory");

  const sorted = [...pool].sort((a, b) => {
    const domainA = normalizeText(a.domain);
    const domainB = normalizeText(b.domain);
    if (domainA !== domainB) return domainA.localeCompare(domainB);
    const subA = normalizeText(a.subcategory);
    const subB = normalizeText(b.subcategory);
    if (subA !== subB) return subA.localeCompare(subB);
    return normalizeText(a.title).localeCompare(normalizeText(b.title));
  });

  const lines = [];
  lines.push("# Auto Missions Inventory");
  lines.push("");
  lines.push(`Generated at: \`${generatedAt}\``);
  lines.push(`Source: \`${sourceFile}\``);
  lines.push("");
  lines.push("## Validation Summary");
  lines.push("");
  lines.push(`- Total missions: **${pool.length}**`);
  lines.push(`- Errors: **${validation.errors.length}**`);
  lines.push(`- Warnings: **${validation.warnings.length}**`);
  lines.push("");

  if (validation.errors.length > 0) {
    lines.push("### Errors");
    lines.push("");
    for (const err of validation.errors) lines.push(`- ${err}`);
    lines.push("");
  }
  if (validation.warnings.length > 0) {
    lines.push("### Warnings");
    lines.push("");
    for (const warn of validation.warnings) lines.push(`- ${warn}`);
    lines.push("");
  }

  lines.push("## Domain Distribution");
  lines.push("");
  lines.push("| Domain | Count |");
  lines.push("|---|---:|");
  for (const [domain, count] of domainCounts) {
    lines.push(`| ${escapeMd(domain)} | ${count} |`);
  }
  lines.push("");

  lines.push("## Subcategory Distribution");
  lines.push("");
  lines.push("| Subcategory | Count |");
  lines.push("|---|---:|");
  for (const [subcategory, count] of subcategoryCounts) {
    lines.push(`| ${escapeMd(subcategory)} | ${count} |`);
  }
  lines.push("");

  lines.push("## Full Catalog");
  lines.push("");
  lines.push("| ID | Title | Domain | Subcategory | XP | Energy | Tags |");
  lines.push("|---|---|---|---|---:|---:|---|");
  for (const mission of sorted) {
    const tags = Array.isArray(mission.tags) ? mission.tags.join(", ") : "";
    lines.push(
      `| ${escapeMd(mission.id)} | ${escapeMd(mission.title)} | ${escapeMd(mission.domain)} | ${escapeMd(mission.subcategory ?? "")} | ${Number(mission.baseXP)} | ${Number(mission.energy)} | ${escapeMd(tags)} |`
    );
  }
  lines.push("");

  return lines.join("\n");
}

function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const shouldWrite = process.argv.includes("--write");
  const source = fs.readFileSync(sourcePath, "utf8");
  const poolLiteral = extractMasterMissionPool(source);
  const corePool = evaluatePool(poolLiteral);
  const pool = mergeCoreWithExternal(corePool, loadExternalSeed());
  const validation = validatePool(pool);

  console.log(`[validate-automissions] missions: ${pool.length}`);
  console.log(`[validate-automissions] errors: ${validation.errors.length}`);
  console.log(`[validate-automissions] warnings: ${validation.warnings.length}`);

  if (shouldWrite) {
    const markdown = toInventoryMarkdown(
      pool,
      validation,
      path.relative(repoRoot, sourcePath).replace(/\\/g, "/")
    );
    ensureDirFor(reportPath);
    fs.writeFileSync(reportPath, markdown, "utf8");
    console.log(`[validate-automissions] wrote ${path.relative(repoRoot, reportPath).replace(/\\/g, "/")}`);
  }

  if (validation.errors.length > 0) {
    process.exitCode = 1;
  }
}

main();

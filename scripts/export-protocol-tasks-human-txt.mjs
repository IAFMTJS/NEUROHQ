import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const fullPath = path.join(root, "lib", "protocols-seed-full.json");
const catalogPath = path.join(root, "lib", "protocols-seed-catalog.json");
const outputPath = path.join(root, "docs", "PROTOCOL_TAKEN_PER_PROTOCOL.txt");

const dayNames = {
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
  7: "Zondag",
};

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseArrayFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error(`Bestand heeft geen array-structuur: ${filePath}`);
  return data;
}

function indexToLetters(index) {
  // 0 -> A, 25 -> Z, 26 -> AA, etc.
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function addLine(lines, text = "") {
  lines.push(String(text));
}

function addDetailsBlock(lines, label, items, indent = "\t") {
  const arr = ensureArray(items).filter((x) => x != null && String(x).trim() !== "");
  addLine(lines, `${indent}${label}`);
  if (arr.length === 0) {
    addLine(lines, `${indent}\t- (geen)`);
    return;
  }
  for (const item of arr) addLine(lines, `${indent}\t- ${item}`);
}

function writeTask(lines, task, protocolLetters, taskIndex) {
  const title = task.title ?? "(zonder titel)";
  const desc = task.concrete ?? task.why_it_matters ?? "-";
  const minutes = task.minutes != null ? `${task.minutes} min` : "-";

  addLine(lines, `Taak ${protocolLetters}${taskIndex} :`);
  addLine(lines, `\tTaaknaam`);
  addLine(lines, `\t\t${title}`);
  addLine(lines, `\tTaakbeschrijving`);
  addLine(lines, `\t\t${desc}`);
  addLine(lines, `\tTaakduur`);
  addLine(lines, `\t\t${minutes}${task.frequency_note ? ` (${task.frequency_note})` : ""}`);
  addLine(lines, `\tTaak details`);

  if (task.id) addLine(lines, `\t\t- ID: ${task.id}`);

  const preferred = ensureArray(task.preferred_days).map((d) => dayNames[d] ?? `Dag ${d}`);
  if (preferred.length) addLine(lines, `\t\t- Voorkeursdagen: ${preferred.join(", ")}`);

  if (task.why_it_matters) addLine(lines, `\t\t- Waarom dit telt: ${task.why_it_matters}`);
  if (task.meso_outcome) addLine(lines, `\t\t- Meso-effect: ${task.meso_outcome}`);
  if (task.macro_link) addLine(lines, `\t\t- Macro-link: ${task.macro_link}`);
  if (task.success_criteria) addLine(lines, `\t\t- Succescriteria: ${task.success_criteria}`);
  if (task.reflection_prompt) addLine(lines, `\t\t- Reflectievraag: ${task.reflection_prompt}`);

  addDetailsBlock(lines, "- Checklist:", task.checklist, "\t\t");
  addDetailsBlock(lines, "- Micro-acties:", task.micro_actions, "\t\t");
  addDetailsBlock(lines, "- Uitvoeringsstappen:", task.execution_steps, "\t\t");

  const rb = task.reflection_block ?? null;
  addLine(lines, `\t\t- Reflectieblok:`);
  if (!rb) {
    addLine(lines, `\t\t\t- (geen)`);
  } else {
    if (rb.prompt) addLine(lines, `\t\t\t- Prompt: ${rb.prompt}`);
    if (rb.capture_hint) addLine(lines, `\t\t\t- Capture-hint: ${rb.capture_hint}`);
    if (rb.success_signal) addLine(lines, `\t\t\t- Success-signal: ${rb.success_signal}`);
  }

  const scaling = task.scaling ?? null;
  if (scaling && typeof scaling === "object") {
    addLine(lines, `\t\t- Schaalniveaus:`);
    for (const level of ["easy", "medium", "hard"]) {
      const cfg = scaling[level];
      if (!cfg) {
        addLine(lines, `\t\t\t- ${level}: (niet ingevuld)`);
        continue;
      }
      const parts = [];
      if (cfg.concrete) parts.push(cfg.concrete);
      if (cfg.minutes != null) parts.push(`${cfg.minutes} min`);
      addLine(lines, `\t\t\t- ${level}: ${parts.join(" | ") || "(geen details)"}`);
    }
  }
}

function collectProtocolTasks(protocol) {
  const def = protocol.definition ?? {};
  const weeks = ensureArray(def.weeks).sort((a, b) => (a.week_index ?? 0) - (b.week_index ?? 0));

  const byId = new Map();
  for (const w of weeks) {
    for (const t of ensureArray(w.tasks)) {
      const id = t?.id ?? `${protocol.slug ?? "protocol"}::${t?.title ?? "taak"}`;
      if (!byId.has(id)) byId.set(id, t);
    }
  }
  return [...byId.values()];
}

const fullProtocols = parseArrayFile(fullPath);
const catalogProtocols = parseArrayFile(catalogPath);

// Merge: catalog + full, last one wins on identical key (slug+locale)
const protocolsByKey = new Map();
for (const p of [...catalogProtocols, ...fullProtocols]) {
  const key = `${p.slug ?? ""}::${p.locale ?? ""}`;
  if (!key.trim()) continue;
  protocolsByKey.set(key, p);
}

const protocols = [...protocolsByKey.values()].sort((a, b) => {
  const ao = a.sort_order ?? Number.MAX_SAFE_INTEGER;
  const bo = b.sort_order ?? Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  return String(a.title ?? "").localeCompare(String(b.title ?? ""), "nl");
});

const lines = [];
addLine(lines, "NEUROHQ — TAKEN PER PROTOCOL (MENSENTAAL)");
addLine(lines, `Gegenereerd op: ${new Date().toISOString()}`);
addLine(lines, `Bron 1: ${path.relative(root, fullPath)} (${fullProtocols.length} items)`);
addLine(lines, `Bron 2: ${path.relative(root, catalogPath)} (${catalogProtocols.length} items)`);
addLine(lines, `Unieke protocollen na merge: ${protocols.length}`);
addLine(lines);
addLine(lines);

protocols.forEach((p, protocolIndex) => {
  const letters = indexToLetters(protocolIndex);
  const title = p.title ?? "(zonder titel)";
  const tasks = collectProtocolTasks(p);

  addLine(lines, `${letters}. ${title}`);
  addLine(lines);

  if (tasks.length === 0) {
    addLine(lines, `Geen taken gevonden in dit protocol (slug: ${p.slug ?? "-"}).`);
  } else {
    tasks.forEach((t, idx) => {
      writeTask(lines, t, letters, idx + 1);
      addLine(lines);
    });
  }

  // spacing between protocols to avoid confusion (as requested)
  addLine(lines);
  addLine(lines);
  addLine(lines);
  addLine(lines);
});

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`Taken-export geschreven naar: ${outputPath}`);

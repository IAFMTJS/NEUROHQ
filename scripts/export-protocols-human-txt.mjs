import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const fullPath = path.join(root, "lib", "protocols-seed-full.json");
const catalogPath = path.join(root, "lib", "protocols-seed-catalog.json");
const outputPath = path.join(root, "docs", "PROTOCOLLEN_VOLLEDIG_MENSENTAAL.txt");

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

function cleanMarkdown(md) {
  if (typeof md !== "string" || !md.trim()) return "";
  return md
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .trim();
}

function addLine(lines, text = "") {
  lines.push(String(text));
}

function addSectionTitle(lines, title) {
  addLine(lines, title);
  addLine(lines, "-".repeat(Math.max(12, title.length)));
}

function addList(lines, items, prefix = "- ") {
  const arr = ensureArray(items).filter((x) => x != null && String(x).trim() !== "");
  if (arr.length === 0) {
    addLine(lines, `${prefix}(geen items)`);
    return;
  }
  for (const item of arr) addLine(lines, `${prefix}${item}`);
}

function formatUnknown(lines, label, value, indent = 0) {
  const pad = "  ".repeat(indent);
  const head = `${pad}- ${label}:`;

  if (value == null) {
    addLine(lines, `${head} (leeg)`);
    return;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    addLine(lines, `${head} ${value}`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      addLine(lines, `${head} (lege lijst)`);
      return;
    }
    addLine(lines, head);
    value.forEach((entry, idx) => formatUnknown(lines, `[${idx + 1}]`, entry, indent + 1));
    return;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      addLine(lines, `${head} (leeg object)`);
      return;
    }
    addLine(lines, head);
    keys.forEach((k) => formatUnknown(lines, k, value[k], indent + 1));
  }
}

function writeTask(lines, task, index) {
  addLine(lines, `  Taak ${index}: ${task.title ?? "(zonder titel)"}`);
  addLine(lines, `  ${"~".repeat(16)}`);
  addLine(lines, `  - ID: ${task.id ?? "-"}`);
  if (task.concrete) addLine(lines, `  - Concrete uitvoering: ${task.concrete}`);
  if (task.minutes != null) addLine(lines, `  - Richttijd: ${task.minutes} minuten`);
  if (task.frequency_note) addLine(lines, `  - Frequentie: ${task.frequency_note}`);
  if (task.why_it_matters) addLine(lines, `  - Waarom dit telt: ${task.why_it_matters}`);
  if (task.meso_outcome) addLine(lines, `  - Meso-effect: ${task.meso_outcome}`);
  if (task.macro_link) addLine(lines, `  - Macro-link: ${task.macro_link}`);
  if (task.success_criteria) addLine(lines, `  - Succescriteria: ${task.success_criteria}`);
  if (task.reflection_prompt) addLine(lines, `  - Reflectievraag: ${task.reflection_prompt}`);

  const preferred = ensureArray(task.preferred_days).map((d) => dayNames[d] ?? `Dag ${d}`);
  addLine(lines, "  - Voorkeursdagen:");
  addList(lines, preferred, "    - ");

  addLine(lines, "  - Checklist:");
  addList(lines, task.checklist, "    - ");

  addLine(lines, "  - Micro-acties:");
  addList(lines, task.micro_actions, "    - ");

  addLine(lines, "  - Uitvoeringsstappen:");
  addList(lines, task.execution_steps, "    - ");

  const rb = task.reflection_block ?? null;
  addLine(lines, "  - Reflectieblok:");
  if (!rb) {
    addLine(lines, "    - (geen reflectieblok)");
  } else {
    if (rb.prompt) addLine(lines, `    - Prompt: ${rb.prompt}`);
    if (rb.capture_hint) addLine(lines, `    - Capture-hint: ${rb.capture_hint}`);
    if (rb.success_signal) addLine(lines, `    - Success-signal: ${rb.success_signal}`);
  }

  addLine(lines, "  - Schaalniveaus:");
  const scaling = task.scaling ?? {};
  for (const level of ["easy", "medium", "hard"]) {
    const cfg = scaling[level];
    if (!cfg) {
      addLine(lines, `    - ${level}: (niet ingevuld)`);
      continue;
    }
    const parts = [];
    if (cfg.concrete) parts.push(cfg.concrete);
    if (cfg.minutes != null) parts.push(`${cfg.minutes} min`);
    addLine(lines, `    - ${level}: ${parts.join(" | ") || "(geen details)"}`);
  }

  const knownTaskKeys = new Set([
    "id",
    "title",
    "concrete",
    "minutes",
    "why_it_matters",
    "frequency_note",
    "preferred_days",
    "checklist",
    "micro_actions",
    "execution_steps",
    "meso_outcome",
    "macro_link",
    "reflection_block",
    "reflection_prompt",
    "scaling",
    "success_criteria",
  ]);

  const extras = Object.keys(task).filter((k) => !knownTaskKeys.has(k));
  if (extras.length > 0) {
    addLine(lines, "  - Extra taakvelden:");
    for (const k of extras) formatUnknown(lines, k, task[k], 2);
  }
}

function parseArrayFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error(`Bestand heeft geen array-structuur: ${filePath}`);
  }
  return data;
}

const fullProtocols = parseArrayFile(fullPath);
const catalogProtocols = parseArrayFile(catalogPath);

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
addLine(lines, "NEUROHQ PROTOCOLLEN - VOLLEDIGE MENSENTAAL EXPORT");
addLine(lines, `Gegenereerd op: ${new Date().toISOString()}`);
addLine(lines, `Bron 1: ${path.relative(root, fullPath)} (${fullProtocols.length} items)`);
addLine(lines, `Bron 2: ${path.relative(root, catalogPath)} (${catalogProtocols.length} items)`);
addLine(lines, `Unieke protocollen na merge: ${protocols.length}`);
addLine(lines);

protocols.forEach((p, protocolIndex) => {
  const def = p.definition ?? {};
  const phases = ensureArray(def.phases).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const weeks = ensureArray(def.weeks).sort((a, b) => (a.week_index ?? 0) - (b.week_index ?? 0));

  addLine(lines, "=".repeat(96));
  addLine(lines, `Protocol ${protocolIndex + 1} van ${protocols.length}: ${p.title ?? "(zonder titel)"}`);
  addLine(lines, "=".repeat(96));
  addLine(lines, `Slug: ${p.slug ?? "-"}`);
  addLine(lines, `Locale: ${p.locale ?? "-"}`);
  if (p.summary) addLine(lines, `Samenvatting: ${p.summary}`);
  if (p.sort_order != null) addLine(lines, `Sortering: ${p.sort_order}`);
  addLine(lines);

  addSectionTitle(lines, "Kernuitleg");
  if (def.goal_one_liner) addLine(lines, `Doel in 1 zin: ${def.goal_one_liner}`);
  if (def.trajectory_context) addLine(lines, `Context van het traject: ${def.trajectory_context}`);
  if (def.estimated_weeks_min != null || def.estimated_weeks_max != null) {
    addLine(
      lines,
      `Verwachte looptijd: ${def.estimated_weeks_min ?? "?"} t/m ${def.estimated_weeks_max ?? "?"} weken`,
    );
  }

  const body = cleanMarkdown(p.body_md);
  addLine(lines, "Beschrijving (vrij leesbaar):");
  if (!body) addLine(lines, "- (geen body_md)");
  else addList(lines, body.split("\n").map((s) => s.trim()).filter(Boolean));
  addLine(lines);

  addLine(lines, "Vereisten vooraf:");
  addList(lines, def.prerequisites);
  addLine(lines);

  addLine(lines, "Gewenste uitkomsten:");
  addList(lines, def.outcomes);
  addLine(lines);

  addLine(lines, "Tags:");
  addList(lines, def.tags);
  addLine(lines);

  addLine(lines, "Execution framework:");
  if (def.execution_framework) {
    addLine(lines, `- Micro: ${def.execution_framework.micro ?? "-"}`);
    addLine(lines, `- Meso: ${def.execution_framework.meso ?? "-"}`);
    addLine(lines, `- Macro: ${def.execution_framework.macro ?? "-"}`);
  } else {
    addLine(lines, "- (niet ingevuld)");
  }
  addLine(lines);

  addLine(lines, "Quality gates:");
  addList(lines, def.quality_gates);
  addLine(lines);

  addSectionTitle(lines, "Fase-indeling");
  if (phases.length === 0) {
    addLine(lines, "- Geen fases gevonden");
  } else {
    phases.forEach((phase, i) => {
      addLine(
        lines,
        `- Fase ${i + 1}: ${phase.title ?? phase.id ?? "(zonder titel)"} | Week ${phase.week_start ?? "?"} t/m ${phase.week_end ?? "?"}`,
      );
      if (phase.summary) addLine(lines, `  Samenvatting: ${phase.summary}`);
    });
  }
  addLine(lines);

  addSectionTitle(lines, "Weekverdeling en taken");
  if (weeks.length === 0) {
    addLine(lines, "- Geen weken gedefinieerd");
    addLine(lines);
    return;
  }

  weeks.forEach((w, weekIdx) => {
    addLine(lines, "-".repeat(78));
    addLine(lines, `Week ${w.week_index ?? weekIdx + 1}: ${w.title ?? "(zonder titel)"}`);
    addLine(lines, "-".repeat(78));
    if (w.phase_id) addLine(lines, `Fase-id: ${w.phase_id}`);
    if (w.objective) addLine(lines, `Doel van de week: ${w.objective}`);
    if (w.week_intent) addLine(lines, `Weekintentie: ${w.week_intent}`);
    if (w.coach_notes) addLine(lines, `Coach-notes: ${w.coach_notes}`);

    addLine(lines, "Execution flow van deze week:");
    if (w.execution_flow) {
      addLine(lines, `- Micro: ${w.execution_flow.micro ?? "-"}`);
      addLine(lines, `- Meso: ${w.execution_flow.meso ?? "-"}`);
      addLine(lines, `- Macro: ${w.execution_flow.macro ?? "-"}`);
    } else {
      addLine(lines, "- (geen execution_flow)");
    }
    addLine(lines);

    addLine(lines, "Dagindeling:");
    const dayOverview = ensureArray(w.day_overview);
    if (dayOverview.length === 0) {
      addLine(lines, "- (geen dagindeling)");
    } else {
      dayOverview.forEach((d) => {
        const dayLabel = dayNames[d.day_of_week] ?? `Dag ${d.day_of_week ?? "?"}`;
        addLine(lines, `- ${dayLabel}: ${d.focus_line ?? "(geen focuslijn)"}`);
        const ids = ensureArray(d.task_ids);
        addLine(lines, `  Taak-ID's: ${ids.length ? ids.join(", ") : "(geen)"}`);
      });
    }
    addLine(lines);

    addLine(lines, "Wekelijkse checklist:");
    addList(lines, w.weekly_checklist);
    addLine(lines);

    addLine(lines, "Wekelijkse reflectie:");
    addList(lines, w.weekly_reflection_block);
    addLine(lines);

    const tasks = ensureArray(w.tasks);
    addLine(lines, `Taken in deze week (${tasks.length}):`);
    if (tasks.length === 0) {
      addLine(lines, "- (geen taken)");
    } else {
      tasks.forEach((task, taskIdx) => {
        writeTask(lines, task, taskIdx + 1);
        addLine(lines);
      });
    }

    const knownWeekKeys = new Set([
      "week_index",
      "phase_id",
      "title",
      "objective",
      "week_intent",
      "coach_notes",
      "execution_flow",
      "day_overview",
      "weekly_checklist",
      "weekly_reflection_block",
      "tasks",
    ]);
    const extraWeekKeys = Object.keys(w).filter((k) => !knownWeekKeys.has(k));
    if (extraWeekKeys.length > 0) {
      addLine(lines, "Extra weekvelden:");
      for (const k of extraWeekKeys) formatUnknown(lines, k, w[k], 1);
      addLine(lines);
    }
  });

  const knownDefKeys = new Set([
    "version",
    "goal_one_liner",
    "trajectory_context",
    "prerequisites",
    "outcomes",
    "tags",
    "execution_framework",
    "quality_gates",
    "estimated_weeks_min",
    "estimated_weeks_max",
    "phases",
    "weeks",
  ]);
  const extraDefKeys = Object.keys(def).filter((k) => !knownDefKeys.has(k));
  if (extraDefKeys.length > 0) {
    addSectionTitle(lines, "Extra protocolvelden");
    for (const k of extraDefKeys) formatUnknown(lines, k, def[k], 0);
    addLine(lines);
  }

  addLine(lines);
});

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");
console.log(`Mensentaal export geschreven naar: ${outputPath}`);

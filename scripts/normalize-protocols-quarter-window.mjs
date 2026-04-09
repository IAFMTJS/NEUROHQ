import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const MIN_WEEKS = 6; // half kwartaal
const MAX_WEEKS = 13; // vol kwartaal

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

function readJson(relPath) {
  return JSON.parse(readFileSync(join(root, relPath), "utf8"));
}

function writeJson(relPath, data) {
  writeFileSync(join(root, relPath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function weekIndexOf(week) {
  return Number(week?.week_index ?? 0);
}

function sortedWeeks(def) {
  const weeks = Array.isArray(def?.weeks) ? [...def.weeks] : [];
  weeks.sort((a, b) => weekIndexOf(a) - weekIndexOf(b));
  return weeks;
}

function mapTaskIdToWeek(taskId, targetWeek) {
  if (typeof taskId !== "string" || !taskId) return taskId;
  return taskId.replace(/-w\d+-/g, `-w${targetWeek}-`);
}

function cloneWeekForIndex(baseWeek, targetWeek) {
  const next = deepClone(baseWeek);
  const oldWeek = Number(baseWeek?.week_index ?? targetWeek);
  next.week_index = targetWeek;
  if (typeof next.title === "string" && next.title.trim()) {
    next.title = next.title.replace(/Week\s+\d+/i, `Week ${targetWeek}`);
  } else {
    next.title = `Week ${targetWeek}`;
  }
  if (typeof next.objective === "string" && next.objective.trim()) {
    next.objective = `${next.objective} (consolidatie week ${targetWeek})`;
  }

  const taskIdMap = new Map();
  if (Array.isArray(next.tasks)) {
    next.tasks = next.tasks.map((task) => {
      const t = deepClone(task);
      if (typeof t.id === "string") {
        const newId = mapTaskIdToWeek(t.id, targetWeek);
        taskIdMap.set(t.id, newId);
        t.id = newId;
      }
      if (typeof t.title === "string" && t.title.trim()) {
        t.title = `${t.title} (week ${targetWeek})`;
      }
      if (t.week_index != null) t.week_index = targetWeek;
      return t;
    });
  }

  if (Array.isArray(next.day_overview)) {
    next.day_overview = next.day_overview.map((d) => {
      const row = deepClone(d);
      if (Array.isArray(row.task_ids)) {
        row.task_ids = row.task_ids.map((id) => taskIdMap.get(id) ?? mapTaskIdToWeek(id, targetWeek));
      }
      return row;
    });
  }

  if (next.weekly_checkin_quiz && Array.isArray(next.weekly_checkin_quiz.questions)) {
    next.weekly_checkin_quiz = deepClone(next.weekly_checkin_quiz);
    if (typeof next.weekly_checkin_quiz.title === "string") {
      next.weekly_checkin_quiz.title = next.weekly_checkin_quiz.title.replace(/Week\s+\d+/i, `Week ${targetWeek}`);
    }
    next.weekly_checkin_quiz.questions = next.weekly_checkin_quiz.questions.map((q, qi) => {
      const qq = deepClone(q);
      qq.id = `${qq.id ?? `q${qi + 1}`}-w${targetWeek}`;
      if (Array.isArray(qq.options)) {
        qq.options = qq.options.map((opt, oi) => ({
          ...opt,
          id: `${opt.id ?? `o${oi + 1}`}-w${targetWeek}`,
        }));
      }
      return qq;
    });
  }

  if (oldWeek !== targetWeek && Array.isArray(next.progression_steps)) {
    next.progression_steps = next.progression_steps.map((s) =>
      typeof s === "string" ? s.replace(new RegExp(`Week\\s+${oldWeek}`, "gi"), `Week ${targetWeek}`) : s,
    );
  }

  return next;
}

function rebuildPhases(phasesIn, weeks) {
  const phases = Array.isArray(phasesIn) ? deepClone(phasesIn) : [];
  const weekCount = weeks.length;
  if (weekCount === 0) return [];
  if (phases.length === 0) {
    const split = Math.max(3, Math.floor(weekCount / 2));
    return [
      { id: "p1", order: 1, title: "Fase 1 — Basis", summary: "Fundament en ritme vastzetten.", week_start: 1, week_end: split },
      {
        id: "p2",
        order: 2,
        title: "Fase 2 — Verdieping",
        summary: "Volume en consistentie opvoeren.",
        week_start: split + 1,
        week_end: weekCount,
      },
    ];
  }

  phases.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  let prevEnd = 0;
  phases.forEach((p, idx) => {
    const safeStart = clamp(Number(p.week_start ?? prevEnd + 1), 1, weekCount);
    const minEnd = idx === phases.length - 1 ? weekCount : safeStart;
    const safeEnd = clamp(Number(p.week_end ?? minEnd), minEnd, weekCount);
    p.week_start = safeStart;
    p.week_end = safeEnd;
    prevEnd = safeEnd;
  });
  phases[phases.length - 1].week_end = weekCount;

  return phases;
}

function ensureMinWeeks(def) {
  let weeks = sortedWeeks(def);
  if (weeks.length === 0) return { ...def, weeks, phases: rebuildPhases(def.phases, weeks) };

  // Rebase to contiguous 1..N first.
  weeks = weeks.map((w, i) => {
    const target = i + 1;
    if (weekIndexOf(w) === target) return deepClone(w);
    return cloneWeekForIndex(w, target);
  });

  while (weeks.length < MIN_WEEKS) {
    const targetWeek = weeks.length + 1;
    const baseWeek = weeks[weeks.length - 1];
    weeks.push(cloneWeekForIndex(baseWeek, targetWeek));
  }

  const phases = rebuildPhases(def.phases, weeks);
  return { ...def, weeks, phases };
}

function buildPart(row, partNo, totalParts, partWeeks) {
  const source = deepClone(row);
  const def = deepClone(source.definition ?? {});
  const weeks = partWeeks.map((w, i) => cloneWeekForIndex(w, i + 1));
  def.weeks = weeks;
  def.phases = rebuildPhases(def.phases, weeks);
  def.estimated_weeks_min = clamp(Math.max(MIN_WEEKS, Number(def.estimated_weeks_min ?? MIN_WEEKS)), MIN_WEEKS, MAX_WEEKS);
  def.estimated_weeks_max = clamp(Math.max(def.estimated_weeks_min, Number(def.estimated_weeks_max ?? weeks.length)), def.estimated_weeks_min, MAX_WEEKS);

  source.slug = `${source.slug}-deel-${partNo}`;
  source.title = `${source.title} — Deel ${partNo}`;
  source.summary = `${source.summary ?? ""} (Kwartaaldeel ${partNo}/${totalParts})`.trim();
  source.definition = def;
  return source;
}

function normalizeRow(row) {
  const source = deepClone(row);
  const defIn = source.definition ?? {};
  const def = ensureMinWeeks(defIn);
  const weeks = sortedWeeks(def);

  // Maximaal 13 weken per protocol; split als het langer is.
  if (weeks.length > MAX_WEEKS) {
    const first = weeks.slice(0, MAX_WEEKS);
    const second = weeks.slice(MAX_WEEKS, MAX_WEEKS * 2);
    const parts = [buildPart(source, 1, 2, first), buildPart(source, 2, 2, second)];
    return parts;
  }

  def.estimated_weeks_min = clamp(Math.max(MIN_WEEKS, Number(def.estimated_weeks_min ?? MIN_WEEKS)), MIN_WEEKS, MAX_WEEKS);
  def.estimated_weeks_max = clamp(
    Math.max(def.estimated_weeks_min, Number(def.estimated_weeks_max ?? weeks.length)),
    def.estimated_weeks_min,
    MAX_WEEKS,
  );
  def.weeks = weeks;
  def.phases = rebuildPhases(def.phases, weeks);
  source.definition = def;
  return [source];
}

function normalizeRows(rows) {
  const out = [];
  for (const row of rows) {
    const normalized = normalizeRow(row);
    out.push(...normalized);
  }
  return out;
}

const fullPath = "lib/protocols-seed-full.json";
const catalogPath = "lib/protocols-seed-catalog.json";

const fullRows = readJson(fullPath);
const catalogRows = readJson(catalogPath);

const nextFull = normalizeRows(fullRows);
const nextCatalog = normalizeRows(catalogRows);

writeJson(fullPath, nextFull);
writeJson(catalogPath, nextCatalog);

console.log(
  `Quarter-window normalization complete. full: ${fullRows.length} -> ${nextFull.length}, catalog: ${catalogRows.length} -> ${nextCatalog.length}`,
);

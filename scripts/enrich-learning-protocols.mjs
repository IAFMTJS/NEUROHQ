/**
 * Enriches ALL protocol definitions with:
 * - richer per-task guidance (checklist, execution steps, reflection, success criteria)
 * - week progression steps + effective assignments
 * - weekly check-in quiz with correct/incorrect validation metadata
 *
 * Usage: node scripts/enrich-learning-protocols.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const TARGETS = ["lib/protocols-seed-full.json", "lib/protocols-seed-catalog.json"];

function compact(arr) {
  return arr.filter(Boolean);
}

function normalizeTitle(text, fallback) {
  if (!text || typeof text !== "string") return fallback;
  return text.trim() || fallback;
}

function ensureArray(input, fallback) {
  return Array.isArray(input) && input.length > 0 ? input : fallback;
}

function maybeSet(obj, key, value) {
  if (obj[key] == null) obj[key] = value;
}

function defaultPreferredDays(taskIndex) {
  if (taskIndex === 0) return [1, 2, 3];
  if (taskIndex === 1) return [4, 5, 6, 7];
  return [2, 4, 6];
}

function taskSystemOutcome(task, protocolTitle) {
  return `Bouwt een stabiele ${task.title.toLowerCase()}-routine binnen ${protocolTitle}.`;
}

function taskMacroLink(weekTitle) {
  return `Verankert progressie uit ${weekTitle} zodat de volgende week op een hoger basisniveau start.`;
}

function buildTaskChecklist(task, weekTitle) {
  return compact([
    `Definieer done-state voor ${task.title.toLowerCase()} in ${weekTitle}.`,
    `Voer de taak uit volgens timer (${Math.max(5, Number(task.minutes) || 10)} min).`,
    "Sluit af met 1 korte notitie over wat werkte.",
  ]);
}

function buildTaskMicroActions(task) {
  return compact([
    "Open taak zonder afleiding (telefoon uit zicht).",
    "Werk in 1 focusblok met duidelijke start/stop.",
    `Leg 1 concrete volgende stap vast voor "${task.title}".`,
  ]);
}

function buildTaskExecution(task) {
  return compact([
    "Prepare: context klaarzetten en prioriteit bepalen.",
    `Execute: ${task.concrete || "de kernactie van de taak"} zonder multitask.`,
    "Review: resultaat checken en 1 verbetering noteren.",
  ]);
}

function buildWeekAssignments(protocolTitle, week) {
  return [
    `Opdracht 1: plan alle weektaken voor ${protocolTitle} vooraf in je agenda (ma-zo).`,
    `Opdracht 2: lever minimaal 1 bewijsstuk op (notitie, screenshot, of korte reflectie) voor "${week.title}".`,
    "Opdracht 3: sluit de week af met een review en kies 1 concrete upgrade voor volgende week.",
  ];
}

function buildProgressionSteps(week) {
  return [
    `Stap 1 - Baseline: start ${week.title} met een heldere nulmeting (tijd, kwaliteit of frequentie).`,
    "Stap 2 - Stabiliseren: herhaal de kernactie op vaste momenten tot het ritme betrouwbaar is.",
    "Stap 3 - Verscherpen: verhoog 1 variabele (kwaliteit, volume of snelheid) zonder consistentie te verliezen.",
    "Stap 4 - Lock-in: documenteer de beste aanpak als standaard voor de volgende week.",
  ];
}

function buildWeeklyQuiz(protocolSlug, week, protocolTitle) {
  const base = `${protocolSlug}-w${week.week_index}`;
  const tasks = Array.isArray(week.tasks) ? week.tasks : [];
  const primaryTask = tasks[0]?.title ?? "de kernsessie";
  const secondaryTask = tasks[1]?.title ?? "de reflectietaak";
  const objective = normalizeTitle(week.objective, "Consistente uitvoering met zichtbare progressie.");
  const primaryTaskConcrete = normalizeTitle(
    tasks[0]?.concrete,
    "Voer de kernactie uit volgens planning en leg output vast.",
  );
  const secondaryTaskConcrete = normalizeTitle(
    tasks[1]?.concrete,
    "Evalueer kort wat werkte en wat je bijstuurt.",
  );

  return {
    title: `Weekly Check-in Quiz - ${protocolTitle} / ${week.title}`,
    passing_score: 2,
    questions: [
      {
        id: `${base}-q1`,
        prompt: `Wat is het hoofddoel van ${week.title}?`,
        options: [
          {
            id: `${base}-q1-a`,
            text: "Alleen volume verhogen, ongeacht kwaliteit.",
            is_correct: false,
            explanation: "Volume zonder kwaliteitscontrole veroorzaakt vaak terugval.",
          },
          {
            id: `${base}-q1-b`,
            text: objective,
            is_correct: true,
            explanation: "Dit matcht het weekdoel dat in het protocol staat.",
          },
          {
            id: `${base}-q1-c`,
            text: "Nieuwe tools kiezen in plaats van de bestaande routine uitvoeren.",
            is_correct: false,
            explanation: "Tool-switching zonder uitvoering verlaagt het leerresultaat.",
          },
        ],
      },
      {
        id: `${base}-q2`,
        prompt: `Welke actie heeft deze week de hoogste prioriteit voor progressie in ${protocolTitle}?`,
        options: [
          {
            id: `${base}-q2-a`,
            text: `${primaryTask}: ${primaryTaskConcrete}`,
            is_correct: true,
            explanation: "De primaire weektaak draagt het meeste aan skill-opbouw en momentum bij.",
          },
          {
            id: `${base}-q2-b`,
            text: `${secondaryTask}: ${secondaryTaskConcrete}`,
            is_correct: false,
            explanation: "Belangrijk, maar meestal ondersteunend aan de kernactie van deze week.",
          },
          {
            id: `${base}-q2-c`,
            text: "Nieuwe tools uitproberen in plaats van de geplande weektaken afmaken.",
            is_correct: false,
            explanation: "Tool-switching zonder uitvoering verlaagt transfer en weekresultaat.",
          },
        ],
      },
      {
        id: `${base}-q3`,
        prompt: "Wat is de beste reactie bij een gemiste taakdag?",
        options: [
          {
            id: `${base}-q3-a`,
            text: "Alles inhalen in 1 zware sessie.",
            is_correct: false,
            explanation: "Compensatie-overload vergroot de kans op terugval.",
          },
          {
            id: `${base}-q3-b`,
            text: "Binnen 24 uur terug naar een kleinere, haalbare versie van de taak.",
            is_correct: true,
            explanation: "Snelle reset beschermt consistentie en houdt je in uitvoering.",
          },
          {
            id: `${base}-q3-c`,
            text: "Wachten tot de volgende week en dan opnieuw proberen.",
            is_correct: false,
            explanation: "Uitstel breekt het leerritme en vergroot drempel voor herstart.",
          },
        ],
      },
      {
        id: `${base}-q4`,
        prompt: "Welke weekafsluiting geeft het meeste leereffect?",
        options: [
          {
            id: `${base}-q4-a`,
            text: "Klaar is klaar; geen review nodig als taken afgevinkt zijn.",
            is_correct: false,
            explanation: "Zonder review mis je de vertaalslag naar betere uitvoering.",
          },
          {
            id: `${base}-q4-b`,
            text: "Alleen het aantal afgeronde taken noteren.",
            is_correct: false,
            explanation: "Aantallen zonder analyse geven weinig stuurinformatie.",
          },
          {
            id: `${base}-q4-c`,
            text: "Korte review + 1 concrete aanpassing voor de volgende week vastleggen.",
            is_correct: true,
            explanation: "Reflectie met directe aanpassing maakt progressie duurzaam.",
          },
        ],
      },
    ],
  };
}

function ensureDayOverview(week) {
  if (Array.isArray(week.day_overview) && week.day_overview.length > 0) return week.day_overview;
  const taskIds = Array.isArray(week.tasks) ? week.tasks.map((t) => t.id) : [];
  return [
    { day_of_week: 1, focus_line: "Weekstart en planning", task_ids: taskIds.slice(0, 1) },
    { day_of_week: 2, focus_line: "Kernuitvoering - focus op kwaliteit", task_ids: taskIds.slice(0, 1) },
    { day_of_week: 3, focus_line: "Korte voortgangscheck", task_ids: taskIds.slice(1, 2) },
    { day_of_week: 4, focus_line: "Tweede kernblok", task_ids: taskIds.slice(0, 1) },
    { day_of_week: 5, focus_line: "Consolidatie en afronding", task_ids: taskIds.slice(1) },
    { day_of_week: 6, focus_line: "Lichte herhaling of catch-up", task_ids: taskIds.slice(1, 2) },
    { day_of_week: 7, focus_line: "Weekreview en voorbereiding volgende week", task_ids: [] },
  ];
}

function enrichDefinition(row) {
  const def = row.definition ?? row.definition_json;
  if (!def || !Array.isArray(def.weeks)) return false;

  const protocolTitle = normalizeTitle(row.title, row.slug || "dit protocol");
  const phaseById = new Map((def.phases ?? []).map((p) => [p.id, p]));

  maybeSet(
    def,
    "trajectory_context",
    `Dit protocol bouwt stap voor stap op: wekelijkse uitvoering, reflectie en gerichte bijsturing zorgen voor duurzame progressie in ${protocolTitle}.`,
  );
  maybeSet(def, "prerequisites", [
    "Plan minimaal 3 vaste trainingsmomenten per week.",
    "Werk met een korte daglog (1-3 regels).",
    "Houd de moeilijkheid op medium tenzij je weekscore dit ondersteunt.",
  ]);
  maybeSet(def, "outcomes", [
    "Betere uitvoeringsconsistentie zonder no-zero weken.",
    "Concreet zicht op wat werkt per taak en per week.",
    "Heldere progressielijn van baseline naar stabiele uitvoering.",
  ]);
  maybeSet(def, "quality_gates", [
    "Per week minstens 70% van taken uitgevoerd.",
    "Per week 1 reviewmoment met concrete aanpassing.",
    "Geen tierverhoging zonder stabiele medium-week.",
  ]);

  for (const week of def.weeks) {
    const phaseTitle = phaseById.get(week.phase_id)?.title ?? "de huidige fase";
    const weekTitle = normalizeTitle(week.title, `Week ${week.week_index}`);

    maybeSet(
      week,
      "week_intent",
      `${weekTitle}: van losse acties naar een betrouwbaar ritme met zichtbare output in ${phaseTitle}.`,
    );
    maybeSet(
      week,
      "coach_notes",
      "Bescherm consistentie boven intensiteit: bij tijdsdruk verklein je de taak, je slaat hem niet over.",
    );
    maybeSet(week, "execution_flow", {
      micro: "Rond elke taak af met een concrete done-state en korte notitie.",
      meso: "Herhaal het weekritme op vaste dagen en evalueer halverwege.",
      macro: "Gebruik elke week als bouwsteen voor de volgende fase in het protocol.",
    });
    maybeSet(week, "progression_steps", buildProgressionSteps(week));
    maybeSet(week, "effective_assignments", buildWeekAssignments(protocolTitle, week));
    maybeSet(week, "day_overview", ensureDayOverview(week));
    maybeSet(
      week,
      "weekly_checklist",
      compact([
        "Weekplanning vooraf gemaakt en nageleefd.",
        "Kernactiviteiten zijn op minimaal 3 momenten uitgevoerd.",
        "Minstens 1 reflectie met concrete aanpassing genoteerd.",
      ]),
    );
    maybeSet(week, "weekly_reflection_block", [
      "Welke taak gaf deze week de meeste echte progressie?",
      "Waar verloor je het meeste momentum, en wat is je micro-fix?",
      "Welke 1 aanpassing neem je mee naar volgende week?",
    ]);
    week.weekly_checkin_quiz = buildWeeklyQuiz(row.slug || "protocol", week, protocolTitle);

    if (!Array.isArray(week.tasks)) continue;
    week.tasks.forEach((task, index) => {
      maybeSet(task, "frequency_note", index === 0 ? "3-5x per week" : "1-3x per week");
      maybeSet(task, "preferred_days", defaultPreferredDays(index));
      maybeSet(
        task,
        "why_it_matters",
        `Deze taak voorkomt oppervlakkige uitvoering en bouwt meetbare progressie op binnen ${weekTitle}.`,
      );
      maybeSet(task, "checklist", buildTaskChecklist(task, weekTitle));
      maybeSet(task, "micro_actions", buildTaskMicroActions(task));
      maybeSet(task, "execution_steps", buildTaskExecution(task));
      maybeSet(task, "meso_outcome", taskSystemOutcome(task, protocolTitle));
      maybeSet(task, "macro_link", taskMacroLink(weekTitle));
      maybeSet(
        task,
        "reflection_prompt",
        `Wat werkte vandaag binnen "${task.title}" en wat pas je volgende sessie concreet aan?`,
      );
      maybeSet(
        task,
        "success_criteria",
        "Taak uitgevoerd binnen de geplande tijd + 1 concrete leerpoint vastgelegd.",
      );
    });
  }

  return true;
}

for (const relPath of TARGETS) {
  const fullPath = join(root, relPath);
  const rows = JSON.parse(readFileSync(fullPath, "utf8"));
  if (!Array.isArray(rows)) continue;
  let updated = 0;
  for (const row of rows) {
    if (enrichDefinition(row)) updated++;
  }
  writeFileSync(fullPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`Enriched ${updated} protocol definitions in ${relPath}`);
}

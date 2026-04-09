import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fullPath = join(root, "lib", "protocols-seed-full.json");

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseMinutes(value) {
  const text = String(value || "").trim();
  const nums = [...text.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (!nums.length) return 15;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

function preferredDaysByFrequency(frequency) {
  const f = String(frequency || "").toLowerCase();
  if (f.includes("dagelijks")) return [1, 2, 3, 4, 5, 6, 7];
  if (f.includes("3x") || f.includes("3-5")) return [1, 3, 5];
  if (f.includes("2-3")) return [2, 4, 6];
  if (f.includes("5 dagen")) return [1, 2, 3, 4, 5];
  if (f.includes("dag 1")) return [1];
  if (f.includes("1x")) return [6];
  if (f.includes("per week")) return [1, 3, 5];
  return [2, 4, 6];
}

function scaleMinutes(minutes, factor) {
  return clamp(Math.round(minutes * factor), 5, 240);
}

function buildTask(week, stackItem, index) {
  const minutes = parseMinutes(stackItem.minutes);
  const title = String(stackItem.label || `Taak ${index + 1}`).trim();
  const focus = String(stackItem.focus || "Voer de kernactie uit volgens planning.").trim();
  const frequency = String(stackItem.frequency || "dagelijks").trim();
  const id = `las-w${week.week_index}-t${index + 1}`;

  return {
    id,
    title,
    concrete: focus,
    minutes,
    frequency_note: frequency,
    preferred_days: preferredDaysByFrequency(frequency),
    why_it_matters: `Deze taak verankert ${title.toLowerCase()} binnen ${week.title}.`,
    checklist: [
      `Start ${title.toLowerCase()} met een duidelijke done-state.`,
      `Voer de taak uit in 1 focusblok (${minutes} min).`,
      "Sluit af met 1 korte notitie over wat werkte."
    ],
    micro_actions: [
      "Timer starten en afleiding blokkeren.",
      "Kernactie afmaken zonder multitask.",
      "1 concrete volgende stap noteren."
    ],
    execution_steps: [
      "Prepare: context klaarzetten en doel kiezen.",
      `Execute: ${focus}`,
      "Review: resultaat checken en 1 verbetering vastleggen."
    ],
    meso_outcome: `Bouwt een stabiele ${title.toLowerCase()}-routine in deze week.`,
    macro_link: `Ondersteunt progressie van ${week.title} naar de volgende week.`,
    reflection_prompt: `Wat werkte binnen "${title}" en wat pas je volgende sessie concreet aan?`,
    success_criteria: "Taak afgerond binnen tijd + 1 concrete leerpoint vastgelegd.",
    scaling: {
      easy: {
        concrete: `${focus} (easy)`,
        minutes: scaleMinutes(minutes, 0.7)
      },
      medium: {
        concrete: `${focus} (medium)`,
        minutes
      },
      hard: {
        concrete: `${focus} (hard)`,
        minutes: scaleMinutes(minutes, 1.35)
      }
    }
  };
}

function buildDayOverview(taskIds) {
  const byDay = [
    [taskIds[0], taskIds[1]].filter(Boolean),
    [taskIds[0], taskIds[2]].filter(Boolean),
    [taskIds[1], taskIds[3]].filter(Boolean),
    [taskIds[0], taskIds[4]].filter(Boolean),
    [taskIds[2], taskIds[3]].filter(Boolean),
    [taskIds[1], taskIds[4]].filter(Boolean),
    [taskIds[3], taskIds[4]].filter(Boolean)
  ];
  const labels = [
    "Weekstart: kerninput + activatie",
    "Opbouw: input + output koppelen",
    "Consolidatie: patroon en productie",
    "Tweede piek: kernblok + transfer",
    "Output-focus: schrijven/spreken",
    "Reflectie + herstelblok",
    "Weekafsluiting + voorbereiding"
  ];
  return byDay.map((task_ids, i) => ({
    day_of_week: i + 1,
    focus_line: labels[i],
    task_ids
  }));
}

function buildWeeklyChecklist(week) {
  return [
    `Minstens 70% van ${week.title} taken uitgevoerd.`,
    "Minstens 1 output-bewijs opgeslagen (audio of tekst).",
    "Weekreview gedaan met 1 concrete aanpassing."
  ];
}

function buildQuiz(protocolSlug, protocolTitle, week) {
  const base = `${protocolSlug}-w${week.week_index}`;
  const t1 = week.tasks?.[0];
  const t2 = week.tasks?.[1];
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
            explanation: "Volume zonder controle geeft vaak terugval."
          },
          {
            id: `${base}-q1-b`,
            text: week.objective,
            is_correct: true,
            explanation: "Dit volgt het weekdoel van het protocol."
          },
          {
            id: `${base}-q1-c`,
            text: "Nieuwe tools kiezen in plaats van de routine uitvoeren.",
            is_correct: false,
            explanation: "Tool-switching zonder uitvoering verlaagt resultaat."
          }
        ]
      },
      {
        id: `${base}-q2`,
        prompt: `Welke actie heeft deze week de hoogste prioriteit in ${protocolTitle}?`,
        options: [
          {
            id: `${base}-q2-a`,
            text: t1 ? `${t1.title}: ${t1.concrete}` : "Kernactie van de week uitvoeren.",
            is_correct: true,
            explanation: "De eerste weektaak is de primaire hefboom."
          },
          {
            id: `${base}-q2-b`,
            text: t2 ? `${t2.title}: ${t2.concrete}` : "Ondersteunende taak doen.",
            is_correct: false,
            explanation: "Belangrijk, maar niet de primaire weekhefboom."
          },
          {
            id: `${base}-q2-c`,
            text: "Nieuwe tools uitproberen in plaats van geplande taken afmaken.",
            is_correct: false,
            explanation: "Dat verlaagt transfer en continuiteit."
          }
        ]
      },
      {
        id: `${base}-q3`,
        prompt: "Wat doe je best na een gemiste taakdag?",
        options: [
          {
            id: `${base}-q3-a`,
            text: "Alles inhalen met 1 zware sessie.",
            is_correct: false,
            explanation: "Overcompensatie geeft vaak nieuwe terugval."
          },
          {
            id: `${base}-q3-b`,
            text: "Binnen 24 uur herstarten met een kleinere, haalbare versie.",
            is_correct: true,
            explanation: "Snelle reset beschermt consistentie."
          },
          {
            id: `${base}-q3-c`,
            text: "Wachten tot volgende week voor een nieuwe start.",
            is_correct: false,
            explanation: "Uitstel verhoogt de drempel."
          }
        ]
      },
      {
        id: `${base}-q4`,
        prompt: "Welke weekafsluiting geeft het meeste leereffect?",
        options: [
          {
            id: `${base}-q4-a`,
            text: "Geen review nodig als de meeste taken afgevinkt zijn.",
            is_correct: false,
            explanation: "Zonder review mis je de verbeterlus."
          },
          {
            id: `${base}-q4-b`,
            text: "Alleen aantallen afgeronde taken noteren.",
            is_correct: false,
            explanation: "Aantallen zonder analyse sturen niet."
          },
          {
            id: `${base}-q4-c`,
            text: "Korte review + 1 concrete aanpassing voor volgende week.",
            is_correct: true,
            explanation: "Dat maakt progressie herhaalbaar."
          }
        ]
      }
    ]
  };
}

const rows = JSON.parse(readFileSync(fullPath, "utf8"));
const protocol = rows.find((r) => r.slug === "language-acquisition-system");
if (!protocol?.definition?.weeks) {
  throw new Error("language-acquisition-system not found");
}

for (const week of protocol.definition.weeks) {
  if (!Array.isArray(week.human_task_stack) || week.human_task_stack.length === 0) continue;
  const newTasks = week.human_task_stack.slice(0, 5).map((s, i) => buildTask(week, s, i));
  week.tasks = newTasks;
  week.day_overview = buildDayOverview(newTasks.map((t) => t.id));
  week.weekly_checklist = buildWeeklyChecklist(week);
  week.weekly_reflection_block = [
    "Welke taak had meeste transfer naar echte gesprekken?",
    "Waar verloor je momentum en wat is je micro-fix?",
    "Welke 1 aanpassing neem je mee naar volgende week?"
  ];
  week.weekly_checkin_quiz = buildQuiz(protocol.slug, protocol.title, week);
}

writeFileSync(fullPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
console.log("Rebuilt language protocol tasks for weeks 1-9");

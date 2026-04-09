/**
 * Roll out learning-style protocol structure across all protocol definitions.
 *
 * Usage:
 *   node scripts/rollout-protocol-learning-style.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const TARGETS = ["lib/protocols-seed-full.json", "lib/protocols-seed-catalog.json"];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function compact(arr) {
  return arr.filter(Boolean);
}

function sentence(value, fallback = "") {
  const t = String(value ?? "").trim();
  return t || fallback;
}

function parseMinutes(value, fallback = 20) {
  const text = String(value ?? "");
  const nums = [...text.matchAll(/\d+/g)].map((m) => Number(m[0]));
  if (!nums.length) return fallback;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function preferredDays(freq) {
  const f = String(freq ?? "").toLowerCase();
  if (f.includes("dagelijks")) return [1, 2, 3, 4, 5, 6, 7];
  if (f.includes("3x") || f.includes("3-5")) return [1, 3, 5];
  if (f.includes("2-3")) return [2, 4, 6];
  if (f.includes("5 dagen")) return [1, 2, 3, 4, 5];
  if (f.includes("dag 1")) return [1];
  if (f.includes("per week")) return [1, 3, 5];
  if (f.includes("1x")) return [6];
  return [2, 4, 6];
}

function weeklyDailyMinimum(weekIndex, totalWeeks) {
  const p = totalWeeks <= 1 ? 1 : (weekIndex - 1) / (totalWeeks - 1);
  if (p < 0.2) return "45-60 min";
  if (p < 0.4) return "60-70 min";
  if (p < 0.6) return "60-75 min";
  if (p < 0.8) return "70-90 min";
  return "75-90 min";
}

function weeklyRealityCheck(weekIndex, totalWeeks) {
  const p = totalWeeks <= 1 ? 1 : (weekIndex - 1) / (totalWeeks - 1);
  if (p < 0.2) return "Weerstand in de startfase is normaal; consistentie telt meer dan perfectie.";
  if (p < 0.4) return "Je voelt meer frictie omdat de lat stijgt; dat is precies de bedoeling.";
  if (p < 0.6) return "Tijdelijke vertraging hoort bij betere controle en nauwkeurigheid.";
  if (p < 0.8) return "De integratiefase voelt zwaar omdat je output en realiteit tegelijk traint.";
  return "Doel is duurzame progressie: autonoom blijven uitvoeren na deze week.";
}

function weeklyExpectations(week, tasks) {
  const t1 = tasks[0]?.title ?? "de kernactie";
  const t2 = tasks[1]?.title ?? "de tweede kernactie";
  return [
    sentence(week.objective, "Je voert de weekdoelen consistent uit."),
    `Je kan ${t1.toLowerCase()} en ${t2.toLowerCase()} onder lichte druk uitvoeren.`,
    "Je hebt meetbare output en een duidelijke bijsturing voor volgende week."
  ];
}

function domainProfile(slug) {
  const s = String(slug || "").toLowerCase();
  if (s.includes("gardening")) {
    return {
      actionLabel: "Praktijkblok tuin",
      actionFocus: "Werk 1 concreet tuinblok af (water/snoei/verpot/inspectie) en log resultaat.",
      metricLabel: "Observatie-log",
      metricFocus: "Noteer plantstatus, vocht, fouten en volgende interventie in korte bullets.",
      applyLabel: "Scenario-toepassing",
      applyFocus: "Pas de weekfocus toe op een echte planttaak met duidelijk begin/einde."
    };
  }
  if (s.includes("focus") || s.includes("deep-work") || s.includes("productivity")) {
    return {
      actionLabel: "Focusblok uitvoering",
      actionFocus: "Voer een afgebakend focusblok uit zonder context-switches en met timer.",
      metricLabel: "Afleidingslog",
      metricFocus: "Log afleidingen, triggers en herstelacties; kies 1 concrete preventiefix.",
      applyLabel: "Real-work transfer",
      applyFocus: "Pas de weekfocus toe op echte werkoutput met duidelijke deliverable."
    };
  }
  if (s.includes("behavioral") || s.includes("emotional") || s.includes("stress") || s.includes("identity")) {
    return {
      actionLabel: "Gedragsinterventie",
      actionFocus: "Voer 1 gerichte gedragsinterventie uit in een echte trigger-situatie.",
      metricLabel: "Trigger & response log",
      metricFocus: "Leg trigger, automatische respons en nieuwe respons vast in 3 regels.",
      applyLabel: "Contexttransfer",
      applyFocus: "Herhaal dezelfde interventie in een tweede context voor transfer."
    };
  }
  if (s.includes("financial") || s.includes("decision") || s.includes("critical-thinking")) {
    return {
      actionLabel: "Analyseblok",
      actionFocus: "Werk 1 concrete analyse uit met criteria, risico's en beslissing.",
      metricLabel: "Decision log",
      metricFocus: "Log aanname, argument, tegenargument en gekozen actie.",
      applyLabel: "Beslissingssimulatie",
      applyFocus: "Pas de weekmethode toe op een realistische case met expliciete keuze."
    };
  }
  if (s.includes("communication") || s.includes("persuasion") || s.includes("leadership") || s.includes("body-language")) {
    return {
      actionLabel: "Communicatie-drill",
      actionFocus: "Train 1 kernboodschap met structuur, toon en duidelijk call-to-action.",
      metricLabel: "Feedbacklog",
      metricFocus: "Noteer waar boodschap onduidelijk was en welke herformulering beter werkte.",
      applyLabel: "Live-simulatie",
      applyFocus: "Voer een kort roleplay/gesprek uit en stuur bij op basis van feedback."
    };
  }
  if (s.includes("memory") || s.includes("speed-reading") || s.includes("learning")) {
    return {
      actionLabel: "Leerblok",
      actionFocus: "Voer 1 intensief leerblok uit met actieve recall en concrete output.",
      metricLabel: "Recall-check",
      metricFocus: "Meet wat je actief kan reproduceren zonder hulp en log gaps.",
      applyLabel: "Output transfer",
      applyFocus: "Zet input om naar een eigen uitleg/samenvatting onder tijdsdruk."
    };
  }
  if (s.includes("sleep") || s.includes("recovery") || s.includes("mobility") || s.includes("movement") || s.includes("cooking")) {
    return {
      actionLabel: "Routineblok",
      actionFocus: "Voer het kernritueel volledig uit met vaste volgorde en timing.",
      metricLabel: "Compliance-log",
      metricFocus: "Log adherence, blokkades en 1 concrete tweak voor morgen.",
      applyLabel: "Praktijktest",
      applyFocus: "Pas het ritueel toe in een drukkere context zonder kwaliteit te verliezen."
    };
  }
  return {
    actionLabel: "Kernactie",
    actionFocus: "Voer 1 afgebakende kernactie uit en leg zichtbaar resultaat vast.",
    metricLabel: "Voortgangslog",
    metricFocus: "Leg output, frictie en volgende stap kort vast.",
    applyLabel: "Toepassingsblok",
    applyFocus: "Pas de weekfocus toe in een realistische mini-simulatie."
  };
}

function buildHumanTaskStack(protocolTitle, protocolSlug, week) {
  const p = domainProfile(protocolSlug);
  return [
    {
      label: p.actionLabel,
      minutes: "25-35",
      frequency: "3-5x per week",
      focus: `${p.actionFocus} Weekdoel: ${sentence(week.objective, "voer de kernfocus uit")}.`
    },
    {
      label: p.metricLabel,
      minutes: "10-15",
      frequency: "dagelijks",
      focus: p.metricFocus
    },
    {
      label: p.applyLabel,
      minutes: "15-25",
      frequency: "3x per week",
      focus: p.applyFocus
    },
    {
      label: "Review en correctie",
      minutes: "10-15",
      frequency: "3x per week",
      focus: `Analyseer fouten/vertragingen en maak 1 concrete fix binnen ${protocolTitle}.`
    },
    {
      label: "Progressie-check",
      minutes: "10",
      frequency: "1x per week",
      focus: "Check weekdoel, bewijs output en bepaal 1 upgrade voor volgende week."
    }
  ];
}

function buildTask(week, stackItem, index) {
  const minutes = parseMinutes(stackItem.minutes, 20);
  const title = sentence(stackItem.label, `Taak ${index + 1}`);
  const concrete = sentence(stackItem.focus, "Voer de kernactie uit volgens weekdoel.");
  const frequencyNote = sentence(stackItem.frequency, index < 3 ? "dagelijks" : "3x per week");
  return {
    id: `${week.slug_prefix}-w${week.week_index}-t${index + 1}`,
    title,
    concrete,
    minutes,
    frequency_note: frequencyNote,
    preferred_days: preferredDays(frequencyNote),
    why_it_matters: `Deze taak bouwt meetbare progressie op binnen ${week.title}.`,
    checklist: [
      `Definieer done-state voor ${title.toLowerCase()} in ${week.title}.`,
      `Voer de taak uit volgens timer (${minutes} min).`,
      "Sluit af met 1 korte notitie over wat werkte."
    ],
    micro_actions: [
      "Start timer en verwijder afleiding.",
      "Voer de kernactie volledig uit zonder multitask.",
      "Log 1 concrete volgende stap."
    ],
    execution_steps: [
      "Prepare: context klaarzetten en target bepalen.",
      `Execute: ${concrete}`,
      "Review: resultaat checken en 1 verbetering vastleggen."
    ],
    meso_outcome: `Bouwt een stabiele ${title.toLowerCase()}-routine voor de week.`,
    macro_link: `Verankert progressie uit ${week.title} richting volgende week.`,
    reflection_prompt: `Wat werkte vandaag binnen "${title}" en wat pas je volgende sessie concreet aan?`,
    success_criteria: "Taak uitgevoerd binnen de geplande tijd + 1 concrete leerpoint vastgelegd.",
    scaling: {
      easy: {
        concrete: `${concrete} (easy)`,
        minutes: clamp(Math.round(minutes * 0.7), 5, 240)
      },
      medium: {
        concrete: `${concrete} (medium)`,
        minutes
      },
      hard: {
        concrete: `${concrete} (hard)`,
        minutes: clamp(Math.round(minutes * 1.35), 5, 240)
      }
    }
  };
}

function buildDayOverview(taskIds) {
  const map = [
    [taskIds[0], taskIds[1]],
    [taskIds[0], taskIds[2]],
    [taskIds[1], taskIds[3]],
    [taskIds[0], taskIds[4]],
    [taskIds[2], taskIds[3]],
    [taskIds[1], taskIds[4]],
    [taskIds[3], taskIds[4]]
  ];
  const labels = [
    "Weekstart en kernfocus",
    "Input-naar-output koppeling",
    "Consolidatie en tweede blok",
    "Tweede piek en transfer",
    "Output en toepassing",
    "Reflectie en herstel",
    "Weekafsluiting en vooruitblik"
  ];
  return map.map((entry, i) => ({
    day_of_week: i + 1,
    focus_line: labels[i],
    task_ids: entry.filter(Boolean)
  }));
}

function buildWeeklyQuiz(protocolSlug, protocolTitle, week) {
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
            explanation: "Volume zonder kwaliteitscontrole veroorzaakt vaak terugval."
          },
          {
            id: `${base}-q1-b`,
            text: sentence(week.objective, "Consistente uitvoering met zichtbare progressie."),
            is_correct: true,
            explanation: "Dit matcht het weekdoel dat in het protocol staat."
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
        prompt: `Welke actie heeft deze week de hoogste prioriteit voor progressie in ${protocolTitle}?`,
        options: [
          {
            id: `${base}-q2-a`,
            text: t1 ? `${t1.title}: ${t1.concrete}` : "Voer de primaire weektaak uit.",
            is_correct: true,
            explanation: "De primaire weektaak draagt het meeste aan skill-opbouw en momentum bij."
          },
          {
            id: `${base}-q2-b`,
            text: t2 ? `${t2.title}: ${t2.concrete}` : "Voer de secundaire weektaak uit.",
            is_correct: false,
            explanation: "Belangrijk, maar meestal ondersteunend aan de kernactie van de week."
          },
          {
            id: `${base}-q2-c`,
            text: "Nieuwe tools uitproberen in plaats van geplande taken afmaken.",
            is_correct: false,
            explanation: "Tool-switching zonder uitvoering verlaagt transfer en weekresultaat."
          }
        ]
      },
      {
        id: `${base}-q3`,
        prompt: "Wat is de beste reactie bij een gemiste taakdag?",
        options: [
          {
            id: `${base}-q3-a`,
            text: "Alles inhalen in 1 zware sessie.",
            is_correct: false,
            explanation: "Compensatie-overload vergroot de kans op terugval."
          },
          {
            id: `${base}-q3-b`,
            text: "Binnen 24 uur terug naar een kleinere, haalbare versie van de taak.",
            is_correct: true,
            explanation: "Snelle reset beschermt consistentie en houdt je in uitvoering."
          },
          {
            id: `${base}-q3-c`,
            text: "Wachten tot de volgende week en dan opnieuw proberen.",
            is_correct: false,
            explanation: "Uitstel breekt het leerritme en vergroot drempel voor herstart."
          }
        ]
      },
      {
        id: `${base}-q4`,
        prompt: "Welke weekafsluiting geeft het meeste leereffect?",
        options: [
          {
            id: `${base}-q4-a`,
            text: "Klaar is klaar; geen review nodig als taken afgevinkt zijn.",
            is_correct: false,
            explanation: "Zonder review mis je de vertaalslag naar betere uitvoering."
          },
          {
            id: `${base}-q4-b`,
            text: "Alleen het aantal afgeronde taken noteren.",
            is_correct: false,
            explanation: "Aantallen zonder analyse geven weinig stuurinformatie."
          },
          {
            id: `${base}-q4-c`,
            text: "Korte review + 1 concrete aanpassing voor de volgende week vastleggen.",
            is_correct: true,
            explanation: "Reflectie met directe aanpassing maakt progressie duurzaam."
          }
        ]
      }
    ]
  };
}

function enrichProtocolRow(row) {
  const def = row.definition ?? row.definition_json;
  if (!def || !Array.isArray(def.weeks)) return false;

  const protocolTitle = sentence(row.title, row.slug || "Dit protocol");
  const summary = sentence(row.summary, "");
  const weeks = toArray(def.weeks).sort((a, b) => (a.week_index ?? 0) - (b.week_index ?? 0));
  const totalWeeks = weeks.length || 1;

  def.trajectory_context = `${protocolTitle} werkt via stapsgewijze uitvoering: vaste weekritmes, meetbare output en gerichte bijsturing. ${summary}`.trim();
  def.execution_framework = {
    micro: "Elke sessie heeft een concrete done-state binnen 10-30 minuten.",
    meso: "Elke week bouwt 1 systeemcapability (input, output, retrieval, reflectie).",
    macro: "Elke fase schuift op van basisuitvoering naar autonome toepassing."
  };
  def.quality_gates = [
    "Per week minstens 70% van taken uitgevoerd.",
    "Per week 1 reviewmoment met concrete aanpassing.",
    "Geen tierverhoging zonder stabiele medium-week."
  ];
  if (def.estimated_weeks_min == null) def.estimated_weeks_min = totalWeeks;
  if (def.estimated_weeks_max == null) def.estimated_weeks_max = totalWeeks;

  for (const week of weeks) {
    const existingTasks = toArray(week.tasks);
    week.slug_prefix = row.slug;
    week.week_intent = sentence(
      week.week_intent,
      `${week.title}: van losse acties naar betrouwbaar ritme met zichtbare output.`
    );
    week.coach_notes = sentence(
      week.coach_notes,
      "Bescherm consistentie boven intensiteit: bij tijdsdruk verklein je de taak, je slaat hem niet over."
    );
    week.execution_flow = week.execution_flow ?? {
      micro: "Rond elke taak af met een concrete done-state en korte notitie.",
      meso: "Herhaal het weekritme op vaste dagen en evalueer halverwege.",
      macro: "Gebruik deze week als bouwsteen voor de volgende fase."
    };

    week.human_daily_minimum = `${weeklyDailyMinimum(week.week_index ?? 1, totalWeeks)} (strikte uitvoering).`;
    week.human_end_of_week_expectation = weeklyExpectations(week, existingTasks);
    week.human_reality_check = weeklyRealityCheck(week.week_index ?? 1, totalWeeks);
    week.human_task_stack = buildHumanTaskStack(protocolTitle, row.slug, week);

    week.tasks = week.human_task_stack.slice(0, 5).map((item, idx) => buildTask(week, item, idx));
    const taskIds = week.tasks.map((t) => t.id);
    week.day_overview = buildDayOverview(taskIds);
    week.weekly_checklist = [
      "Weekplanning vooraf gemaakt en nageleefd.",
      "Kernactiviteiten zijn op minimaal 3 momenten uitgevoerd.",
      "Minstens 1 reflectie met concrete aanpassing genoteerd."
    ];
    week.weekly_reflection_block = [
      "Welke taak gaf deze week de meeste echte progressie?",
      "Waar verloor je het meeste momentum, en wat is je micro-fix?",
      "Welke 1 aanpassing neem je mee naar volgende week?"
    ];
    week.weekly_checkin_quiz = buildWeeklyQuiz(row.slug || "protocol", protocolTitle, week);
    delete week.slug_prefix;
  }

  return true;
}

for (const target of TARGETS) {
  const abs = join(root, target);
  const rows = JSON.parse(readFileSync(abs, "utf8"));
  if (!Array.isArray(rows)) continue;
  let changed = 0;
  for (const row of rows) {
    if (enrichProtocolRow(row)) changed++;
  }
  writeFileSync(abs, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
  console.log(`Rolled out learning-style structure for ${changed} protocols in ${target}`);
}

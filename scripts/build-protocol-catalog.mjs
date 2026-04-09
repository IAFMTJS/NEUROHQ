/**
 * Builds lib/protocols-seed-catalog.json — catalog stubs for Updates 22-03 protocol names
 * not yet fully authored. Valid definition_json (6 weeks × 2 tasks, tier scaling).
 * Run: node scripts/build-protocol-catalog.mjs
 */
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const STUB_NOTE =
  "Catalogusstub: concrete weektaken staan klaar in de app; diepere content kan iteratief worden vervangen (Updates 22-03).";

/** @param {string} slug */
function buildDefinition(slug, title, oneLiner, weekHints) {
  const weeks = 6;
  const phases = [
    {
      id: "p1",
      order: 1,
      title: "Fase 1 — Basis",
      summary: "Fundament en ritme vastzetten.",
      week_start: 1,
      week_end: 3,
    },
    {
      id: "p2",
      order: 2,
      title: "Fase 2 — Verdieping",
      summary: "Volume en consistentie opvoeren.",
      week_start: 4,
      week_end: 6,
    },
  ];

  const weekRows = [];
  for (let w = 1; w <= weeks; w++) {
    const phaseId = w <= 3 ? "p1" : "p2";
    const hint = weekHints[w - 1] ?? `Week ${w}: één duidelijke stap vooruit.`;
    weekRows.push({
      week_index: w,
      phase_id: phaseId,
      title: `Week ${w}`,
      objective: hint,
      tasks: [
        {
          id: `${slug}-w${w}-t1`,
          title: "Kern-sessie",
          concrete: "25 min geconcentreerde oefening op dit traject; noteer 1 zin resultaat.",
          minutes: 25,
          scaling: {
            easy: { concrete: "15 min gerichte oefening", minutes: 15 },
            medium: { concrete: "25 min zoals beschreven", minutes: 25 },
            hard: { concrete: "40 min + korte reflectie wat morgen anders", minutes: 40 },
          },
        },
        {
          id: `${slug}-w${w}-t2`,
          title: "Micro-reflectie",
          concrete: "10 min: wat werkte, wat niet; 1 concrete aanpassing voor volgende sessie.",
          minutes: 10,
          scaling: {
            easy: { concrete: "5 min + 1 bullet", minutes: 5 },
            medium: { concrete: "10 min zoals beschreven", minutes: 10 },
            hard: { concrete: "15 min + accountability (bericht aan jezelf)", minutes: 15 },
          },
        },
      ],
    });
  }

  return {
    version: 1,
    goal_one_liner: oneLiner,
    estimated_weeks_min: 6,
    estimated_weeks_max: 13,
    phases,
    weeks: weekRows,
  };
}

/** 21 items → + 3 in protocols-seed-full.json = 24 */
const CATALOG = [
  {
    slug: "behavioral-intelligence-system",
    title: "Behavioral Intelligence System",
    summary: "Gedrag observeren, triggers herkennen, kleine correcties.",
    sort_order: 4,
    oneLiner: "Gedrag bewust sturen zonder drama",
    weekHints: [
      "Baseline: noteer 3 terugkerende patronen (zonder oordeel).",
      "Kies 1 patroon; test 1 micro-interventie 5 dagen.",
      "Meet: wat veranderde in energie / uitkomst?",
      "Plan volgende cyclus: 1 gewoonte vastleggen in agenda.",
    ],
  },
  {
    slug: "gardening-development-system",
    title: "Gardening Development System",
    summary: "Seizoenen, routine, zorgritme — licht belastend traject.",
    sort_order: 5,
    oneLiner: "Consistent verzorgen > sporadisch perfectioneren",
    weekHints: [
      "Inventariseer plek + licht/water; 1 vaste checkmoment.",
      "Weekschema: water + inspectie (4 dagen).",
      "Klein project: snoei / verpot / oogst (kies één).",
      "Evaluatie: wat volgend seizoen anders?",
    ],
  },
  {
    slug: "focus-rebuild-system",
    title: "Focus Rebuild System",
    summary: "Na afleiding of burnout: blokken terugbouwen.",
    sort_order: 6,
    oneLiner: "Diepte terugwinnen in kleine stappen",
    weekHints: [
      "3× 20 min blokken; telefoon buiten bereik.",
      "Verleng 1 blok per dag met 10 min.",
      "Audit: top 3 afleiders + één fix.",
      "Lock-in: template voor volgende 4 weken.",
    ],
  },
  {
    slug: "speed-reading-comprehension",
    title: "Speed Reading & Comprehension Protocol",
    summary: "Tempo omhoog zonder begrip te verliezen.",
    sort_order: 7,
    oneLiner: "Sneller lezen met controle op begrip",
    weekHints: [
      "Meting: woorden/min + 3 vragen begrip.",
      "Techniek week: pointer / chunking 20 min/dag.",
      "Lange tekst: samenvatting in 5 bullets.",
      "Toets: zelfde teksttype onder tijdsdruk.",
    ],
  },
  {
    slug: "decision-making-judgment",
    title: "Decision Making & Judgment Protocol",
    summary: "Frameworks, onzekerheid, trade-offs.",
    sort_order: 8,
    oneLiner: "Betere beslissingen met minder rumination",
    weekHints: [
      "Beslislog 3 dagen: besluit + uitkomst (1 regel).",
      "Eén framework (ICE / reversible) op 2 keuzes toepassen.",
      "Worst case / best case in 15 min uitwerken.",
      "Review: welk criterium ga je voortaan eerst leggen?",
    ],
  },
  {
    slug: "persuasion-influence",
    title: "Persuasion & Influence Protocol",
    summary: "Framing, empathie, ethische overtuiging.",
    sort_order: 9,
    oneLiner: "Invloed zonder manipulatie",
    weekHints: [
      "Observeer 2 gesprekken: wat werkte aan toon?",
      "Oefen: samenvatten voor je mijnen neemt.",
      "Eén moeilijk gesprek met voorbereid doel.",
      "Reflectie: eigen defaults (defensief / te soft).",
    ],
  },
  {
    slug: "emotional-control-regulation",
    title: "Emotional Control & Regulation Protocol",
    summary: "Triggers, adem, herstel na spike.",
    sort_order: 10,
    oneLiner: "Emoties eerder merken en bijsturen",
    weekHints: [
      "Signaalkaart: lichaam + gedachte bij stress.",
      "2 min adem voor moeilijke momenten (5 dagen).",
      "Na conflict: 10 min debrief zonder telefoon.",
      "Plan: wie bel je bij escalatie?",
    ],
  },
  {
    slug: "digital-productivity-workflow",
    title: "Digital Productivity & Workflow Protocol",
    summary: "Inbox, contexten, tooling minimaliseren.",
    sort_order: 11,
    oneLiner: "Minder wisselen, meer af",
    weekHints: [
      "Map: apps + notificaties + inbox sources.",
      "Één deep-work window per dag beschermen.",
      "Automatisering of template voor terugkerend werk.",
      "Review: wat schrap je definitief?",
    ],
  },
  {
    slug: "discipline-consistency",
    title: "Discipline & Consistency Protocol",
    summary: "Niet motivatie — systemen en streaks.",
    sort_order: 12,
    oneLiner: "Dagelijks minimum dat niet onderhandelbaar is",
    weekHints: [
      "Kies 1 niet-onderhandelbare gewoonte (klein).",
      "Streak 7 dagen; geen nul dagen.",
      "Obstakel analyse: waar breekt het?",
      "Volgende 30 dagen: regel + accountability.",
    ],
  },
  {
    slug: "financial-control-literacy",
    title: "Financial Control & Literacy Protocol",
    summary: "Cashflow zicht, grenzen, wekelijkse review.",
    sort_order: 13,
    oneLiner: "Rust door overzicht en grenzen",
    weekHints: [
      "Alle vaste lasten + inkomsten op één blad.",
      "Weekritme: 20 min transacties taggen.",
      "Eén besparingshefboom of schuldstap.",
      "Doel: buffer X — concrete datum.",
    ],
  },
  {
    slug: "deep-work-focus-mastery",
    title: "Deep Work & Focus Mastery Protocol",
    summary: "Diepte als vaardigheid — niet alleen tijd blokken.",
    sort_order: 14,
    oneLiner: "Langere ononderbroken output",
    weekHints: [
      "2× 50 min blokken; één taak per blok.",
      "Meet diepte: self-rating 1–10 na sessie.",
      "Elimineer grootste context switch (1 week).",
      "Plan volgende maand: diepte-budget per week.",
    ],
  },
  {
    slug: "communication-clarity-control",
    title: "Communication Clarity & Control Protocol",
    summary: "Helderheid, tempo, grenzen in gesprekken.",
    sort_order: 15,
    oneLiner: "Minder ruis, meer duidelijkheid",
    weekHints: [
      "3 gesprekken: doel vooraf in 1 zin.",
      "Oefen: ‘nee’ in 10 woorden of minder.",
      "Moeilijk mailtje: concept + verzend na 1 uur.",
      "Feedback: 1 constructief gesprek met script.",
    ],
  },
  {
    slug: "critical-thinking-reasoning",
    title: "Critical Thinking & Reasoning Protocol",
    summary: "Aannames, bronnen, conclusies testen.",
    sort_order: 16,
    oneLiner: "Minder slim klinken, meer juist redeneren",
    weekHints: [
      "Drie claims deze week: bron + zekerheid 1–5.",
      "Steel-man: sterkste tegenargument 1 pagina.",
      "Beslis met expliciete onzekerheid (interval).",
      "Checklist voor volgende grote beslissing.",
    ],
  },
  {
    slug: "memory-recall-mastery",
    title: "Memory & Recall Mastery Protocol",
    summary: "Spaced repetition + actieve recall.",
    sort_order: 17,
    oneLiner: "Onthouden wat je echt nodig hebt",
    weekHints: [
      "Kies 1 domein; 20 kaarten per dag.",
      "Leercurve loggen: fouten per sessie.",
      "Verhoog moeilijkheid of volume licht.",
      "Toets zonder materiaal 1× per week.",
    ],
  },
  {
    slug: "cooking-kitchen-mastery",
    title: "Cooking & Kitchen Mastery Protocol",
    summary: "Mise en place, messen, 4 basisrecepten.",
    sort_order: 18,
    oneLiner: "Efficiënt en lekker zonder chaos",
    weekHints: [
      "Keuken setup + messen slijpen / check.",
      "2 nieuwe recepten; timer per stap.",
      "Batch: 1 ingredient voor 3 maaltijden.",
      "Eigen ‘signature’ schaal naar 30 min.",
    ],
  },
  {
    slug: "sleep-recovery-optimization",
    title: "Sleep & Recovery Optimization Protocol",
    summary: "Ritme, licht, schermen — meetbaar beter slapen.",
    sort_order: 19,
    oneLiner: "Herstel als prestatie-factor",
    weekHints: [
      "Vaste opstaan + 7 dagen log (kwaliteit 1–5).",
      "Scherm na 21:00 beperken 5 nachten.",
      "Ochtendlicht 10 min binnen 30 min wakker.",
      "Plan: 1 aanpassing vasthouden 30 dagen.",
    ],
  },
  {
    slug: "body-language-nonverbal",
    title: "Body Language & Non-Verbal Intelligence Protocol",
    summary: "Houding, oogcontact, stemtempo.",
    sort_order: 20,
    oneLiner: "Uitstraling afstemmen op intentie",
    weekHints: [
      "Video 2 min: openingshouding + eerste zin.",
      "Spiegelen licht in 1 gesprek (niet overdrijven).",
      "Oefen: pauzes na kernzin.",
      "Feedback: vriend/collega op 1 punt.",
    ],
  },
  {
    slug: "mobility-movement-control",
    title: "Mobility & Movement Control Protocol",
    summary: "Gewrichten, houding, dagelijkse beweging.",
    sort_order: 21,
    oneLiner: "Bewegen zonder pijn door domme overload",
    weekHints: [
      "Screening: nek/schouder/heup — waar strak?",
      "10 min routine 5 dagen (video volgen mag).",
      "Loop + adem: 20 min 3× deze week.",
      "Progressie: +1 oefening volgende maand.",
    ],
  },
  {
    slug: "identity-self-mastery",
    title: "Identity & Self-Mastery Protocol",
    summary: "Waarden → gedrag → bewijs.",
    sort_order: 22,
    oneLiner: "Wie je wordt = wat je herhaalt",
    weekHints: [
      "Schrijf 3 waarden + 1 gedrag per waarde.",
      "Dagelijks bewijs loggen (1 zin).",
      "Obstakel: waar gedrag niet matcht met identiteit?",
      "Commitment: publiek / partner / journal.",
    ],
  },
  {
    slug: "leadership-team-execution",
    title: "Leadership & Team Execution Protocol",
    summary: "Delegatie, heldere verwachtingen, follow-through.",
    sort_order: 23,
    oneLiner: "Mensen laten opleveren zonder micromanagement",
    weekHints: [
      "1-op-1: doel + deadline + definitie van klaar.",
      "Board: wie wacht op wie — 1 bottleneck weg.",
      "Feedback: situatie-gedrag-impact 1×.",
      "Ritme: vaste team sync korter maken.",
    ],
  },
  {
    slug: "stress-regulation-baseline",
    title: "Stress & Regulation Baseline Protocol",
    summary: "Nervus systeem basis: adem, slaap, belasting.",
    sort_order: 24,
    oneLiner: "Van reactief naar herstel-first",
    weekHints: [
      "Stresslog: pieken + context 7 dagen.",
      "Dagelijkse downshift 5 min voor lunch.",
      "Eén commitment minder deze week.",
      "Plan: signalen die ‘stop’ betekenen.",
    ],
  },
];

const rows = CATALOG.map((c) => ({
  slug: c.slug,
  locale: "nl",
  title: c.title,
  summary: c.summary,
  sort_order: c.sort_order,
  body_md: `## ${c.title}\n\n${c.summary}\n\n${STUB_NOTE}`,
  definition: buildDefinition(c.slug, c.title, c.oneLiner, c.weekHints),
}));

const outPath = join(root, "lib", "protocols-seed-catalog.json");
writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf8");
console.log("Wrote", rows.length, "protocols to", outPath);

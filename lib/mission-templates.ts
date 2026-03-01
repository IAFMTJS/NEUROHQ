/**
 * Mission library: 100 templates met level marker en uitleg.
 * XP: 25 = weinig, 50 = normaal, 100 = veel. Bij voltooiing wordt deze base XP (× multipliers) uitbetaald.
 */

export type XpLevel = "low" | "normal" | "high";

export type MissionTemplate = {
  id: string;
  title: string;
  domain: "discipline" | "health" | "learning" | "business";
  energy: number;
  category?: "work" | "personal" | null;
  /** Base XP bij voltooiing (25=weinig, 50=normaal, 100=veel). */
  baseXP: number;
  xpLevel: XpLevel;
  /** Korte uitleg: wat betekent deze missie concreet? */
  description: string;
};

function t(
  id: string,
  title: string,
  domain: MissionTemplate["domain"],
  energy: number,
  baseXP: number,
  description: string,
  category?: "work" | "personal" | null
): MissionTemplate {
  const xpLevel: XpLevel = baseXP >= 75 ? "high" : baseXP >= 40 ? "normal" : "low";
  return { id, title, domain, energy, category: category ?? null, baseXP, xpLevel, description };
}

// Base XP: 25 = weinig, 50 = normaal, 100 = veel
const DISCIPLINE = [
  t("focus-sprint-5", "Focus Sprint 5 min", "discipline", 1, 25, "5 minuten ononderbroken aan één taak werken, geen afleiding.", null),
  t("focus-sprint-10", "Focus Sprint 10 min", "discipline", 2, 25, "10 minuten diep focussen op één ding.", null),
  t("focus-sprint-20", "Focus Sprint 20 min", "discipline", 2, 50, "20 minuten geconcentreerd werken zonder onderbreking.", null),
  t("deep-work-30", "Deep Work 30 min", "discipline", 4, 50, "Een half uur diep werk: complexe taak, geen notificaties.", null),
  t("deep-work-60", "Deep Work 60 min", "discipline", 6, 100, "Een uur ononderbroken diep werk op je belangrijkste werk.", null),
  t("hard-thing-first", "Hard Thing First", "discipline", 5, 100, "De moeilijkste of vervelendste taak van de dag als eerste doen.", null),
  t("no-distraction-block", "No Distraction Block", "discipline", 3, 50, "Afgesproken blok waarin je telefoon en afleidingen uit staan.", null),
  t("pomodoro-x2", "Pomodoro x2", "discipline", 3, 50, "Twee pomodoro’s van 25 min focus + 5 min pauze.", null),
  t("pomodoro-x4", "Pomodoro x4", "discipline", 5, 100, "Vier pomodoro’s: twee uur gestructureerd werken.", null),
  t("cold-exposure", "Cold Exposure", "discipline", 2, 50, "Korte koude prikkel (douche of buiten) om discipline te trainen.", null),
  t("early-wake-execution", "Early Wake Execution", "discipline", 3, 50, "Op de afgesproken tijd opstaan en meteen starten.", null),
  t("no-social-media-block", "No Social Media Block", "discipline", 2, 25, "Afgesproken periode geen sociale media.", null),
  t("delayed-gratification-drill", "Delayed Gratification Drill", "discipline", 3, 50, "Iets uitstellen dat je nu wilt doen, om zelfbeheersing te oefenen.", null),
  t("finish-one-ugly-task", "Finish One Ugly Task", "discipline", 5, 100, "Eén taak die je uitstelt tot het einde afmaken.", null),
  t("deadline-sprint-30", "Deadline Sprint 30 min", "discipline", 4, 50, "30 minuten tegen een duidelijke deadline werken.", null),
  t("deadline-sprint-60", "Deadline Sprint 60 min", "discipline", 6, 100, "Een uur in sprintmodus met een scherpe deadline.", null),
  t("execute-before-noon", "Execute Before Noon", "discipline", 4, 50, "De kern van je belangrijkste taak vóór 12:00 afronden.", null),
  t("focus-stack-90", "90 Min Focus Stack", "discipline", 7, 100, "90 minuten aaneengesloten focus op één project.", null),
  t("zero-multitasking-hour", "Zero Multitasking Hour", "discipline", 3, 50, "Een uur lang maar één taak, geen tab-switching.", null),
  t("silent-work-block", "Silent Work Block", "discipline", 4, 50, "Stilteblok: geen gesprekken of geluid, alleen werk.", null),
  t("execute-despite-mood", "Execute Despite Mood", "discipline", 5, 100, "De geplande actie doen ook als je geen zin hebt.", null),
  t("remove-1-distraction", "Remove 1 Distraction", "discipline", 2, 25, "Eén concrete afleiding wegnemen of uitzetten.", null),
  t("eliminate-1-time-leak", "Eliminate 1 Time Leak", "discipline", 3, 50, "Eén gewoonte die tijd weglekt bewust schrappen of vervangen.", null),
  t("consistency-check", "Consistency Check", "discipline", 2, 25, "Korte check: heb ik vandaag gedaan wat ik me voorgenomen had?", null),
  t("discipline-reflection", "Discipline Reflection", "discipline", 2, 50, "Korte reflectie: waar was ik gedisciplineerd, waar niet?", null),
];

const LEARNING = [
  t("read-10-pages", "Read 10 Pages", "learning", 2, 50, "10 pagina’s van een boek of artikel actief lezen.", null),
  t("read-20-pages", "Read 20 Pages", "learning", 4, 100, "20 pagina’s lezen en kernpunten meenemen.", null),
  t("concept-mapping", "Concept Mapping", "learning", 3, 50, "Een onderwerp uittekenen: begrippen en verbanden in een map.", null),
  t("teach-back-session", "Teach-Back Session", "learning", 4, 100, "Wat je leerde in eigen woorden uitleggen (aan jezelf of iemand).", null),
  t("code-drill-20", "Code Drill 20 min", "learning", 3, 50, "20 minuten gerichte code-oefening of -repetitie.", null),
  t("deep-research-block", "Deep Research Block", "learning", 5, 100, "Diepgaand onderzoek: meerdere bronnen, notities, conclusies.", null),
  t("structured-note-extraction", "Structured Note Extraction", "learning", 3, 50, "Gestructureerde notities maken uit een bron (schema of outline).", null),
  t("flashcard-creation", "Flashcard Creation", "learning", 2, 25, "Flashcards maken voor iets dat je wilt onthouden.", null),
  t("revision-sprint", "Revision Sprint", "learning", 4, 50, "Een blok herhaling: oude stof doornemen of oefenen.", null),
  t("apply-new-concept", "Apply New Concept", "learning", 4, 100, "Een nieuw geleerd concept toepassen in een oefening of project.", null),
  t("practice-drill", "Practice Drill", "learning", 3, 50, "Gerichte oefening op een specifieke vaardigheid.", null),
  t("summarize-chapter", "Summarize Chapter", "learning", 3, 50, "Een hoofdstuk of artikel in eigen woorden samenvatten.", null),
  t("skill-micro-practice", "Skill Micro Practice", "learning", 2, 25, "Korte, gerichte oefening op één subvaardigheid.", null),
  t("structured-review", "Structured Review", "learning", 4, 50, "Systematisch door leerstof gaan met vaste vragen of checklist.", null),
  t("test-simulation", "Test Simulation", "learning", 4, 100, "Zelf een proefexamen of test doen onder tijdsdruk.", null),
  t("memorization-drill", "Memorization Drill", "learning", 2, 25, "Korte sessie gericht op memoriseren (bijv. woorden, formules).", null),
  t("lecture-notes", "Lecture + Notes", "learning", 3, 50, "Een les of video bekijken en gestructureerde notities maken.", null),
  t("reverse-engineering-study", "Reverse Engineering Study", "learning", 5, 100, "Een voorbeeld of oplossing analyseren en terugredeneren hoe het werkt.", null),
  t("analytical-breakdown", "Analytical Breakdown", "learning", 4, 50, "Een onderwerp of probleem in delen opbreken en analyseren.", null),
  t("knowledge-audit", "Knowledge Audit", "learning", 3, 50, "Nagaan wat je al weet en waar de gaten zitten.", null),
];

const HEALTH = [
  t("walk-20", "20 Min Walk", "health", 2, 50, "20 minuten wandelen, bij voorkeur buiten.", null),
  t("walk-60", "60 Min Walk", "health", 4, 100, "Een uur wandelen voor beweging en mentale reset.", null),
  t("hiit-15", "HIIT 15 min", "health", 4, 50, "15 minuten high-intensity interval training.", null),
  t("strength-session", "Strength Session", "health", 5, 100, "Een krachtworkout (lichaamsgewicht of gewichten).", null),
  t("mobility-block", "Mobility Block", "health", 2, 25, "Bewegelijkheidsoefeningen voor gewrichten en spieren.", null),
  t("stretch-reset", "Stretch Reset", "health", 2, 25, "Rekken en strekken om spanning los te laten.", null),
  t("cold-shower", "Cold Shower", "health", 2, 50, "Koude douche (of eind koud) voor alertheid en herstel.", null),
  t("hydration-reset", "Hydration Reset", "health", 1, 25, "Ervoor zorgen dat je voldoende water drinkt.", null),
  t("sleep-discipline-night", "Sleep Discipline Night", "health", 2, 50, "Vanavond op tijd stoppen met schermen en naar bed.", null),
  t("meal-prep", "Meal Prep", "health", 4, 100, "Maaltijden of ingrediënten voorbereiden voor meerdere dagen.", null),
  t("no-sugar-day", "No Sugar Day", "health", 3, 50, "Vandaag geen toegevoegde suikers eten of drinken.", null),
  t("posture-reset", "Posture Reset", "health", 2, 25, "Houding verbeteren: zitten, staan, korte oefening.", null),
  t("breathwork-10", "Breathwork 10 min", "health", 2, 50, "10 minuten bewust ademhalen (bijv. 4-7-8 of box breathing).", null),
  t("core-activation", "Core Activation", "health", 3, 50, "Korte core-oefeningen voor stabiliteit.", null),
  t("active-recovery", "Active Recovery", "health", 2, 25, "Lichte beweging op hersteldag (wandelen, rekken).", null),
  t("morning-sunlight", "Morning Sunlight", "health", 1, 25, "In de ochtend even naar buiten voor daglicht.", null),
  t("step-goal", "Step Goal", "health", 3, 50, "Vandaag een afgesproken aantal stappen zetten.", null),
  t("low-screen-evening", "Low Screen Evening", "health", 2, 50, "’s Avonds weinig of geen schermen voor betere slaap.", null),
  t("body-scan", "Body Scan", "health", 2, 25, "Korte body scan: spanning en sensaties in je lichaam opmerken.", null),
  t("nutrition-log", "Nutrition Log", "health", 1, 25, "Bijhouden wat je eet en drinkt (zonder oordeel).", null),
];

const RECOVERY = [
  t("journal-reset", "Journal Reset", "health", 2, 50, "Korte journaling: gedachten of dag opschrijven voor helderheid.", null),
  t("energy-audit", "Energy Audit", "health", 2, 25, "Kort nagaan: wat gaf energie, wat kostte energie vandaag?", null),
  t("reflective-analysis", "Reflective Analysis", "health", 3, 50, "Reflectie op een situatie of keuze: wat gebeurde er, wat neem je mee?", null),
  t("digital-detox-1h", "Digital Detox 1h", "health", 3, 100, "Een uur geen telefoon, tablet of sociale media.", null),
  t("meditation-10", "Meditation 10 min", "health", 2, 50, "10 minuten formele meditatie of stil zitten.", null),
  t("strategic-review", "Strategic Review", "health", 4, 50, "Korte review: sluiten mijn acties nog aan op mijn doelen?", null),
  t("weekly-review", "Weekly Review", "health", 4, 100, "Wekelijkse review: wat ging goed, wat niet, wat wordt volgende week anders?", null),
  t("environment-cleanup", "Environment Cleanup", "health", 2, 25, "Werkomgeving of bureau opruimen voor rust in je hoofd.", null),
  t("brain-dump", "Brain Dump", "health", 2, 50, "Alles wat in je hoofd zit op papier zetten, zonder structuur.", null),
  t("task-prune", "Task Prune", "health", 2, 25, "Takenlijst inkorten: wat kan weg of later?", null),
  t("calendar-optimization", "Calendar Optimization", "health", 3, 50, "Agenda nakijken: blokken, buffer, realistische planning.", null),
  t("resistance-reflection", "Resistance Reflection", "health", 3, 50, "Reflectie: waar stelde ik iets uit en waarom?", null),
  t("reset-ritual", "Reset Ritual", "health", 2, 50, "Een korte vaste routine om mentaal te resetten (bijv. ademhaling, wandeling).", null),
  t("focus-reset", "Focus Reset", "health", 2, 25, "Korte pauze of oefening om focus weer op te laden.", null),
  t("emotional-check-in", "Emotional Check-in", "health", 2, 50, "Even stilstaan: hoe voel ik me nu, wat heb ik nodig?", null),
];

const PRESSURE = [
  t("non-stop-60", "60 Min Non-Stop Block", "discipline", 7, 100, "Zestig minuten doorwerken zonder pauze, tegen een duidelijke deadline.", null),
  t("public-commitment-action", "Public Commitment Action", "discipline", 5, 100, "Iets doen waarmee je jezelf publiek hebt gecommit (belofte nakomen).", null),
  t("fear-confrontation", "Fear Confrontation", "discipline", 6, 100, "Eén actie doen die je uitstelt uit angst of onzekerheid.", null),
  t("deadline-lock", "Deadline Lock", "discipline", 5, 100, "Een harde deadline zetten en ernaar werken alsof die niet schuift.", null),
  t("high-stakes-session", "High Stakes Session", "discipline", 6, 100, "Een blok werken aan iets met reële gevolgen (presentatie, gesprek, levering).", null),
  t("hard-call-first", "Hard Call First", "discipline", 5, 100, "Het moeilijkste gesprek of de moeilijkste call als eerste doen.", null),
  t("live-execution", "Live Execution", "discipline", 6, 100, "Iets uitvoeren of presenteren in een live setting (meeting, gesprek, presentatie).", null),
  t("strategic-acceleration", "Strategic Acceleration", "discipline", 5, 100, "Bewust tempo verhogen op een belangrijk project of doel.", null),
  t("zero-break-sprint", "Zero Break Sprint", "discipline", 6, 100, "Een sprint zonder pauze tot een concreet tussendoel bereikt is.", null),
  t("output-only-mode", "Output-Only Mode", "discipline", 5, 100, "Alleen output tellen: geen voorbereiding meer, alleen afmaken en leveren.", null),
];

const ALIGNMENT_FIX = [
  t("strategy-reallocation", "Strategy Reallocation", "business", 4, 100, "Tijd en aandacht herverdelen naar wat echt bij je strategie past.", null),
  t("cancel-low-value-task", "Cancel Low Value Task", "business", 3, 50, "Eén taak of afspraak schrappen die weinig bijdraagt.", null),
  t("focus-redistribution", "Focus Redistribution", "business", 4, 100, "Focus bewust verleggen naar de juiste prioriteiten.", null),
  t("domain-rebalance", "Domain Rebalance", "business", 4, 100, "Balans tussen domeinen (werk, gezondheid, leren) bijstellen.", null),
  t("priority-reset", "Priority Reset", "business", 3, 50, "Prioriteiten opnieuw bepalen en je lijst daarop afstemmen.", null),
  t("remove-one-commitment", "Remove One Commitment", "business", 3, 50, "Eén commitment of afspraak loslaten om ruimte te maken.", null),
  t("deadline-reassessment", "Deadline Reassessment", "business", 3, 50, "Deadlines nakijken en realistische nieuwe afspreken.", null),
  t("eliminate-drift", "Eliminate Drift", "business", 4, 100, "Stoppen met wat je van je doelen afbrengt en opnieuw richten.", null),
  t("phase-recalibration", "Phase Recalibration", "business", 4, 100, "Huidige fase (project, seizoen) benoemen en plannen daarop aanpassen.", null),
  t("strategic-pause", "Strategic Pause", "business", 3, 50, "Korte pauze om te checken of je nog op de juiste koers zit.", null),
];

export const MISSION_TEMPLATES: MissionTemplate[] = [
  ...DISCIPLINE,
  ...LEARNING,
  ...HEALTH,
  ...RECOVERY,
  ...PRESSURE,
  ...ALIGNMENT_FIX,
];

export type MasterMissionTemplate = MissionTemplate & {
  subcategory?:
    | "structure_micro_cleaning"
    | "structure_deep_cleaning"
    | "structure_admin"
    | "structure_planning"
    | "energy_movement"
    | "energy_recovery"
    | "energy_nervous_system"
    | "focus_attention"
    | "focus_reflection"
    | "growth_learning"
    | "growth_cognitive"
    | "pets_dog"
    | "pets_cat"
    | "pets_other"
    | "procrastination_household"
    | "procrastination_administration"
    | "procrastination_social"
    | "identity"
    | "courage"
    | "hobby_fitness"
    | "hobby_music"
    | "hobby_language"
    | "hobby_creative"
    | "weekly_reflection";
  tags?: string[];
  avoidance_tag?: "household" | "administration" | "social" | null;
  identity_tag?: "disciplined" | "fit_person" | "good_dog_owner" | "financial_control" | null;
  hobby_tag?: "fitness" | "music" | "language" | "creative" | null;
};

export const MASTER_MISSION_POOL: MasterMissionTemplate[] = [
  // Structure: Micro/Deep Cleaning, Administration, Control & Planning
  {
    id: "structure-micro-desk-reset",
    title: "Micro Cleaning: bureau reset (5 min)",
    domain: "discipline",
    energy: 2,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "Kies je bureau of een klein vlak. 5 minuten alleen opruimen en weggooien. Niet perfectioneren.",
    subcategory: "structure_micro_cleaning",
    tags: ["structure", "environment_reset", "micro_cleaning"],
  },
  {
    id: "structure-deep-room-reset",
    title: "Deep Cleaning: 15 min kernruimte",
    domain: "discipline",
    energy: 4,
    category: "personal",
    baseXP: 75,
    xpLevel: "high",
    description: "15 minuten volle focus op de ruimte waar je je het meest schaamt (woonkamer, keuken of slaapkamer).",
    subcategory: "structure_deep_cleaning",
    tags: ["structure", "environment_reset", "deep_cleaning"],
  },
  {
    id: "structure-admin-inbox-zero-15",
    title: "Admin: Inbox naar 0 (15 min)",
    domain: "business",
    energy: 3,
    category: "work",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten: e‑mail en berichten sorteren. Alleen archiveren, markeren en 2 minuten reacties.",
    subcategory: "structure_admin",
    tags: ["structure", "self_discipline"],
  },
  {
    id: "structure-week-plan-10",
    title: "Planning: week-skelet (10 min)",
    domain: "business",
    energy: 3,
    category: "work",
    baseXP: 50,
    xpLevel: "normal",
    description: "10 minuten je week grof inblokken: 3 belangrijkste missies en 1 recovery-blok.",
    subcategory: "structure_planning",
    tags: ["structure", "control_planning", "self_discipline"],
  },
  {
    id: "structure-day-block-5",
    title: "Planning: dagblok (5 min)",
    domain: "business",
    energy: 2,
    category: "work",
    baseXP: 25,
    xpLevel: "low",
    description: "5 minuten: vandaag in 3 blokken verdelen. Eén prioriteit, één recovery-moment.",
    subcategory: "structure_planning",
    tags: ["structure", "control_planning"],
  },
  {
    id: "structure-admin-3-mails",
    title: "Admin: 3 mails afhandelen",
    domain: "business",
    energy: 2,
    category: "work",
    baseXP: 25,
    xpLevel: "low",
    description: "Open 3 e-mails, beslis: beantwoorden nu, archiveren of in takenlijst. Geen eindeloos lezen.",
    subcategory: "structure_admin",
    tags: ["structure", "self_discipline"],
  },
  {
    id: "structure-micro-one-drawer",
    title: "Micro Cleaning: 1 la opruimen (5 min)",
    domain: "discipline",
    energy: 2,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "Eén lade of vak: 5 minuten opruimen. Weggooien of een vaste plek. Niet perfectioneren.",
    subcategory: "structure_micro_cleaning",
    tags: ["structure", "environment_reset", "micro_cleaning"],
  },

  // Energy: Movement, Recovery, Nervous System
  {
    id: "energy-walk-10-reset",
    title: "Movement: 10 min walk",
    domain: "health",
    energy: 2,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "10 minuten wandelen, liefst buiten. Geen telefoon, alleen ademen en kijken.",
    subcategory: "energy_movement",
    tags: ["energy", "health_body"],
  },
  {
    id: "energy-nervous-breath-5",
    title: "Nervous system: 5 min breathing",
    domain: "health",
    energy: 1,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "5 minuten rustige ademhaling (bijv. 4‑7‑8). Doel: systeem kalmeren, niet perfect uitvoeren.",
    subcategory: "energy_nervous_system",
    tags: ["energy", "health_body", "recovery"],
  },
  {
    id: "energy-recovery-reset-15",
    title: "Recovery: 15 min decompress",
    domain: "health",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten analoge decompressie (wandeling, rekken, journaling) zonder scherm.",
    subcategory: "energy_recovery",
    tags: ["energy", "health_body", "recovery"],
  },
  {
    id: "recovery-walk-10",
    title: "Recovery: 10 min wandelen",
    domain: "health",
    energy: 1,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "10 minuten rustig wandelen. Geen doel, alleen beweging en lucht.",
    subcategory: "energy_recovery",
    tags: ["energy", "health_body", "recovery"],
  },
  {
    id: "recovery-stretch-5",
    title: "Recovery: 5 min rekken",
    domain: "health",
    energy: 1,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "5 minuten zacht rekken. Schouders, rug, benen — geen prestatie.",
    subcategory: "energy_recovery",
    tags: ["energy", "health_body", "recovery"],
  },
  {
    id: "recovery-journal-10",
    title: "Recovery: 10 min journal",
    domain: "health",
    energy: 2,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "10 minuten opschrijven wat er speelt. Geen structuur, alleen ontladen.",
    subcategory: "energy_recovery",
    tags: ["energy", "health_body", "recovery"],
  },
  {
    id: "energy-morning-sunlight-5",
    title: "Morning sunlight: 5 min buiten",
    domain: "health",
    energy: 1,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "5 minuten naar buiten voor daglicht. Geen telefoon. Ondersteunt ritme en energie.",
    subcategory: "energy_movement",
    tags: ["energy", "health_body"],
  },
  {
    id: "energy-body-scan-5",
    title: "Body scan: 5 min",
    domain: "health",
    energy: 1,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "5 minuten lichaamsscan: van voeten naar hoofd spanning opmerken. Geen oordeel.",
    subcategory: "energy_nervous_system",
    tags: ["energy", "health_body", "recovery"],
  },
  {
    id: "energy-hydration-2-glasses",
    title: "Hydration: 2 glazen water",
    domain: "health",
    energy: 1,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "Drink twee glazen water met bewuste pauzes. Ondersteunt focus en energie.",
    subcategory: "energy_recovery",
    tags: ["energy", "health_body"],
  },

  // Focus: Attention Control, Reflection
  {
    id: "focus-attention-10",
    title: "Attention control: 10 min single-task",
    domain: "discipline",
    energy: 2,
    category: "work",
    baseXP: 25,
    xpLevel: "low",
    description: "Kies één taak en werk 10 minuten zonder tab‑switching of telefoon.",
    subcategory: "focus_attention",
    tags: ["focus"],
  },
  {
    id: "focus-reflection-10",
    title: "Reflection: 10 min after-action review",
    domain: "learning",
    energy: 2,
    category: "work",
    baseXP: 25,
    xpLevel: "low",
    description: "Schrijf in 10 minuten op: wat ging goed, wat ging mis, wat doe ik morgen anders?",
    subcategory: "focus_reflection",
    tags: ["focus", "growth"],
  },
  {
    id: "focus-single-task-5",
    title: "Focus: 5 min single-task",
    domain: "discipline",
    energy: 1,
    category: "work",
    baseXP: 25,
    xpLevel: "low",
    description: "Kies één taak. 5 minuten alleen daaraan. Geen tab-switch, geen telefoon.",
    subcategory: "focus_attention",
    tags: ["focus"],
  },
  {
    id: "focus-three-priorities",
    title: "Focus: 3 prioriteiten kiezen",
    domain: "business",
    energy: 2,
    category: "work",
    baseXP: 25,
    xpLevel: "low",
    description: "Schrijf in 5 minuten de 3 belangrijkste dingen voor vandaag. Eén actie per prioriteit.",
    subcategory: "focus_reflection",
    tags: ["focus", "structure"],
  },

  // Growth: Learning, Cognitive Expansion
  {
    id: "growth-learning-15",
    title: "Growth: 15 min deliberate practice",
    domain: "learning",
    energy: 3,
    category: "work",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten gericht oefenen op één micro‑skill (schrijven, code, taal, pitch).",
    subcategory: "growth_learning",
    tags: ["growth"],
  },
  {
    id: "growth-cognitive-15",
    title: "Cognitive expansion: 15 min deep reading",
    domain: "learning",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten geconcentreerd lezen + 3 bullets kerninzichten.",
    subcategory: "growth_cognitive",
    tags: ["growth"],
  },

  // Pets: Dog/Cat/Other
  {
    id: "pets-dog-presence-10",
    title: "Dog: 10 min full presence",
    domain: "health",
    energy: 2,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "10 minuten alleen met je hond (geen telefoon). Let op één teken van vertrouwen.",
    subcategory: "pets_dog",
    tags: ["pets"],
    hobby_tag: "fitness",
  },
  {
    id: "pets-cat-play-10",
    title: "Cat: 10 min active play",
    domain: "health",
    energy: 2,
    category: "personal",
    baseXP: 25,
    xpLevel: "low",
    description: "10 minuten actief spelen met je kat. Geen multitasken, alleen spel.",
    subcategory: "pets_cat",
    tags: ["pets"],
  },

  // Procrastination Attack: Household/Admin/Social
  {
    id: "procrastination-household-attack",
    title: "Procrastination Attack: huishoud‑zone 10 min",
    domain: "discipline",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "Kies de ruimte die je steeds uitstelt. 10 minuten volle focus, dan stoppen.",
    subcategory: "procrastination_household",
    tags: ["procrastination_attack", "environment_reset"],
    avoidance_tag: "household",
  },
  {
    id: "procrastination-admin-attack",
    title: "Procrastination Attack: 1 administratieve knoop",
    domain: "business",
    energy: 3,
    category: "work",
    baseXP: 50,
    xpLevel: "normal",
    description: "Pak één brief, mail of factuur die je ontwijkt, lees + beslis de eerstvolgende actie.",
    subcategory: "procrastination_administration",
    tags: ["procrastination_attack"],
    avoidance_tag: "administration",
  },
  {
    id: "procrastination-social-attack",
    title: "Procrastination Attack: 1 lastig bericht",
    domain: "discipline",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "Stuur één eerlijk bericht naar iemand die je uit de weg gaat. Geen perfectie, wel sturen.",
    subcategory: "procrastination_social",
    tags: ["procrastination_attack", "courage"],
    avoidance_tag: "social",
  },

  // Identity
  {
    id: "identity-disciplined-15",
    title: "Identity: act like a disciplined person (15 min)",
    domain: "discipline",
    energy: 3,
    category: "work",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten ononderbroken aan je belangrijkste taak. Geen uitstel, geen micro‑vlucht.",
    subcategory: "identity",
    tags: ["identity", "self_discipline"],
    identity_tag: "disciplined",
  },
  {
    id: "identity-fit-15",
    title: "Identity: prove you are a fit person (15 min)",
    domain: "health",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten bewuste beweging (wandeling, workout, mobility). Geen PR nodig.",
    subcategory: "identity",
    tags: ["identity", "health_body"],
    identity_tag: "fit_person",
  },
  {
    id: "identity-financial-10",
    title: "Identity: act financially responsible (10 min)",
    domain: "business",
    energy: 2,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "10 minuten: 1 factuur betalen of een mini‑budgetoverzicht maken.",
    subcategory: "identity",
    tags: ["identity"],
    identity_tag: "financial_control",
  },

  // Courage (social / exposure)
  {
    id: "courage-social-5",
    title: "Courage: 1 klein sociaal risico",
    domain: "discipline",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "Stuur één kwetsbaar bericht of stel één vraag die je normaal inslikt.",
    subcategory: "courage",
    tags: ["courage"],
  },

  // Hobby: Fitness/Music/Language/Creative
  {
    id: "hobby-fitness-20",
    title: "Hobby: fitness block (20 min)",
    domain: "health",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "20 minuten gerichte fitness‑sessie. Presence > intensiteit.",
    subcategory: "hobby_fitness",
    tags: ["hobby", "health_body"],
    hobby_tag: "fitness",
  },
  {
    id: "hobby-music-15",
    title: "Hobby: music practice (15 min)",
    domain: "learning",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten techniek of het lastigste stuk oefenen, zonder eindeloos herspelen.",
    subcategory: "hobby_music",
    tags: ["hobby"],
    hobby_tag: "music",
  },
  {
    id: "hobby-language-15",
    title: "Hobby: language block (15 min)",
    domain: "learning",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "15 minuten taal: luisteren, spreken of 15 nieuwe woorden stevig ankeren.",
    subcategory: "hobby_language",
    tags: ["hobby"],
    hobby_tag: "language",
  },
  {
    id: "hobby-creative-20",
    title: "Hobby: creative block (20 min)",
    domain: "learning",
    energy: 3,
    category: "personal",
    baseXP: 50,
    xpLevel: "normal",
    description: "20 minuten schrijven, tekenen, bouwen of een ander creatief project.",
    subcategory: "hobby_creative",
    tags: ["hobby", "growth"],
    hobby_tag: "creative",
  },

  // Weekly Reflection
  {
    id: "weekly-reflection-master",
    title: "Weekly reflection: 20 min",
    domain: "business",
    energy: 3,
    category: "work",
    baseXP: 75,
    xpLevel: "high",
    description:
      "20 minuten wekelijkse review: streak, energiepatronen, grootste avoidance, plannen voor volgende week en environment reset kiezen.",
    subcategory: "weekly_reflection",
    tags: ["weekly_reflection", "growth", "environment_reset"],
  },
];

/** Label for XP level (Veel XP, Normaal XP, Weinig XP). */
export function xpLevelLabel(level: XpLevel): string {
  return level === "high" ? "Veel XP" : level === "normal" ? "Normaal XP" : "Weinig XP";
}

/** Base XP for level (used when creating task from template). */
export function baseXpForLevel(level: XpLevel): number {
  return level === "high" ? 100 : level === "normal" ? 50 : 25;
}

/** Label for base_xp value (Veel XP, Normaal XP, Weinig XP). */
export function baseXpToLevelLabel(baseXp: number): string {
  return baseXp >= 75 ? "Veel XP" : baseXp >= 40 ? "Normaal XP" : "Weinig XP";
}

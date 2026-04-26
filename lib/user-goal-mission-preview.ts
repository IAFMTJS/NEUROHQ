const STEP_TEMPLATES = [
  "Kleine stap: 15 min focussen op je doel (geen afleiding).",
  "Schrijf 3 concrete acties die je doel dichterbij brengen.",
  "Plan één moment deze week om je doel te oefenen (kalender).",
  "Vraag één iemand om feedback of accountability.",
  "Evalueer: wat blokkeert je nu het meest? Eén zin.",
  "Micro-actie: 10 min research naar je doelgebied.",
  "Herhaal je kernactie van gisteren met 10% meer intensiteit.",
  "Elimineer één afleider vandaag die je doel schaadt.",
  "Combineer je doel met een bestaande routine (stacken).",
  "Meet vooruitgang: één cijfer 1–10, noteer waarom.",
  "Vergelijk: intentie vs. gedrag deze week — wat klopt niet?",
  "Stel een drempel: “als X, dan doe ik Y”.",
  "Oefen in een veilige context: kleinste versie van je skill.",
  "Reflectie: wat zou je ideale zelf nu doen?",
  "Herdefinieer succes voor deze week in één zin.",
  "Plan recovery: wat doe je als je energie laag is?",
  "Zoek één resource (video/boek) en noteer 3 takeaways.",
  "Deel je doel hardop — 30 seconden.",
  "Timer 20 min: alleen uitvoeren, geen perfectionisme.",
  "Sluit af: commit aan één actie morgen vroeg.",
];

export type UserGoalMissionRow = {
  title: string;
  due_date: string;
  notes: string;
};

export type PersonalGrowthIntensity = "light" | "normal" | "intense";

const PERSONAL_GROWTH_PRESET_AREAS = [
  "Discipline",
  "Confidence",
  "Stress/Calm",
  "Social",
  "Health",
  "Career",
] as const;

function normalizeArea(area: string | null | undefined): string | null {
  if (area == null) return null;
  const t = String(area).trim();
  if (!t) return null;
  return t.slice(0, 42);
}

function normalizeTags(tags: string[]): string[] {
  return (Array.isArray(tags) ? tags : [])
    .filter((t): t is string => typeof t === "string")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeIntensity(intensity: PersonalGrowthIntensity | null | undefined): PersonalGrowthIntensity {
  return intensity === "light" || intensity === "intense" ? intensity : "normal";
}

function normalizeHorizonDays(horizonDays: number | null | undefined): number {
  const n = typeof horizonDays === "number" ? horizonDays : Number(horizonDays);
  if (!Number.isFinite(n)) return 14;
  return Math.max(7, Math.min(28, Math.floor(n)));
}

function taskCountForIntensity(intensity: PersonalGrowthIntensity): number {
  if (intensity === "light") return 8;
  if (intensity === "intense") return 20;
  return 14;
}

function areaTemplate(area: string | null): string[] {
  const a = (area ?? "").toLowerCase();
  if (a.includes("discip")) {
    return [
      "Definieer je 1e commitment van vandaag in 1 zin.",
      "Maak je startfrictie lager: leg alles klaar voor morgen.",
      "Kill-switch: verwijder 1 afleider voor 24 uur.",
      "Timer 20 min: voer je kernactie uit, geen excuus.",
      "Evalueer: waar brak je ritme? 1 micro-fix.",
      "Plan 1 harde afspraak in je agenda voor je doel.",
      "Herhaal kernactie met 10% meer intensiteit.",
      "Sluit af: schrijf 1 regel ‘wat werkte’ + 1 volgende stap.",
    ];
  }
  if (a.includes("confid") || a.includes("zelf")) {
    return [
      "Micro-courage: doe 1 klein ding dat je normaal uitstelt.",
      "Schrijf 3 bewijzen dat je dit al eens kon.",
      "Oefen 2 minuten hardop je ‘ik ben’-zin (identity).",
      "Vraag 1 kleine feedback aan iemand veilig.",
      "Herframe: wat is de kleinste ‘win’ vandaag?",
      "Exposure-lite: 1 actie met lichte spanning, wél uitvoeren.",
      "Noteer 1 zin: wat je volgende keer anders zegt/doet.",
      "Sluit af: benoem 1 vaardigheid die groeit door dit te doen.",
    ];
  }
  if (a.includes("stress") || a.includes("calm") || a.includes("rust")) {
    return [
      "Check-in: energie 1–10 + 1 woord voor je staat.",
      "Adem 3 minuten: langzaam uit, schouders los.",
      "Plan recovery: 1 herstelblok van 20 min vandaag.",
      "Identificeer 1 stress-trigger + 1 alternatieve respons.",
      "Verlaag load: verwijder 1 taak of maak hem kleiner.",
      "Hydrate + reset: water + 2 minuten wandelen.",
      "Boundary: zeg 1 keer ‘nee’ of ‘later’ met 1 zin.",
      "Reflectie: wat gaf vandaag echt rust (1 zin).",
    ];
  }
  if (a.includes("social") || a.includes("relat")) {
    return [
      "Stuur 1 kort bericht naar iemand (laag drempel).",
      "Plan 1 moment deze week: koffie / call / wandeling.",
      "Luister-actie: stel 2 vragen, geen advies.",
      "Oefen ‘openen’: deel 1 eerlijk detail (klein).",
      "Repair: maak 1 mini-herstel (sorry/clarify).",
      "Feedback: vraag 1 iemand wat jij goed doet sociaal.",
      "Exposure: start 1 gesprek (kort, vriendelijk).",
      "Reflectie: welke actie gaf de meeste verbinding?",
    ];
  }
  if (a.includes("health") || a.includes("gezond")) {
    return [
      "Plan: kies 1 gezonde default maaltijd/snack vandaag.",
      "Beweeg 20 min (wandelen is oké).",
      "Slaap: kies je ‘shutdown tijd’ en zet 1 alarm.",
      "Water + eiwit: maak het je makkelijk (voorbereiden).",
      "Elimineer 1 sabotage-factor voor 24 uur.",
      "Kleine kracht: 10 min basisoefeningen.",
      "Herhaal: doe je kernactie opnieuw met 10% meer aandacht.",
      "Reflectie: wat had het grootste effect op je energie?",
    ];
  }
  if (a.includes("career") || a.includes("werk")) {
    return [
      "Kies 1 leverage-task: wat maakt morgen makkelijker?",
      "Timer 25 min: werk aan je skill of project (diepte).",
      "Maak 1 zichtbaar output artefact (doc, note, mail).",
      "Vraag 1 iemand om input/feedback op je work-in-progress.",
      "Scherp je aanbod: 1 zin ‘wat lever ik’ opschrijven.",
      "Verwijder 1 blocker: regel toegang/afspraak/next step.",
      "Herhaal deep-work blok met 10% meer scherpte.",
      "Reflectie: wat was je hoogste ROI actie vandaag?",
    ];
  }
  return STEP_TEMPLATES;
}

export function getPersonalGrowthAreaPresets(): string[] {
  return [...PERSONAL_GROWTH_PRESET_AREAS];
}

/** Deterministic preview for Personal Growth hub (no DB writes). */
export function buildPersonalGrowthMissionPreview(params: {
  area: string | null;
  goal: string;
  tags: string[];
  intensity: PersonalGrowthIntensity;
  horizonDays: number;
}): UserGoalMissionRow[] {
  const trimmedGoal = params.goal.trim();
  if (trimmedGoal.length < 8) throw new Error("Beschrijf je doel in minstens 8 tekens.");

  const area = normalizeArea(params.area);
  const intensity = normalizeIntensity(params.intensity);
  const horizonDays = normalizeHorizonDays(params.horizonDays);
  const tags = normalizeTags(params.tags);

  const count = taskCountForIntensity(intensity);
  const templates = areaTemplate(area);

  const base = new Date();
  const tagLine = tags.length ? ` Tags: ${tags.join(", ")}.` : "";
  const areaLine = area ? ` Area: ${area}.` : "";
  const metaLine = ` Intensity: ${intensity}. Horizon: ${horizonDays}d.`;

  const rows: UserGoalMissionRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const title = templates[i % templates.length] ?? STEP_TEMPLATES[i % STEP_TEMPLATES.length]!;
    const dayOffset = Math.min(horizonDays - 1, Math.floor((i * horizonDays) / count));
    const d = new Date(base);
    d.setDate(d.getDate() + dayOffset);
    rows.push({
      title,
      due_date: d.toISOString().slice(0, 10),
      notes: `Doel: ${trimmedGoal.slice(0, 400)}.${areaLine}${metaLine}${tagLine}`,
    });
  }
  return rows;
}

/** Deterministic preview (no DB writes). */
export function buildUserGoalMissionPreview(goal: string, tags: string[]): UserGoalMissionRow[] {
  const trimmed = goal.trim();
  if (trimmed.length < 8) throw new Error("Beschrijf je doel in minstens 8 tekens.");
  const tagLine = tags.length ? ` Tags: ${tags.slice(0, 12).join(", ")}.` : "";
  const base = new Date();
  return STEP_TEMPLATES.map((title, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + Math.floor(i / 4));
    return {
      title,
      due_date: d.toISOString().slice(0, 10),
      notes: `Doel: ${trimmed.slice(0, 400)}${tagLine}`,
    };
  });
}

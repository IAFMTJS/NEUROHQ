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

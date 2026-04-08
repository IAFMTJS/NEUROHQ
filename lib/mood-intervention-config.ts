/** Mood + intervention copy, quick actions, and UI labels (NL). */

export type MoodLabel =
  | "overwhelmed"
  | "tired"
  | "low"
  | "sick"
  | "physical"
  | "hyperfocus"
  | "hyperactive"
  | "drained_ok"
  | "lazy"
  | "sunny"
  | "introverted_day"
  | "extroverted_day"
  | "calm"
  | "focused"
  | "motivated"
  | "proud"
  | "joyful"
  | "good";

export type MoodTriggerId =
  | "idle_streak"
  | "late_night_active"
  | "long_active_session"
  | "task_chaos"
  | "many_incomplete"
  | "activity_drop"
  | "low_physical_score"
  | "focus_flow"
  | "comeback_day"
  | "steady_consistency";

export type MoodInterventionPersist = {
  lastToastDate?: string | null;
  lastTriggerId?: string | null;
  /** Shift late-night detection earlier (minutes), capped server-side. */
  lateNightBiasMinutes?: number;
};

export const MOOD_LABEL_META: Record<
  MoodLabel,
  { emoji: string; label: string; description: string }
> = {
  overwhelmed: { emoji: "😵", label: "Overweldigd", description: "Te veel tegelijk" },
  tired: { emoji: "😴", label: "Moe / oververmoeid", description: "Lichaam vraagt rust" },
  low: { emoji: "😔", label: "Mentaal laag", description: "Dipje, leegte" },
  sick: { emoji: "🤒", label: "Ziek / uitgeput", description: "Even gas terug" },
  physical: { emoji: "🩹", label: "Lichamelijk last", description: "Lichaam zit dwars" },
  hyperfocus: { emoji: "🧠", label: "Hyperfocus", description: "Tunnelvisie met hoge output" },
  hyperactive: { emoji: "⚡", label: "Hyperactief", description: "Veel energie, snel schakelen" },
  drained_ok: { emoji: "🙂", label: "Leeg maar oké", description: "Moe, maar nog stabiel" },
  lazy: { emoji: "🛋️", label: "Lui", description: "Lage actiestart, weinig zin" },
  sunny: { emoji: "🌞", label: "Sunny", description: "Licht, positief en open" },
  introverted_day: { emoji: "🌙", label: "Introverte dag", description: "Naar binnen gericht, stilte nodig" },
  extroverted_day: { emoji: "🎉", label: "Extroverte dag", description: "Naar buiten gericht, sociale drive" },
  calm: { emoji: "😌", label: "Kalm", description: "Rustig en stabiel" },
  focused: { emoji: "🎯", label: "Gefocust", description: "Scherp op uitvoering" },
  motivated: { emoji: "🔥", label: "Gemotiveerd", description: "Drive en zin om te bouwen" },
  proud: { emoji: "🏅", label: "Trots", description: "Erkenning van vooruitgang" },
  joyful: { emoji: "✨", label: "Blij", description: "Lichte, positieve energie" },
  good: { emoji: "💪", label: "Goed", description: "Redelijk oké" },
};

export const TOAST_TITLES = ["Even eerlijk", "Stop even", "Je zit niet lekker"] as const;

export type QuickAction = { id: string; taskTitle: string; label: string };

/** One-tap recovery tasks per mood (Dutch titles). */
export const MOOD_QUICK_ACTIONS: Record<Exclude<MoodLabel, "good">, QuickAction[]> = {
  overwhelmed: [
    { id: "o1", label: "10 min niets doen", taskTitle: "10 minuten bewust niets doen (timer)" },
    { id: "o2", label: "1 simpele taak kiezen", taskTitle: "Eén simpele taak kiezen en alleen die doen" },
    { id: "o3", label: "Rustige muziek (headset)", taskTitle: "10 min rustige muziek op headset" },
  ],
  tired: [
    { id: "t1", label: "Powernap plannen", taskTitle: "15–20 min powernap inplannen" },
    { id: "t2", label: "Vroeg slapen", taskTitle: "Vandaag vroeg naar bed (vast tijdstip)" },
    { id: "t3", label: "Scherm uit 30 min", taskTitle: "Scherm uit binnen 30 minuten" },
  ],
  low: [
    { id: "l1", label: "Feel-good film", taskTitle: "Leuke feel-good film kijken (1 blok)" },
    { id: "l2", label: "Iemand een bericht", taskTitle: "Iemand een kort bericht sturen" },
    { id: "l3", label: "Even naar buiten", taskTitle: "10 min naar buiten, zonder doel" },
  ],
  sick: [
    { id: "s1", label: "Soep maken & eten", taskTitle: "Verse soep maken en rustig opeten" },
    { id: "s2", label: "Lichaam rust", taskTitle: "Lichaam vandaag rust geven (geen push)" },
    { id: "s3", label: "Op tijd slapen", taskTitle: "Op tijd naar bed (herstel)" },
  ],
  physical: [
    { id: "p1", label: "Warme douche", taskTitle: "Warme douche of bad (15 min)" },
    { id: "p2", label: "Soep / warm", taskTitle: "Warme maaltijd/soep voor jezelf" },
    { id: "p3", label: "Stretch 5 min", taskTitle: "5 min zachte stretching" },
  ],
  hyperfocus: [
    { id: "hf1", label: "Focusgrens zetten", taskTitle: "Nog 1 focusblok, daarna bewuste stop met pauze" },
    { id: "hf2", label: "Hydratie + reset", taskTitle: "Water + 5 min fysieke reset vóór doorgaan" },
    { id: "hf3", label: "Scope bewaken", taskTitle: "Scope check: alleen topprioriteit afmaken" },
  ],
  hyperactive: [
    { id: "ha1", label: "Energie kanaliseren", taskTitle: "10 min energie dump (wandelen) en dan 1 taak kiezen" },
    { id: "ha2", label: "Korte sprint", taskTitle: "12 min sprint op één taak zonder wisselen" },
    { id: "ha3", label: "Prikkelreductie", taskTitle: "Notificaties 30 min uit voor rust in je hoofd" },
  ],
  drained_ok: [
    { id: "do1", label: "Lichte taak", taskTitle: "Kies 1 lichte taak die je wel kunt afronden" },
    { id: "do2", label: "Microherstel", taskTitle: "7 min microherstel (ogen dicht / rustig zitten)" },
    { id: "do3", label: "Afsluitplan", taskTitle: "Maak een klein afsluitplan voor vanavond" },
  ],
  lazy: [
    { id: "lz1", label: "2-min start", taskTitle: "Start met 2 minuten aan de kleinste stap" },
    { id: "lz2", label: "Omgeving reset", taskTitle: "Werkplek 5 minuten opruimen voor activatie" },
    { id: "lz3", label: "Easy win", taskTitle: "Eén makkelijke win pakken en meteen afronden" },
  ],
  sunny: [
    { id: "sn1", label: "Positieve energie", taskTitle: "Gebruik je goede vibe voor 1 impacttaak" },
    { id: "sn2", label: "Buitenmoment", taskTitle: "Korte buitenlucht-break om energie stabiel te houden" },
    { id: "sn3", label: "Iets delen", taskTitle: "Deel een positieve update met iemand" },
  ],
  introverted_day: [
    { id: "id1", label: "Silent blok", taskTitle: "20 min silent werkblok zonder sociale prikkels" },
    { id: "id2", label: "Grenzen zetten", taskTitle: "Plan 1 grens voor bereikbaarheid vandaag" },
    { id: "id3", label: "Rustige recharge", taskTitle: "10 min rustige recharge (muziek, lezen, adem)" },
  ],
  extroverted_day: [
    { id: "ed1", label: "Sociale taak", taskTitle: "Pak een taak met korte samenwerking of afstemming" },
    { id: "ed2", label: "Constructieve check-in", taskTitle: "Stuur één constructieve check-in naar iemand" },
    { id: "ed3", label: "Energie borgen", taskTitle: "Plan een korte solo-reset na sociaal blok" },
  ],
  calm: [
    { id: "c1", label: "Kalmte vasthouden", taskTitle: "10 min rustig doorwerken zonder afleiding" },
    { id: "c2", label: "Ademreset", taskTitle: "3 min ademhaling + 1 duidelijke intentie voor nu" },
    { id: "c3", label: "Rustige wandeling", taskTitle: "10 min rustige wandeling om helder te blijven" },
  ],
  focused: [
    { id: "f1", label: "1 deep-focus blok", taskTitle: "Eén deep-focus blok van 25 min afronden" },
    { id: "f2", label: "Topprioriteit afronden", taskTitle: "Belangrijkste taak van vandaag volledig afmaken" },
    { id: "f3", label: "Context reset", taskTitle: "Werkplek 5 min resetten voor focusbehoud" },
  ],
  motivated: [
    { id: "m1", label: "Momentumtaak", taskTitle: "Momentum gebruiken: 1 extra taak met impact afronden" },
    { id: "m2", label: "Korte sprint", taskTitle: "15 min sprint op een uitdagende taak starten" },
    { id: "m3", label: "Plan next move", taskTitle: "Volgende 2 acties uitschrijven om flow te behouden" },
  ],
  proud: [
    { id: "pr1", label: "Win loggen", taskTitle: "Vandaagse win kort loggen in notities" },
    { id: "pr2", label: "Kennis delen", taskTitle: "Een behaalde les of inzicht delen met iemand" },
    { id: "pr3", label: "Volgende mijlpaal", taskTitle: "Kleine volgende mijlpaal kiezen en inplannen" },
  ],
  joyful: [
    { id: "j1", label: "Positieve break", taskTitle: "Korte positieve break (muziek of buitenlucht)" },
    { id: "j2", label: "Energie richten", taskTitle: "Positieve energie richten op 1 nuttige taak" },
    { id: "j3", label: "Dankbaar moment", taskTitle: "1 minuut dankbaarheid + 1 gerichte actie nu" },
  ],
};

/** Maps engine trigger → mood kind + body line (question). */
export const TRIGGER_COPY: Record<
  MoodTriggerId,
  { mood: Exclude<MoodLabel, "good">; body: string }
> = {
  idle_streak: { mood: "sick", body: "Zijn je dagen stil? Ziek of helemaal leeg?" },
  late_night_active: { mood: "tired", body: "Ben je gewoon kapot moe?" },
  long_active_session: { mood: "tired", body: "Ben je gewoon kapot moe?" },
  task_chaos: { mood: "overwhelmed", body: "Ben je overweldigd?" },
  many_incomplete: { mood: "overwhelmed", body: "Je gedrag ziet er rommelig uit. Even checken." },
  activity_drop: { mood: "low", body: "Zit je mentaal laag?" },
  low_physical_score: { mood: "physical", body: "Voelt je lichaam slecht?" },
  focus_flow: { mood: "focused", body: "Je lijkt scherp in flow. Klopt dat?" },
  comeback_day: { mood: "motivated", body: "Sterke comeback vandaag. Voelt het gemotiveerd?" },
  steady_consistency: { mood: "proud", body: "Je bent stabiel bezig. Voelt dat als trots?" },
};

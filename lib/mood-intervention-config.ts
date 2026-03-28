/** Mood + intervention copy, quick actions, and UI labels (NL). */

export type MoodLabel = "overwhelmed" | "tired" | "low" | "sick" | "physical" | "good";

export type MoodTriggerId =
  | "idle_streak"
  | "late_night_active"
  | "long_active_session"
  | "task_chaos"
  | "many_incomplete"
  | "activity_drop"
  | "low_physical_score";

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
};

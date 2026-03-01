/**
 * Re-engagement copy for push/email and in-app (Recovery Campaign).
 * Use same messaging so users see consistent benefit-focused nudges.
 *
 * Scenarios:
 * - mild: 3–6 dagen inactief → zachte, lage-druk nudge.
 * - recovery: 7+ dagen inactief → Recovery Campaign framing.
 * - level_gap: weinig XP naar volgend level → opportunity framing.
 */

const DEFAULT_XP_AT_RISK = 70;

export type ReEngagementScenario = "mild" | "recovery" | "level_gap";

export type ReEngagementContext = {
  /** Aantal dagen sinds laatste completion (afgerond naar beneden). */
  daysInactive: number;
  /** XP nodig naar volgend level. */
  xpToNextLevel: number;
  /** Huidige streak-lengte (optioneel, voor copy-tuning). */
  currentStreak?: number | null;
};

export type ReEngagementPushPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
};

/**
 * Body text for re-engagement: concrete XP benefit if they complete at least one mission.
 * Used in push notifications and can be used in email templates.
 */
export function getReEngagementBody(xpAtRisk: number = DEFAULT_XP_AT_RISK): string {
  return `Je mist ongeveer ${xpAtRisk} XP als je vandaag geen enkele missie afrondt. Eén kleine missie is genoeg om het patroon te doorbreken.`;
}

/** Choose scenario based on behaviour signals (daysInactive + XP gap). */
export function pickReEngagementScenario(ctx: ReEngagementContext): ReEngagementScenario | null {
  const { daysInactive, xpToNextLevel } = ctx;

  // Hard recovery: 7+ dagen volledig inactief.
  if (daysInactive >= 7) return "recovery";

  // Level-gap: dichtbij level up én (licht) inactief.
  if (xpToNextLevel > 0 && xpToNextLevel <= 150 && daysInactive >= 1 && daysInactive <= 7) {
    return "level_gap";
  }

  // Mild: eerste dagen van inactiviteit (3–6).
  if (daysInactive >= 3) return "mild";

  return null;
}

/** Scenario-based push payload (behaviour, not channel, specific). */
export function getReEngagementPushPayloadForScenario(
  scenario: ReEngagementScenario,
  ctx: ReEngagementContext
): ReEngagementPushPayload {
  const { daysInactive, xpToNextLevel, currentStreak } = ctx;

  if (scenario === "level_gap") {
    const xp = Math.max(1, Math.round(xpToNextLevel));
    return {
      title: "NEUROHQ — Dicht bij level up",
      body: `Je mist nog ${xp} XP naar je volgende level. Eén missie vandaag is genoeg om daar heel dicht bij te komen.`,
      tag: "re-engagement-level-gap",
      url: "/xp",
    };
  }

  if (scenario === "recovery") {
    const xpAtRisk = DEFAULT_XP_AT_RISK * 2;
    const streakPart =
      typeof currentStreak === "number" && currentStreak > 0
        ? ` Je vorige streak van ${currentStreak} dagen ligt niet ver achter je.`
        : "";
    return {
      title: "NEUROHQ — Recovery Campaign",
      body: `Je was ${daysInactive}+ dagen niet actief. Start vandaag met 1–3 micro-missies (2–5 minuten) om je momentum rustig te herstellen.${streakPart}`,
      tag: "re-engagement-recovery",
      url: "/tasks?add=today",
    };
  }

  // Default: mild scenario
  const xpAtRisk = DEFAULT_XP_AT_RISK;
  return {
    title: "NEUROHQ — Kleine missie vandaag",
    body: `Je bent een paar dagen minder actief geweest. Eén kleine missie vandaag houdt je streak warm en levert je ~${xpAtRisk} XP op.`,
    tag: "re-engagement-mild",
    url: "/tasks",
  };
}

/** E-mail onderwerp per scenario (kan gedeeld worden door push + mail). */
export function getReEngagementEmailSubject(
  scenario: ReEngagementScenario,
  ctx: ReEngagementContext
): string {
  const { daysInactive, xpToNextLevel } = ctx;

  if (scenario === "level_gap") {
    const xp = Math.max(1, Math.round(xpToNextLevel));
    return `Nog ${xp} XP tot je volgende level`;
  }

  if (scenario === "recovery") {
    return `Recovery Campaign · ${daysInactive}+ dagen pauze`;
  }

  return "Kleine missie vandaag om je streak warm te houden";
}

/** E-mail body per scenario. Plain‑text; kan in HTML‑template worden gewrapt. */
export function getReEngagementEmailBody(
  scenario: ReEngagementScenario,
  ctx: ReEngagementContext
): string {
  const { daysInactive, xpToNextLevel, currentStreak } = ctx;

  if (scenario === "level_gap") {
    const xp = Math.max(1, Math.round(xpToNextLevel));
    return [
      `Je zit dicht bij een level‑up in NEUROHQ.`,
      ``,
      `Nog ${xp} XP en je unlockt je volgende level. Eén gefocuste missie vandaag brengt je ernaartoe.`,
      ``,
      `Open de Missions‑pagina, kies één missie van 5–15 minuten en rond die vandaag af.`,
    ].join("\n");
  }

  if (scenario === "recovery") {
    const streakLine =
      typeof currentStreak === "number" && currentStreak > 0
        ? `Je eerdere streak van ${currentStreak} dagen is niet verloren; je bouwt gewoon opnieuw op.`
        : "Je hoeft niets in te halen; je bouwt vanaf vandaag opnieuw op.";
    return [
      `Je was ${daysInactive}+ dagen niet actief in NEUROHQ.`,
      ``,
      `Dit is geen oordeel, wel een uitnodiging: start vandaag met 1–3 micro‑missies (2–5 minuten) om je momentum rustig te herstellen.`,
      streakLine,
      ``,
      `Kies bijvoorbeeld één heel kleine missie (boodschappenlijst, korte mail, 5 minuten opruimen) en markeer die vandaag als voltooid.`,
    ].join("\n");
  }

  // mild
  return [
    `Je was een paar dagen minder actief in NEUROHQ.`,
    ``,
    `Eén kleine missie vandaag is genoeg om je streak warm te houden en weer in de flow te komen.`,
    ``,
    `Open de app, kies één missie die binnen 5–10 minuten kan, en rond die vandaag af.`,
  ].join("\n");
}

/**
 * Legacy helper: generic re-engagement payload based on XP-at-risk.
 * Kept for compatibility; delegates to mild scenario.
 */
export function getReEngagementPushPayload(xpAtRisk: number = DEFAULT_XP_AT_RISK): ReEngagementPushPayload {
  return {
    title: "NEUROHQ — Mis je XP niet",
    body: getReEngagementBody(xpAtRisk),
    tag: "re-engagement",
    url: "/tasks",
  };
}

/**
 * Applies notification personality to ALL push notifications (quote, calendar, morning, evening, weekly learning, behavioral).
 * Ensures title and body match the user's chosen mode: Stoic (short, wisdom), Friendly (warm), Coach (direct, action),
 * Drill (sharp, commanding), Chaos (sarcastic/overstimulating), Auto (adaptive).
 */

import type { PushPayload } from "@/lib/push";
import type { PersonalityMode } from "@/lib/behavioral-notifications";

export type PushContext =
  | "quote"
  | "calendar_morning"
  | "calendar_reminder"
  | "morning"
  | "evening"
  | "weekly_learning"
  | "freeze_reminder"
  | "avoidance_alert"
  | "savings_alert"
  | "generic";

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Rewrite a push payload's title (and optionally body) so it matches the user's notification personality.
 * Used for quote, calendar, morning, evening, weekly learning — i.e. all non-behavioral pushes.
 */
export function applyPersonalityToPayload(
  payload: PushPayload,
  personalityMode: PersonalityMode,
  context: PushContext
): PushPayload {
  const title = payload.title ?? "NEUROHQ";
  const body = payload.body ?? "";

  switch (context) {
    case "quote": {
      // Body is the quote text; we only change the title to set the tone.
      const titles: Record<PersonalityMode, string[]> = {
        stoic: ["Focus.", "Awareness.", "One thought."],
        friendly: ["Your daily nudge 💛", "A thought for you", "Good morning — here's your quote"],
        coach: ["Daily focus", "One line to set the tone", "Quote of the day"],
        drill: ["Read. Then move.", "Daily brief.", "Focus — then execute."],
        chaos: ["THE DAILY WISDOM BOMB", "Your quote. Or ignore it.", "RANDOM QUOTE INCOMING"],
        auto: ["NEUROHQ", "Daily focus", "NEUROHQ"],
      };
      const options = titles[personalityMode] ?? titles.auto;
      return { ...payload, title: randomFrom(options), body: body || payload.body };
    }

    case "calendar_morning": {
      // "Heads up: X today" style — body lists events.
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Today.",
        friendly: "What's on today 💛",
        coach: "Today's schedule",
        drill: "Today. Be there.",
        chaos: "CALENDAR ALERT 📅",
        auto: "NEUROHQ — Today",
      };
      const bodyTemplates: Record<PersonalityMode, (s: string) => string> = {
        stoic: (s) => s,
        friendly: (s) => `${s} — you've got this.`,
        coach: (s) => `${s}. Plan your blocks.`,
        drill: (s) => s,
        chaos: (s) => `${s} ← DON'T FORGET.`,
        auto: (s) => s,
      };
      const t = bodyTemplates[personalityMode] ?? bodyTemplates.auto;
      return {
        ...payload,
        title: titleByPersonality[personalityMode] ?? titleByPersonality.auto,
        body: t(body),
      };
    }

    case "calendar_reminder": {
      // "Starting soon: X" — event starting in next hour.
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Soon.",
        friendly: "Starting soon 💛",
        coach: "Up next",
        drill: "Event. Now.",
        chaos: "ALERT: STARTING SOON ⏰",
        auto: "NEUROHQ — Calendar",
      };
      const bodyTemplates: Record<PersonalityMode, (s: string) => string> = {
        stoic: (s) => s,
        friendly: (s) => `Starting soon: ${s}. You're on it.`,
        coach: (s) => `${s} — time to switch context.`,
        drill: (s) => s,
        chaos: (s) => `${s} ← MOVE IT.`,
        auto: (s) => s,
      };
      const t = bodyTemplates[personalityMode] ?? bodyTemplates.auto;
      return {
        ...payload,
        title: titleByPersonality[personalityMode] ?? titleByPersonality.auto,
        body: t(body),
      };
    }

    case "morning": {
      // Morning reminder: missions count, brain status nudge.
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Morning.",
        friendly: "Good morning! 💛",
        coach: "Morning brief",
        drill: "Up. Missions waiting.",
        chaos: "SYSTEM ONLINE. MISSIONS LOADED.",
        auto: "NEUROHQ — Morning",
      };
      // Body is already built (e.g. "Good morning. N mission(s) ready..."). Re-wrap by personality.
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/^Good morning\.?\s*/i, "").replace(/ Set your brain status first\.?/i, ". Set brain status.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/^Good morning\.?\s*/i, "Morning. ").replace(/ Set your brain status first\.?/i, " Set brain status, then pick one.") || b,
        drill: (b) => b.replace(/^Good morning\.?\s*/i, "").replace(/ mission\(s\)/i, " missions").replace(/ Set your brain status first\.?/i, " Log brain status.") || b,
        chaos: (b) => b.toUpperCase().replace(/ GOOD MORNING\.?/i, ""),
        auto: (b) => b,
      };
      const fn = bodyByPersonality[personalityMode] ?? bodyByPersonality.auto;
      return {
        ...payload,
        title: titleByPersonality[personalityMode] ?? titleByPersonality.auto,
        body: fn(body),
      };
    }

    case "evening": {
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Evening.",
        friendly: "Evening check-in 💛",
        coach: "Evening brief",
        drill: "Day's end. Log it.",
        chaos: "EVENING AUDIT 📊",
        auto: "NEUROHQ — Evening",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/Evening check-in:?/gi, "Summary:").replace(/Quick check-in before bed\?/i, "Log if you can.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/Quick check-in before bed\?/i, "Quick log before bed?").replace(/ — /g, ". ") || b,
        drill: (b) => b.replace(/Evening check-in:?/gi, "Report:").replace(/\?/g, ".") || b,
        chaos: (b) => b.replace(/evening/gi, "EVENING").replace(/check-in/gi, "CHECK-IN") || b,
        auto: (b) => b,
      };
      const fn = bodyByPersonality[personalityMode] ?? bodyByPersonality.auto;
      return {
        ...payload,
        title: titleByPersonality[personalityMode] ?? titleByPersonality.auto,
        body: fn(body),
      };
    }

    case "weekly_learning": {
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Learning.",
        friendly: "Weekly learning 💛",
        coach: "Learning recap",
        drill: "Learning report. Plan next.",
        chaos: "WEEKLY LEARNING STATS 📚",
        auto: "NEUROHQ — Learning",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/Last week:?/i, "").replace(/Plan a learning block this week\.?/i, "Plan a block.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/Plan a learning block this week\.?/i, "Schedule one learning block this week.") || b,
        drill: (b) => b.replace(/\. /g, ". ").replace(/Plan a learning block this week\.?/i, "Block time this week.") || b,
        chaos: (b) => b.toUpperCase(),
        auto: (b) => b,
      };
      const fn = bodyByPersonality[personalityMode] ?? bodyByPersonality.auto;
      return {
        ...payload,
        title: titleByPersonality[personalityMode] ?? titleByPersonality.auto,
        body: fn(body),
      };
    }

    case "freeze_reminder": {
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Frozen purchase.",
        friendly: "Frozen purchase ready 💛",
        coach: "Frozen purchase — confirm or cancel",
        drill: "Frozen purchase. Confirm or cancel.",
        chaos: "FROZEN PURCHASE PENDING ⏸️",
        auto: "NEUROHQ — Frozen purchase",
      };
      return { ...payload, title: titleByPersonality[personalityMode] ?? titleByPersonality.auto };
    }

    case "avoidance_alert": {
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Carry-over.",
        friendly: "Tasks carried over — pick one when you're ready 💛",
        coach: "Carried-over tasks: pick one to focus on.",
        drill: "Carry-over. Pick one. Now.",
        chaos: "CARRY-OVER ALERT 📋",
        auto: "NEUROHQ",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b,
        friendly: (b) => b,
        coach: (b) => b,
        drill: (b) => b.replace(/Pick one to focus on\.?/i, "Pick one. Execute.") || b,
        chaos: (b) => b.toUpperCase(),
        auto: (b) => b,
      };
      const fn = bodyByPersonality[personalityMode] ?? bodyByPersonality.auto;
      return {
        ...payload,
        title: titleByPersonality[personalityMode] ?? titleByPersonality.auto,
        body: fn(body),
      };
    }

    case "savings_alert": {
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Savings.",
        friendly: "Savings goal reminder 💛",
        coach: "Savings goal — check progress.",
        drill: "Savings. Deadline ahead.",
        chaos: "SAVINGS ALERT 💰",
        auto: "NEUROHQ — Savings",
      };
      return { ...payload, title: titleByPersonality[personalityMode] ?? titleByPersonality.auto };
    }

    default:
      return payload;
  }
}

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

/** Chaos: pick randomly from multiple extreme variants so it feels unpredictable. */
function chaosTitle(titles: string[]): string {
  return randomFrom(titles);
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
      const titles: Record<PersonalityMode, string[]> = {
        stoic: ["Focus.", "Awareness.", "One thought.", "—"],
        friendly: ["Your daily nudge 💛", "A thought for you", "Good morning — here's your quote"],
        coach: ["Daily focus", "One line to set the tone", "Quote of the day"],
        drill: ["Read. Then move.", "Daily brief.", "Focus — then execute. No excuses."],
        chaos: [
          "⚠️ WISDOM INCOMING ⚠️",
          "RANDOM QUOTE. TAKE IT OR LEAVE IT.",
          "THE UNIVERSE SAID THIS. IDK.",
          "QUOTE O' THE DAY (YES REALLY)",
          "INCOMING: ONE (1) THOUGHT 💥",
          "YOUR DAILY DOSE OF ???",
        ],
        auto: ["NEUROHQ", "Daily focus", "NEUROHQ"],
      };
      const options = titles[personalityMode] ?? titles.auto;
      return { ...payload, title: randomFrom(options), body: body || payload.body };
    }

    case "calendar_morning": {
      const chaosTitles = [
        "📅 CALENDAR. YOU HAVE THINGS. SHOCKING.",
        "EVENTS TODAY. DON'T SAY WE DIDN'T WARN YOU.",
        "⚠️ TODAY'S LINEUP ⚠️",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Today.",
        friendly: "What's on today 💛",
        coach: "Today's schedule",
        drill: "Today. Be there. No skip.",
        chaos: chaosTitle(chaosTitles),
        auto: "NEUROHQ — Today",
      };
      const bodyTemplates: Record<PersonalityMode, (s: string) => string> = {
        stoic: (s) => s,
        friendly: (s) => `${s} — you've got this.`,
        coach: (s) => `${s}. Plan your blocks.`,
        drill: (s) => s,
        chaos: (s) => randomFrom([
          `${s.toUpperCase()} ← DON'T FORGET. WE'RE WATCHING.`,
          `${s} (yes, really, today)`,
          `REMINDER: ${s.toUpperCase()} 🔔`,
        ]),
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
      const chaosReminderTitles = [
        "⏰ IT'S HAPPENING. SOON. MAYBE NOW.",
        "ALERT: EVENT INCOMING",
        "STARTING SOON. YOU'RE WELCOME.",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Soon.",
        friendly: "Starting soon 💛",
        coach: "Up next",
        drill: "Event. Now. Move.",
        chaos: chaosTitle(chaosReminderTitles),
        auto: "NEUROHQ — Calendar",
      };
      const bodyTemplates: Record<PersonalityMode, (s: string) => string> = {
        stoic: (s) => s,
        friendly: (s) => `Starting soon: ${s}. You're on it.`,
        coach: (s) => `${s} — time to switch context.`,
        drill: (s) => s,
        chaos: (s) => randomFrom([
          `${s.toUpperCase()} ← GO. NOW.`,
          `THIS IS YOUR SIGN: ${s}`,
          `${s} … unless you're gonna no-show. 🙃`,
        ]),
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
      const chaosMorningTitles = [
        "☀️ SYSTEM ONLINE. MISSIONS LOADED. YOUR MOVE.",
        "GOOD MORNING. (WE SAID IT. YOU DO THE REST.)",
        "WAKE UP. WE HAVE TASKS. ⚡",
        "MORNING BRIEF: YOU HAVE THINGS TO DO.",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Morning.",
        friendly: "Good morning! 💛",
        coach: "Morning brief",
        drill: "Up. Missions waiting. No delay.",
        chaos: chaosTitle(chaosMorningTitles),
        auto: "NEUROHQ — Morning",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/^Good morning\.?\s*/i, "").replace(/ Set your brain status first\.?/i, ". Set brain status.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/^Good morning\.?\s*/i, "Morning. ").replace(/ Set your brain status first\.?/i, " Set brain status, then pick one.") || b,
        drill: (b) => b.replace(/^Good morning\.?\s*/i, "").replace(/ mission\(s\)/i, " missions").replace(/ Set your brain status first\.?/i, " Log brain status. Now.") || b,
        chaos: (b) => {
          const n = (b.match(/\d+/)?.[0]) ?? "0";
          return randomFrom([
            b.toUpperCase().replace(/ GOOD MORNING\.?/i, "").replace(/\.$/, " 🔥"),
            `${n} MISSION(S) LOADED. BRAIN STATUS? OPTIONAL. (JK. SET IT.)`,
            `YOU HAVE THINGS. WE HAVE NOTIFICATIONS. COINCIDENCE? … NO.`,
          ]);
        },
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
      const chaosEveningTitles = [
        "📊 EVENING AUDIT. THE SYSTEM DEMANDS INPUT.",
        "DAY'S END. WHAT DID YOU EVEN DO?",
        "NIGHT CHECK. LOG IT OR LIE TO YOURSELF. 🕐",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Evening.",
        friendly: "Evening check-in 💛",
        coach: "Evening brief",
        drill: "Day's end. Log it. Full report.",
        chaos: chaosTitle(chaosEveningTitles),
        auto: "NEUROHQ — Evening",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/Evening check-in:?/gi, "Summary:").replace(/Quick check-in before bed\?/i, "Log if you can.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/Quick check-in before bed\?/i, "Quick log before bed?").replace(/ — /g, ". ") || b,
        drill: (b) => b.replace(/Evening check-in:?/gi, "Report:").replace(/\?/g, ".") || b,
        chaos: (b) => randomFrom([
          b.toUpperCase().replace(/EVENING/gi, "EVENING").replace(/CHECK-IN/gi, "CHECK-IN") + " 📊",
          b.replace(/evening/gi, "EVENING").replace(/check-in/gi, "THE SYSTEM'S POLITE WAY OF SAYING LOG YOUR STUFF") || b,
          `WRAP UP: ${b.toUpperCase()}`,
        ]),
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
      const chaosLearningTitles = [
        "📚 LEARNING REPORT. YOU DID (OR DIDN'T) STUDY.",
        "WEEKLY STATS: KNOWLEDGE EDITION",
        "THE SYSTEM NOTICED YOUR LEARNING. OR LACK THEREOF. 😏",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Learning.",
        friendly: "Weekly learning 💛",
        coach: "Learning recap",
        drill: "Learning report. Plan next. No skip.",
        chaos: chaosTitle(chaosLearningTitles),
        auto: "NEUROHQ — Learning",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/Last week:?/i, "").replace(/Plan a learning block this week\.?/i, "Plan a block.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/Plan a learning block this week\.?/i, "Schedule one learning block this week.") || b,
        drill: (b) => b.replace(/\. /g, ". ").replace(/Plan a learning block this week\.?/i, "Block time this week.") || b,
        chaos: (b) => randomFrom([
          b.toUpperCase() + " 📚",
          b.replace(/Last week/i, "LAST WEEK (yes we're counting)").replace(/Plan a learning block/i, "PLAN A BLOCK. OR DON'T. WE'RE JUST SAYING.") || b,
          `LEARNING STATS: ${b.toUpperCase()}`,
        ]),
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
      const chaosFreezeTitles = [
        "⏸️ FROZEN PURCHASE. DECIDE. NOW.",
        "THAT THING YOU FROZE? IT'S READY. (CONFIRM OR CANCEL. YOUR CALL.)",
        "PURCHASE PENDING. THE SYSTEM AWAITS YOUR VERDICT. 💸",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Frozen purchase.",
        friendly: "Frozen purchase ready 💛",
        coach: "Frozen purchase — confirm or cancel",
        drill: "Frozen purchase. Confirm or cancel. Now.",
        chaos: chaosTitle(chaosFreezeTitles),
        auto: "NEUROHQ — Frozen purchase",
      };
      return { ...payload, title: titleByPersonality[personalityMode] ?? titleByPersonality.auto };
    }

    case "avoidance_alert": {
      const chaosAvoidTitles = [
        "📋 CARRY-OVER ALERT. YOU'VE BEEN IGNORING THESE.",
        "TASKS CARRIED OVER. PICK ONE. (WE'RE NOT ASKING.)",
        "REMINDER: YOU STILL HAVE UNFINISHED BUSINESS. 🔥",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Carry-over.",
        friendly: "Tasks carried over — pick one when you're ready 💛",
        coach: "Carried-over tasks: pick one to focus on.",
        drill: "Carry-over. Pick one. Now. No excuses.",
        chaos: chaosTitle(chaosAvoidTitles),
        auto: "NEUROHQ",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b,
        friendly: (b) => b,
        coach: (b) => b,
        drill: (b) => b.replace(/Pick one to focus on\.?/i, "Pick one. Execute.") || b,
        chaos: (b) => randomFrom([
          b.toUpperCase() + " ← YOUR MOVE.",
          b.replace(/Pick one to focus on/i, "Pick one. We're serious.") || b,
          `${b.toUpperCase()} (YES, AGAIN.)`,
        ]),
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
      const chaosSavingsTitles = [
        "💰 SAVINGS ALERT. YOUR GOAL IS JUDGING YOU.",
        "BUDGET CHECK: THAT GOAL STILL EXISTS. (JUST SAYING.)",
        "SAVINGS REMINDER. MONEY. DEADLINE. YOU. 💸",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Savings.",
        friendly: "Savings goal reminder 💛",
        coach: "Savings goal — check progress.",
        drill: "Savings. Deadline ahead. Move.",
        chaos: chaosTitle(chaosSavingsTitles),
        auto: "NEUROHQ — Savings",
      };
      return { ...payload, title: titleByPersonality[personalityMode] ?? titleByPersonality.auto };
    }

    default:
      return payload;
  }
}

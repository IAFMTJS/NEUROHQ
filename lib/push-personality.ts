/**
 * Applies notification personality to ALL push notifications (quote, calendar, morning, evening, weekly learning, behavioral).
 * Ensures title and body match the user's chosen mode: Stoic (short, wisdom), Friendly (warm), Coach (direct, action),
 * Drill (sharp, commanding), Chaos (sarcastic/overstimulating), Auto (adaptive).
 */

import type { PushPayload } from "@/lib/push";
import type { PersonalityMode } from "@/lib/behavioral-notifications";
import { pickVariantIndex } from "@/lib/push-copy-variant";
import type { PushCopyDedupe } from "@/lib/push-copy-dedupe";
import { parseQuoteBodyCombined } from "@/lib/quotes";

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
  | "release_notes"
  | "generic";

/**
 * Rewrite a push payload's title (and optionally body) so it matches the user's notification personality.
 * Used for quote, calendar, morning, evening, weekly learning — i.e. all non-behavioral pushes.
 * When `variantSeed` is set (e.g. `${userId}:${localDate}`), title/body pools pick a stable variant per day.
 * Optional `dedupe` avoids repeating the same pool index within a sliding day window (A.2).
 */
export type ApplyPersonalityOptions = {
  dedupe?: PushCopyDedupe;
};

export function applyPersonalityToPayload(
  payload: PushPayload,
  personalityMode: PersonalityMode,
  context: PushContext,
  variantSeed?: string,
  options?: ApplyPersonalityOptions
): PushPayload {
  const title = payload.title ?? "NEUROHQ";
  const body = payload.body ?? "";
  const dedupe = options?.dedupe;

  const pickStr = (arr: string[], salt: string): string => {
    if (!arr.length) return "";
    const poolKey = `${context}:${personalityMode}:${salt}`;
    const seedBase =
      variantSeed != null && variantSeed !== ""
        ? `${variantSeed}:${context}:${salt}`
        : `rnd:${context}:${salt}:${Math.random().toString(36).slice(2)}`;
    let idx: number;
    if (dedupe) {
      idx = dedupe.pickIndex(arr.length, poolKey, seedBase);
    } else {
      idx =
        variantSeed != null && variantSeed !== ""
          ? pickVariantIndex(`${variantSeed}:${context}:${salt}`, arr.length)
          : Math.floor(Math.random() * arr.length);
    }
    return arr[idx] ?? arr[0]!;
  };

  switch (context) {
    case "quote": {
      let author = (payload.quoteAuthor ?? "").trim() || null;
      let quotePlain = (payload.quoteText ?? "").trim();
      if (!quotePlain && payload.body) {
        const parsed = parseQuoteBodyCombined(payload.body);
        quotePlain = parsed.quote;
        if (!author) author = parsed.author;
      }
      if (!quotePlain) quotePlain = (payload.body ?? "").trim();

      const pickBodyVariant = (variants: string[], salt: string): string => {
        if (!variants.length) return quotePlain;
        const poolKey = `${context}:${personalityMode}:${salt}`;
        const seedBase =
          variantSeed != null && variantSeed !== ""
            ? `${variantSeed}:${context}:${salt}`
            : `rnd:${context}:${salt}:${Math.random().toString(36).slice(2)}`;
        let idx: number;
        if (dedupe) {
          idx = dedupe.pickIndex(variants.length, poolKey, seedBase);
        } else {
          idx =
            variantSeed != null && variantSeed !== ""
              ? pickVariantIndex(`${variantSeed}:${context}:${salt}`, variants.length)
              : Math.floor(Math.random() * variants.length);
        }
        return variants[idx] ?? variants[0]!;
      };

      const titlesNoAuthor: Record<PersonalityMode, string[]> = {
        stoic: [
          "Focus.",
          "Awareness.",
          "One thought.",
          "Stillness.",
          "Observe.",
          "Breathe. Read.",
          "One line.",
        ],
        friendly: [
          "Your daily nudge 💛",
          "A thought for you",
          "Good morning — here's your quote",
          "Tiny spark for today ✨",
          "We're rooting for you",
          "A gentle nudge",
          "Soft reminder",
          "Hope this lands well",
        ],
        coach: [
          "Daily focus",
          "One line to set the tone",
          "Quote of the day",
          "Start with this",
          "Today's line",
          "Set the tone",
          "Brief. Then act.",
          "Your opening move",
        ],
        drill: [
          "Read. Then move.",
          "Daily brief.",
          "Focus — then execute. No excuses.",
          "Line in. Work out.",
          "No drift. Read this.",
          "Quote. Then execute.",
        ],
        chaos: [
          "⚠️ WISDOM INCOMING ⚠️",
          "RANDOM QUOTE. TAKE IT OR LEAVE IT.",
          "THE UNIVERSE SAID THIS. IDK.",
          "QUOTE O' THE DAY (YES REALLY)",
          "INCOMING: ONE (1) THOUGHT 💥",
          "YOUR DAILY DOSE OF ???",
          "QUOTE DROP 💥",
          "BRAIN SNACK INCOMING",
          "DAILY WORD SALAD",
          "HERE. READ. MOVE ON.",
        ],
        auto: ["NEUROHQ", "Daily focus", "NEUROHQ", "Today's quote", "NEUROHQ — Daily", "One line"],
      };

      const titlesWithAuthor = (a: string): Record<PersonalityMode, string[]> => ({
        stoic: [`${a}`, `Today · ${a}`, `One voice · ${a}`, `Read · ${a}`, `Stillness · ${a}`, `${a} · one line`],
        friendly: [
          `From ${a} 💛`,
          `A moment with ${a}`,
          `${a} · for you`,
          `Inspired by ${a}`,
          `Today's gentle line · ${a}`,
          `${a} sent this one`,
        ],
        coach: [
          `${a} · today's line`,
          `Quote · ${a}`,
          `Lead with ${a}`,
          `Set the tone · ${a}`,
          `${a} — brief, then act`,
          `Your opening move · ${a}`,
        ],
        drill: [
          `${a}. Read. Move.`,
          `Line from ${a}`,
          `${a} — no drift`,
          `Quote · ${a} · execute`,
          `Brief from ${a}`,
        ],
        chaos: [
          `🚨 ${a.toUpperCase()} SAID WHAT?!`,
          `QUOTE BY ${a.toUpperCase()} (HANDLE IT)`,
          `AUTHOR: ${a} — DEAL WITH IT`,
          `⚠️ ${a} DROPPED A LINE ⚠️`,
          `SOURCE: ${a} (YES REALLY)`,
        ],
        auto: [`${a} · NEUROHQ`, `Quote · ${a}`, `Daily · ${a}`, `${a}`, `NEUROHQ · ${a}`],
      });

      const bodyByMode: Record<PersonalityMode, string[]> = {
        stoic: [
          quotePlain,
          `“${quotePlain}”`,
          quotePlain,
          `One line: ${quotePlain}`,
        ],
        friendly: [
          quotePlain,
          `Here's the line: ${quotePlain}`,
          `Take this in: ${quotePlain}`,
          `💛 ${quotePlain}`,
        ],
        coach: [
          quotePlain,
          `Today's line: ${quotePlain}`,
          `Lead with this: ${quotePlain}`,
          `Carry this today: ${quotePlain}`,
        ],
        drill: [
          quotePlain,
          `Read. ${quotePlain}`,
          `${quotePlain} — now execute.`,
          `Line in: ${quotePlain}`,
        ],
        chaos: [
          quotePlain,
          `🚨 ${quotePlain} 🚨`,
          `BRAIN RECEIVED: ${quotePlain.toUpperCase()}`,
          `QUOTE GO BRR: ${quotePlain}`,
        ],
        auto: [quotePlain, quotePlain, `${quotePlain}`, quotePlain],
      };

      const tw = author ? titlesWithAuthor(author) : null;
      const titlePool = tw
        ? (tw[personalityMode] ?? tw.auto)
        : (titlesNoAuthor[personalityMode] ?? titlesNoAuthor.auto);
      const bodyPool = bodyByMode[personalityMode] ?? bodyByMode.auto;
      const nextBody = pickBodyVariant(bodyPool, "quote:body");
      const nextTitle = pickStr(titlePool, "quote:title");

      const { quoteText: _qt, quoteAuthor: _qa, ...rest } = payload;
      return { ...rest, title: nextTitle, body: nextBody };
    }

    case "release_notes": {
      const baseBody = body || payload.body || "";
      const bullets: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b,
        friendly: (b) => `What's new: ${b}`,
        coach: (b) => `Updates: ${b}`,
        drill: (b) => `Shipped: ${b}`,
        chaos: (b) =>
          pickStr(
            [
              `🆕 ${b.toUpperCase()}`,
              `PATCH NOTES (READ OR DON'T): ${b}`,
              `NEW STUFF: ${b}`,
            ],
            "release_notes:chaosBody"
          ),
        auto: (b) => b,
      };
      const titlePools: Record<PersonalityMode, string[]> = {
        stoic: ["Update.", "What's new.", "NEUROHQ update"],
        friendly: ["Something new for you 💛", "Fresh updates ✨", "NEUROHQ — what's new"],
        coach: ["New in NEUROHQ", "Product update", "Here's what shipped"],
        drill: ["Update. Read the list.", "NEUROHQ — changelog", "Shipped. Review."],
        chaos: [
          "🆕 THEY SHIPPED STUFF AGAIN",
          "APP UPDATED. YOU'RE WELCOME.",
          "NEW FEATURES. SAME BRAIN.",
        ],
        auto: ["NEUROHQ — Update", "What's new", "NEUROHQ"],
      };
      const pool = titlePools[personalityMode] ?? titlePools.auto;
      const t = bullets[personalityMode] ?? bullets.auto;
      const { quoteText: _q1, quoteAuthor: _q2, ...rest } = payload;
      return { ...rest, title: pickStr(pool, "release_notes:title"), body: t(baseBody) };
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
        chaos: pickStr(chaosTitles, "calendar_morning:chaosTitle"),
        auto: "NEUROHQ — Today",
      };
      const bodyTemplates: Record<PersonalityMode, (s: string) => string> = {
        stoic: (s) => s,
        friendly: (s) => `${s} — you've got this.`,
        coach: (s) => `${s}. Plan your blocks.`,
        drill: (s) => s,
        chaos: (s) =>
          pickStr(
            [
              `${s.toUpperCase()} ← DON'T FORGET. WE'RE WATCHING.`,
              `${s} (yes, really, today)`,
              `REMINDER: ${s.toUpperCase()} 🔔`,
            ],
            "calendar_morning:chaosBody"
          ),
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
        chaos: pickStr(chaosReminderTitles, "calendar_reminder:chaosTitle"),
        auto: "NEUROHQ — Calendar",
      };
      const bodyTemplates: Record<PersonalityMode, (s: string) => string> = {
        stoic: (s) => s,
        friendly: (s) => `Starting soon: ${s}. You're on it.`,
        coach: (s) => `${s} — time to switch context.`,
        drill: (s) => s,
        chaos: (s) =>
          pickStr(
            [
              `${s.toUpperCase()} ← GO. NOW.`,
              `THIS IS YOUR SIGN: ${s}`,
              `${s} … unless you're gonna no-show. 🙃`,
            ],
            "calendar_reminder:chaosBody"
          ),
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
        "RISE. SHINE. EXECUTE. (OR DON'T. WE'LL ASK AGAIN.)",
        "COFFEE OPTIONAL. MISSIONS NOT OPTIONAL. ☕⚡",
        "NEW DAY. SAME BRAIN. DIFFERENT CHAOS.",
        "ALERT: SUNLIGHT DETECTED. HUMAN ACTIVITY EXPECTED.",
        "BRIEFING: YOU'RE AWAKE. CONGRATS. NOW WORK.",
        "MORNING PROTOCOL INITIATED. GOOD LUCK.",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Morning.",
        friendly: "Good morning! 💛",
        coach: "Morning brief",
        drill: "Up. Missions waiting. No delay.",
        chaos: pickStr(chaosMorningTitles, "morning:chaosTitle"),
        auto: "NEUROHQ — Morning",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/^Good morning\.?\s*/i, "").replace(/ Set your brain status first\.?/i, ". Set brain status.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/^Good morning\.?\s*/i, "Morning. ").replace(/ Set your brain status first\.?/i, " Set brain status, then pick one.") || b,
        drill: (b) => b.replace(/^Good morning\.?\s*/i, "").replace(/ mission\(s\)/i, " missions").replace(/ Set your brain status first\.?/i, " Log brain status. Now.") || b,
        chaos: (b) => {
          const n = (b.match(/\d+/)?.[0]) ?? "0";
          return pickStr(
            [
              b.toUpperCase().replace(/ GOOD MORNING\.?/i, "").replace(/\.$/, " 🔥"),
              `${n} MISSION(S) LOADED. BRAIN STATUS? OPTIONAL. (JK. SET IT.)`,
              `YOU HAVE THINGS. WE HAVE NOTIFICATIONS. COINCIDENCE? … NO.`,
            ],
            "morning:chaosBody"
          );
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
        "EVENING ROLL CALL. ACCOUNTABILITY O'CLOCK.",
        "SUNSET = STATS TIME. DON'T @ ME.",
        "CLOSE THE LOOP. OR OPEN IT TOMORROW. YOUR CALL.",
        "DAY COMPLETE? DEBATABLE. LOG ANYWAY.",
        "NIGHT MODE: REFLECT, DON'T DEFLECT.",
      ];
      const titleByPersonality: Record<PersonalityMode, string> = {
        stoic: "Evening.",
        friendly: "Evening check-in 💛",
        coach: "Evening brief",
        drill: "Day's end. Log it. Full report.",
        chaos: pickStr(chaosEveningTitles, "evening:chaosTitle"),
        auto: "NEUROHQ — Evening",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/Evening check-in:?/gi, "Summary:").replace(/Quick check-in before bed\?/i, "Log if you can.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/Quick check-in before bed\?/i, "Quick log before bed?").replace(/ — /g, ". ") || b,
        drill: (b) => b.replace(/Evening check-in:?/gi, "Report:").replace(/\?/g, ".") || b,
        chaos: (b) =>
          pickStr(
            [
              b.toUpperCase().replace(/EVENING/gi, "EVENING").replace(/CHECK-IN/gi, "CHECK-IN"),
              b.replace(/evening/gi, "EVENING").replace(/check-in/gi, "THE SYSTEM'S POLITE WAY OF SAYING LOG YOUR STUFF") || b,
              `WRAP UP: ${b.toUpperCase()}`,
            ],
            "evening:chaosBody"
          ),
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
        chaos: pickStr(chaosLearningTitles, "weekly_learning:chaosTitle"),
        auto: "NEUROHQ — Learning",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b.replace(/Last week:?/i, "").replace(/Plan a learning block this week\.?/i, "Plan a block.") || b,
        friendly: (b) => b,
        coach: (b) => b.replace(/Plan a learning block this week\.?/i, "Schedule one learning block this week.") || b,
        drill: (b) => b.replace(/\. /g, ". ").replace(/Plan a learning block this week\.?/i, "Block time this week.") || b,
        chaos: (b) =>
          pickStr(
            [
              b.toUpperCase() + " 📚",
              b.replace(/Last week/i, "LAST WEEK (yes we're counting)").replace(/Plan a learning block/i, "PLAN A BLOCK. OR DON'T. WE'RE JUST SAYING.") || b,
              `LEARNING STATS: ${b.toUpperCase()}`,
            ],
            "weekly_learning:chaosBody"
          ),
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
        chaos: pickStr(chaosFreezeTitles, "freeze_reminder:chaosTitle"),
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
        chaos: pickStr(chaosAvoidTitles, "avoidance_alert:chaosTitle"),
        auto: "NEUROHQ",
      };
      const bodyByPersonality: Record<PersonalityMode, (b: string) => string> = {
        stoic: (b) => b,
        friendly: (b) => b,
        coach: (b) => b,
        drill: (b) => b.replace(/Pick one to focus on\.?/i, "Pick one. Execute.") || b,
        chaos: (b) =>
          pickStr(
            [
              b.toUpperCase() + " ← YOUR MOVE.",
              b.replace(/Pick one to focus on/i, "Pick one. We're serious.") || b,
              `${b.toUpperCase()} (YES, AGAIN.)`,
            ],
            "avoidance_alert:chaosBody"
          ),
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
        chaos: pickStr(chaosSavingsTitles, "savings_alert:chaosTitle"),
        auto: "NEUROHQ — Savings",
      };
      return { ...payload, title: titleByPersonality[personalityMode] ?? titleByPersonality.auto };
    }

    default:
      return payload;
  }
}

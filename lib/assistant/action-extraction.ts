/**
 * NEUROHQ – Action extraction: uit chat halen wat de user wil toevoegen (taak, uitgave, agenda).
 * Rule-based; geen AI. Zie docs/ASSISTANT_SPRAAKBOT_ACTIES.md.
 */

export type AddTaskPayload = {
  title: string;
  due_date: string;
};

export type AddExpensePayload = {
  amount_cents: number;
  date: string;
  category?: string;
  note?: string;
};

export type AddCalendarPayload = {
  title: string;
  start_at: string;
  end_at: string;
  sync_to_google?: boolean;
};

export type RequestedAction =
  | { type: "add_task"; payload: AddTaskPayload }
  | { type: "add_expense"; payload: AddExpensePayload }
  | { type: "add_calendar"; payload: AddCalendarPayload };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** "vandaag" | "morgen" → YYYY-MM-DD. */
function resolveDate(word: string): string {
  const w = word.trim().toLowerCase();
  if (w.includes("morgen")) return tomorrowISO();
  return todayISO();
}

/** "vanavond" → vandaag 18:00–19:00; "morgen 10:00" → morgen 10:00–11:00. */
function resolveStartEnd(word: string): { start_at: string; end_at: string } {
  const w = word.trim().toLowerCase();
  const today = todayISO();
  const tomorrow = tomorrowISO();
  if (w.includes("vanavond")) {
    return {
      start_at: `${today}T18:00:00`,
      end_at: `${today}T19:00:00`,
    };
  }
  if (w.includes("vanmiddag")) {
    return {
      start_at: `${today}T14:00:00`,
      end_at: `${today}T15:00:00`,
    };
  }
  const timeMatch = w.match(/(\d{1,2})\s*:?\s*(\d{2})?/);
  const isTomorrow = w.includes("morgen");
  const date = isTomorrow ? tomorrow : today;
  const hour = timeMatch ? Math.min(23, parseInt(timeMatch[1], 10)) : 10;
  const min = timeMatch?.[2] ? parseInt(timeMatch[2], 10) : 0;
  const start = `${date}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
  const endHour = hour + 1;
  const end = `${date}T${String(endHour > 23 ? 23 : endHour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
  return { start_at: start, end_at: end };
}

/** Haalt add_task intent + payload uit het bericht. */
export function parseAddTask(message: string): AddTaskPayload | null {
  const m = message.trim();
  if (m.length < 3) return null;

  let title = "";
  let due_date = todayISO();

  const forDateMatch = m.match(/\s+voor\s+(vandaag|morgen|vanavond|deze week)\s*$/i);
  if (forDateMatch) due_date = forDateMatch[1].toLowerCase().includes("morgen") ? tomorrowISO() : todayISO();

  if (/voeg\s+taak\s+/i.test(m)) {
    title = m.replace(/voeg\s+taak\s+/i, "").replace(/\s+toe\s*$/i, "").trim();
  } else if (/taak\s*:\s*/i.test(m) || /nieuwe\s+taak\s*:\s*/i.test(m)) {
    title = m.replace(/(?:nieuwe\s+)?taak\s*:\s*/i, "").trim();
  } else if (/^taak\s+/i.test(m)) {
    title = m.replace(/^taak\s+/i, "").replace(/\s+voor\s+(vandaag|morgen|vanavond|deze week)\s*$/i, "").trim();
  } else if (/zet\s+.+\s+op\s+(?:de\s+)?lijst/i.test(m)) {
    title = m.replace(/zet\s+/i, "").replace(/\s+op\s+(?:de\s+)?lijst.*$/i, "").trim();
  } else if (/^(?:todo|to\s*do)\s*:\s*/i.test(m)) {
    title = m.replace(/^(?:todo|to\s*do)\s*:\s*/i, "").trim();
  } else if (/ik\s+moet\s+/i.test(m)) {
    title = m.replace(/ik\s+moet\s+/i, "").replace(/\s+voor\s+(vandaag|morgen)\s*$/i, "").trim();
  } else if (/ik\s+ga\s+.+\s+doen/i.test(m)) {
    title = m.replace(/ik\s+ga\s+/i, "").replace(/\s+doen.*$/i, "").trim();
  } else if (/herinner\s+me\s+aan\s+/i.test(m)) {
    title = m.replace(/herinner\s+me\s+aan\s+/i, "").trim();
  } else if (/niet\s+vergeten\s*:\s*/i.test(m)) {
    title = m.replace(/niet\s+vergeten\s*:\s*/i, "").trim();
  } else if (/moet\s+nog\s*:\s*/i.test(m) || /.+\s+moet\s+nog\s*$/i.test(m)) {
    title = m.replace(/moet\s+nog\s*:\s*/i, "").replace(/\s+moet\s+nog\s*$/i, "").trim();
  } else if (/plan\s+.+\s+voor\s+(vandaag|morgen)/i.test(m)) {
    const match = m.match(/plan\s+(.+?)\s+voor\s+(vandaag|morgen)/i);
    if (match) {
      title = match[1].trim();
      due_date = resolveDate(match[2]);
    }
  } else if (/\s+als\s+taak/i.test(m)) {
    title = m.replace(/\s+als\s+taak.*$/i, "").trim();
  } else if (/voeg\s+toe\s*:\s*/i.test(m)) {
    title = m.replace(/voeg\s+toe\s*:\s*/i, "").trim();
  } else if (/doe\s+.+/i.test(m) && m.length < 60) {
    title = m.replace(/^doe\s+/i, "").trim();
  }
  if (title.length < 2) return null;
  return { title, due_date };
}

/** Haalt add_expense intent + payload uit het bericht. Euro's → cents (negatief). */
export function parseAddExpense(message: string): AddExpensePayload | null {
  const m = message.trim();
  const lower = m.toLowerCase();

  const euroMatch =
    m.match(/(\d+(?:[.,]\d+)?)\s*(?:euro|eur|€)/i) ??
    m.match(/(\d+(?:[.,]\d+)?)\s*euro's/i) ??
    m.match(/(?:euro|eur|€)\s*(\d+(?:[.,]\d+)?)/i);
  if (!euroMatch) return null;

  const amountStr = euroMatch[1].replace(",", ".");
  const amountEuro = parseFloat(amountStr);
  if (Number.isNaN(amountEuro) || amountEuro <= 0) return null;
  const amount_cents = -Math.round(amountEuro * 100);
  const date = todayISO();

  let category: string | undefined;
  let note: string | undefined;
  const aanMatch = lower.match(/(?:aan|voor|uitgegeven aan|besteed aan|betaald voor)\s+(.+?)(?:\s*\.|$)/);
  if (aanMatch) {
    const rest = aanMatch[1].trim();
    if (rest.length < 50) category = rest;
  }
  if (!category && /^(\d+(?:[.,]\d+)?)\s*(?:euro|eur)?\s+(.+)$/i.test(m)) {
    const afterAmount = m.replace(/^\d+(?:[.,]\d+)?\s*(?:euro|eur|€)?\s*/i, "").trim();
    if (afterAmount.length > 0 && afterAmount.length < 50) category = afterAmount;
  }
  const expensePhrases = ["uitgegeven", "uitgave", "expense", "besteed", "betaald", "kosten", "uitgaven"];
  if (expensePhrases.some((p) => lower.includes(p)) && !category) {
    const withoutAmount = m.replace(/(\d+(?:[.,]\d+)?)\s*(?:euro|eur|€)/gi, "").trim();
    const parts = withoutAmount.split(/\s+(?:aan|voor)\s+/i);
    if (parts[1]) note = parts[1].trim().slice(0, 200);
  }

  return { amount_cents, date, category, note };
}

/** Haalt add_calendar intent + payload uit het bericht. sync_to_google bij "google" / "sync". */
export function parseAddCalendar(message: string): AddCalendarPayload | null {
  const m = message.trim();
  if (m.length < 3) return null;
  const lower = m.toLowerCase();
  const sync_to_google = /\b(google|sync|gcal|google\s+agenda|in\s+google)\b/i.test(m);

  const calendarPrefixes = [
    /afspraak\s+(.+?)(?:\s+(vanavond|morgen|vanmiddag|\d{1,2}(?::\d{2})?))?$/i,
    /plan\s+(.+?)\s+om\s+(\d{1,2}(?::\d{2})?)\s*(?:uur)?/i,
    /agenda\s*:\s*(.+?)(?:\s+(vanavond|morgen))?$/i,
    /voeg\s+afspraak\s+toe\s*:\s*(.+)/i,
    /calender\s+(.+?)(?:\s+(vanavond|morgen))?$/i,
    /zet\s+(.+?)\s+in\s+(?:de\s+)?agenda(?:\s+(vanavond|morgen))?/i,
    /blok\s+(.+?)(?:\s+(vanavond|morgen|\d{1,2}(?::\d{2})?))?/i,
    /meeting\s+(.+?)(?:\s+(morgen|vanavond)\s+(\d{1,2}(?::\d{2})?))?/i,
    /event\s+(.+?)(?:\s+(vanavond|morgen))?/i,
    /inplannen\s*:\s*(.+?)(?:\s+(vanavond|morgen))?$/i,
    /kalender\s*:\s*(.+?)(?:\s+(vanavond|morgen))?$/i,
  ];

  let title = "";
  let timeWord = "vanavond";

  for (const re of calendarPrefixes) {
    const match = m.match(re);
    if (match) {
      title = (match[1] ?? "").trim();
      if (match[3]) timeWord = `${match[2] ?? ""} ${match[3]}`.trim();
      else if (match[2]) timeWord = match[2];
      break;
    }
  }
  if (!title && (lower.includes("afspraak") || lower.includes("agenda") || lower.includes("inplannen") || lower.includes("blok") || lower.includes("event"))) {
    const withoutKeyword = m
      .replace(/^(afspraak|agenda|plan|inplannen|zet|blok|meeting|event|kalender)\s*[:\s]+/i, "")
      .replace(/\s+in\s+(?:de\s+)?agenda.*$/i, "")
      .trim();
    if (withoutKeyword.length >= 2) title = withoutKeyword;
  }
  if (title.length < 2) return null;

  const { start_at, end_at } = resolveStartEnd(timeWord);
  return { title, start_at, end_at, sync_to_google: sync_to_google || undefined };
}

/**
 * Bepaalt of het bericht expliciet om een actie vraagt (taak, uitgave of agenda).
 * Retourneert de eerste gevonden actie.
 */
export function extractRequestedAction(message: string): RequestedAction | null {
  const task = parseAddTask(message);
  if (task) return { type: "add_task", payload: task };
  const expense = parseAddExpense(message);
  if (expense) return { type: "add_expense", payload: expense };
  const calendar = parseAddCalendar(message);
  if (calendar) return { type: "add_calendar", payload: calendar };
  return null;
}

/** Voor suggested actions: tijdwoord uit bericht halen voor start/end. */
export function getCalendarSlotFromMessage(message: string): { start_at: string; end_at: string } | null {
  const lower = message.trim().toLowerCase();
  const timeWords = ["vanavond", "vanmiddag", "morgen", "vandaag"];
  for (const w of timeWords) {
    if (lower.includes(w)) return resolveStartEnd(lower);
  }
  const timeMatch = lower.match(/(\d{1,2})\s*:?\s*(\d{2})?/);
  if (timeMatch) return resolveStartEnd(lower);
  return null;
}

export type SuggestedAction =
  | { type: "add_task"; label: string; payload: AddTaskPayload }
  | { type: "add_expense"; label: string; payload: AddExpensePayload }
  | { type: "add_calendar"; label: string; payload: AddCalendarPayload };

/** Volgende week,zelfde weekdag, 19:00–20:00 (voor wekelijkse blok-suggestie). */
function getNextWeekSameDaySlot(): { start_at: string; end_at: string } {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const date = d.toISOString().slice(0, 10);
  return {
    start_at: `${date}T19:00:00`,
    end_at: `${date}T20:00:00`,
  };
}

/**
 * Suggesties uit context: laatste task + tijdwoord → agenda of taak; net genoemde taak/doel → taak;
 * doel/skill (bv. japans leren) → taak + wekelijkse agenda-blok.
 */
export function getSuggestedActionsFromContext(
  lastTurn: { lastExtractedContent: string | null; lastExtractedType: string | null } | null,
  userMessage: string,
  extractedItem: { type: string; content: string } | null
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];
  const today = todayISO();
  const lower = (userMessage || "").trim().toLowerCase();
  const timeWords = ["vanavond", "vanmiddag", "morgen", "straks", "zo meteen", "vandaag"];

  if (lastTurn?.lastExtractedContent && lastTurn.lastExtractedType === "task") {
    const title = lastTurn.lastExtractedContent;
    if (timeWords.some((w) => lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w))) {
      const slot = getCalendarSlotFromMessage(userMessage);
      if (slot) {
        suggestions.push({
          type: "add_calendar",
          label: `'${title}' in agenda (${lower})`,
          payload: { title, start_at: slot.start_at, end_at: slot.end_at },
        });
      }
      suggestions.push({
        type: "add_task",
        label: `Taak '${title}' voor vandaag`,
        payload: { title, due_date: today },
      });
    }
  }

  if (extractedItem && (extractedItem.type === "task" || extractedItem.type === "goal" || extractedItem.type === "skill")) {
    const title = extractedItem.content;
    suggestions.push({
      type: "add_task",
      label: `Taak '${title}' toevoegen`,
      payload: { title, due_date: today },
    });
    if (extractedItem.type === "goal" || extractedItem.type === "skill") {
      const slot = getNextWeekSameDaySlot();
      const weeklyTitle = title.toLowerCase().includes("leren") ? `${title.replace(/\s+leren\s*$/i, "").trim()} oefenen` : `${title} – sessie`;
      suggestions.push({
        type: "add_calendar",
        label: `Wekelijks blok '${title}' (deze week)`,
        payload: { title: weeklyTitle, start_at: slot.start_at, end_at: slot.end_at },
      });
    }
  }

  return suggestions;
}

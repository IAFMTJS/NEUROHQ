import type { Json } from "@/types/database.types";

const MAX_HISTORY = 400;

export type QuestAnswerHistoryItem = {
  at: string;
  day: number;
  /** Multi-step: 0-based stap; anders null. */
  step: number | null;
  answer: string;
  correct: boolean;
};

export type QuestAnswerLog = {
  history: QuestAnswerHistoryItem[];
};

function truncateAnswer(s: string, max = 500): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function parseAnswerLog(raw: Json | null | undefined): QuestAnswerLog {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { history: [] };
  }
  const o = raw as Record<string, unknown>;
  const h = o.history;
  if (!Array.isArray(h)) return { history: [] };
  const history: QuestAnswerHistoryItem[] = [];
  for (const item of h) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.at !== "string" || typeof r.day !== "number" || typeof r.answer !== "string" || typeof r.correct !== "boolean")
      continue;
    const step = r.step === null || r.step === undefined ? null : typeof r.step === "number" ? r.step : null;
    history.push({
      at: r.at,
      day: r.day,
      step,
      answer: r.answer,
      correct: r.correct,
    });
  }
  return { history };
}

export function appendAnswerLog(existing: Json | null | undefined, entry: QuestAnswerHistoryItem): Json {
  const log = parseAnswerLog(existing);
  const next: QuestAnswerHistoryItem = {
    ...entry,
    answer: truncateAnswer(entry.answer),
  };
  log.history.push(next);
  if (log.history.length > MAX_HISTORY) {
    log.history = log.history.slice(-MAX_HISTORY);
  }
  return { history: log.history } as Json;
}

export type QuestRecentAttempt = { answer: string; correct: boolean; at: string };

/** Laatste pogingen voor de huidige puzzel (zelfde dag + stap). */
export function recentAttemptsForPuzzle(
  raw: Json | null | undefined,
  day: number,
  step: number | null,
  limit = 12
): QuestRecentAttempt[] {
  const log = parseAnswerLog(raw);
  const filtered = log.history.filter((h) => {
    if (h.day !== day) return false;
    if (step == null) return h.step == null;
    return h.step === step;
  });
  return filtered.slice(-limit).map((h) => ({
    answer: h.answer,
    correct: h.correct,
    at: h.at,
  }));
}

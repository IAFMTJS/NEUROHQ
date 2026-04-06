import type { Json } from "@/types/database.types";
import type { QuestCampaignContent, QuestDayDef } from "@/lib/quests/types";
import { getDayDef } from "@/lib/quests/engine";
import { parseAnswerLog } from "@/lib/quests/answer-log";

export type QuestAnswerHistoryDisplayRow = {
  at: string;
  day: number;
  step: number | null;
  answer: string;
  correct: boolean;
  headline: string;
  /** Vraagtekst zoals die bij die poging gold (riddle / stap / intro + schilderijtitels). */
  questionPreview: string;
  kind: QuestDayDef["kind"];
};

function buildQuestionPreview(def: QuestDayDef, step: number | null): string {
  const blocks: string[] = [];
  if (def.intro?.trim()) blocks.push(def.intro.trim());
  if (def.storyLine?.trim()) blocks.push(def.storyLine.trim());

  if (def.kind === "paintings" && def.paintings?.length) {
    const titles = def.paintings.map((p) => p.title).filter(Boolean).join(" · ");
    if (titles) blocks.push(`Schilderijen: ${titles}.`);
  }

  if (def.kind === "multi" && def.steps?.length) {
    const si = Math.max(0, Math.min(def.steps.length - 1, step ?? 0));
    const r = def.steps[si]?.riddle;
    if (r?.trim()) blocks.push(r.trim());
  } else if (def.riddle?.trim()) {
    blocks.push(def.riddle.trim());
  }

  return blocks.join("\n\n").trim() || "—";
}

/**
 * Koppelt `answer_log` aan quest-content zodat spelers oude vragen en hun antwoorden kunnen teruglezen.
 * Nieuwste pogingen eerst.
 */
export function buildQuestAnswerHistoryRows(content: QuestCampaignContent, rawLog: Json | null | undefined): QuestAnswerHistoryDisplayRow[] {
  const { history } = parseAnswerLog(rawLog);
  const sorted = [...history].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const rows: QuestAnswerHistoryDisplayRow[] = [];

  for (const h of sorted) {
    const def = getDayDef(content, h.day);
    if (!def) continue;
    rows.push({
      at: h.at,
      day: h.day,
      step: h.step,
      answer: h.answer,
      correct: h.correct,
      headline: def.headline,
      questionPreview: buildQuestionPreview(def, h.step),
      kind: def.kind,
    });
  }

  return rows;
}

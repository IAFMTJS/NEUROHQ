import { addCalendarDaysAmsterdamYmd } from "@/lib/utils/timezone";
import type { QuestCampaignContent, QuestDayDef, QuestProgressState } from "@/lib/quests/types";

const APP_TZ = "Europe/Amsterdam";

export function isoToAmsterdamYmd(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-CA", { timeZone: APP_TZ });
  } catch {
    return iso.slice(0, 10);
  }
}

/** Whole calendar days from startYmd to todayYmd (0 = same day). */
export function calendarDaysBetweenStartAndToday(startYmd: string, todayYmd: string): number {
  const [ys, ms, ds] = startYmd.split("-").map(Number);
  const [yt, mt, dt] = todayYmd.split("-").map(Number);
  const s = Date.UTC(ys, ms - 1, ds, 12, 0, 0);
  const t = Date.UTC(yt, mt - 1, dt, 12, 0, 0);
  return Math.round((t - s) / 86400000);
}

/** Inclusive event day index: day 1 on start date, +1 per calendar day, max `maxDay`. */
export function computeEventDayIndex(startYmd: string, todayYmd: string, maxDay: number): number {
  const diff = calendarDaysBetweenStartAndToday(startYmd, todayYmd);
  if (diff < 0) return 0;
  return Math.min(maxDay, diff + 1);
}

export function normalizeQuestAnswer(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9,\.\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function answerMatchesAccepts(normalizedUser: string, accepts: string[]): boolean {
  const set = new Set(accepts.map((a) => normalizeQuestAnswer(a)));
  if (set.has(normalizedUser)) return true;
  return accepts.some((a) => normalizedUser === normalizeQuestAnswer(a));
}

export function matchCoords(input: string, target: { lat: number; lng: number; epsilon: number }): boolean {
  const nums = input.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return false;
  const lat = parseFloat(nums[0] ?? "");
  const lng = parseFloat(nums[1] ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Math.abs(lat - target.lat) <= target.epsilon && Math.abs(lng - target.lng) <= target.epsilon;
}

export function getDayDef(content: QuestCampaignContent, day: number): QuestDayDef | undefined {
  return content.days.find((d) => d.day === day);
}

/**
 * Next puzzle day: smallest d in 1..eventDay not solved; respects multi-step mid-flight.
 */
export function resolveNextChallengeDay(
  content: QuestCampaignContent,
  eventDay: number,
  state: QuestProgressState
): number | null {
  const maxDay = Math.max(...content.days.map((d) => d.day), 10);
  const cap = Math.min(eventDay, maxDay);
  const solved = new Set(state.solvedDays);

  for (let d = 1; d <= cap; d++) {
    if (solved.has(d)) continue;
    const def = getDayDef(content, d);
    if (!def) continue;
    if (def.kind === "multi" && def.steps?.length) {
      const sub = state.sub?.[String(d)] ?? 0;
      if (sub < def.steps.length) return d;
    }
    return d;
  }
  return null;
}

export function isQuestFullyComplete(content: QuestCampaignContent, state: QuestProgressState): boolean {
  const lastDay = Math.max(...content.days.map((d) => d.day));
  return state.solvedDays.includes(lastDay);
}

export function campaignEndYmd(startsAtIso: string, dayCount: number): string {
  const startYmd = isoToAmsterdamYmd(startsAtIso);
  return addCalendarDaysAmsterdamYmd(startYmd, dayCount - 1);
}

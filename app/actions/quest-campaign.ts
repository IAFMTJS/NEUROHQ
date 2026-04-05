"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { addXP } from "@/app/actions/xp";
import { grantFlexPercentOfCapBonus } from "@/app/actions/flex-budget";
import { todayDateString } from "@/lib/utils/timezone";
import type { Json, TablesInsert } from "@/types/database.types";
import { getDefaultKatsuoQuestContent } from "@/lib/quests/default-katsuo-content";
import {
  parseQuestContent,
  parseQuestProgressState,
  toJsonState,
  type QuestCampaignContent,
  type QuestDayDef,
  type QuestProgressState,
} from "@/lib/quests/types";
import {
  answerMatchesAccepts,
  computeEventDayIndex,
  getDayDef,
  isoToAmsterdamYmd,
  matchCoords,
  normalizeQuestAnswer,
  resolveNextChallengeDay,
  isQuestFullyComplete,
} from "@/lib/quests/engine";
import { buildQuestPrizeLine } from "@/lib/quests/prize-line";
import { appendAnswerLog, recentAttemptsForPuzzle, type QuestRecentAttempt } from "@/lib/quests/answer-log";

const DEFAULT_SLUG = "katsuo-ji";

export type QuestPuzzlePublic = {
  day: number;
  headline: string;
  kind: "paintings" | "riddle" | "multi" | "coords";
  intro?: string;
  storyLine?: string;
  paintings?: { title: string; caption?: string; imageUrl?: string }[];
  riddle?: string;
  stepIndex?: number;
  stepTotal?: number;
};

export type QuestClientPayload = {
  campaignId: string;
  slug: string;
  title: string;
  tagline: string;
  badgeLabel: string;
  rewardXp: number;
  rewardFlexPercentBp: number;
  /** Zichtbare prijs (admin-tekst of afgeleid). */
  prizeLine: string;
  startsAt: string;
  endsAt: string | null;
  epigraph: string | null;
  eventDay: number;
  maxDay: number;
  solvedDays: number[];
  showDashboardFab: boolean;
  nextDay: number | null;
  puzzle: QuestPuzzlePublic | null;
  completed: boolean;
  rewardsGranted: boolean;
  /** Pogingen voor de actieve puzzel (dag/stap). */
  recentAttempts: QuestRecentAttempt[];
};

function buildPuzzlePublic(def: QuestDayDef, state: QuestProgressState): QuestPuzzlePublic {
  if (def.kind === "paintings") {
    return {
      day: def.day,
      headline: def.headline,
      kind: "paintings",
      intro: def.intro,
      storyLine: def.storyLine,
      paintings: def.paintings?.map((p) => ({
        title: p.title,
        caption: p.caption,
        ...(typeof p.imageUrl === "string" && p.imageUrl.trim() ? { imageUrl: p.imageUrl.trim() } : {}),
      })),
    };
  }
  if (def.kind === "multi" && def.steps?.length) {
    const sub = state.sub?.[String(def.day)] ?? 0;
    const step = def.steps[sub];
    return {
      day: def.day,
      headline: def.headline,
      kind: "multi",
      intro: def.intro,
      riddle: step?.riddle,
      stepIndex: sub,
      stepTotal: def.steps.length,
    };
  }
  if (def.kind === "coords") {
    return {
      day: def.day,
      headline: def.headline,
      kind: "coords",
      riddle: def.riddle,
    };
  }
  return {
    day: def.day,
    headline: def.headline,
    kind: "riddle",
    intro: def.intro,
    storyLine: def.storyLine,
    riddle: def.riddle,
  };
}

function challengeStepForLog(def: QuestDayDef, state: QuestProgressState, day: number): number | null {
  if (def.kind !== "multi" || !def.steps?.length) return null;
  return state.sub?.[String(day)] ?? 0;
}

/** Finale-XP: eerst normale addXP; bij falen service role (cron/edge cases). */
async function grantQuestFinaleXp(userId: string, points: number): Promise<boolean> {
  if (points <= 0) return true;
  const r = await addXP(points, {
    source_type: "platform_quest_finale",
    skipOverdriveMultiplier: true,
  });
  if (r != null) return true;

  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("grantQuestFinaleXp: no service role client");
    return false;
  }
  const { data: existing } = await admin.from("user_xp").select("total_xp").eq("user_id", userId).maybeSingle();
  const current = (existing?.total_xp as number) ?? 0;
  const newTotal = current + points;
  const ts = new Date().toISOString();
  const { error: uerr } = await admin.from("user_xp").upsert(
    { user_id: userId, total_xp: newTotal, updated_at: ts },
    { onConflict: "user_id" }
  );
  if (uerr) {
    console.error("grantQuestFinaleXp fallback user_xp:", uerr.message);
    return false;
  }
  const { error: ierr } = await admin.from("xp_events").insert({
    user_id: userId,
    amount: points,
    source_type: "platform_quest_finale",
    task_id: null,
  });
  if (ierr) console.error("grantQuestFinaleXp fallback xp_events:", ierr.message);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/learning");
  return true;
}

async function loadLiveCampaignRow(supabase: Awaited<ReturnType<typeof createClient>>) {
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const { data, error } = await supabase
    .from("platform_quest_campaigns")
    .select("*")
    .eq("active", true)
    .lte("starts_at", nowIso)
    .order("starts_at", { ascending: false });
  if (error) return { row: null, error: error.message };
  const row =
    (data ?? []).find((r) => {
      if (!r.ends_at) return true;
      return new Date(r.ends_at).getTime() >= nowMs;
    }) ?? null;
  return { row, error: null };
}

export async function getQuestCampaignPublicStatus(): Promise<QuestClientPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { row, error } = await loadLiveCampaignRow(supabase);
  if (error || !row) return null;

  const content = parseQuestContent(row.content as Json);
  if (!content) return null;

  const maxDay = Math.max(...content.days.map((d) => d.day), 1);
  const startYmd = isoToAmsterdamYmd(row.starts_at);
  const todayYmd = todayDateString();
  const eventDay = computeEventDayIndex(startYmd, todayYmd, maxDay);

  const { data: progRow } = await supabase
    .from("user_quest_campaign_progress")
    .select("state, rewards_granted_at, answer_log")
    .eq("user_id", user.id)
    .eq("campaign_id", row.id)
    .maybeSingle();

  const state = parseQuestProgressState((progRow?.state as Json) ?? undefined);
  const nextDay = eventDay > 0 ? resolveNextChallengeDay(content, eventDay, state) : null;
  const completed = isQuestFullyComplete(content, state);
  const puzzle = nextDay != null ? buildPuzzlePublic(getDayDef(content, nextDay)!, state) : null;
  const stepForHistory =
    puzzle?.kind === "multi" && puzzle.stepIndex != null ? puzzle.stepIndex : null;
  const recentAttempts =
    puzzle != null
      ? recentAttemptsForPuzzle(progRow?.answer_log as Json, puzzle.day, stepForHistory)
      : [];

  const prizeLine = buildQuestPrizeLine({
    prizeSummary: row.prize_summary,
    rewardXp: row.reward_xp,
    rewardFlexPercentBp: row.reward_flex_percent_bp,
    badgeLabel: row.badge_label,
  });

  return {
    campaignId: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    badgeLabel: row.badge_label,
    rewardXp: row.reward_xp,
    rewardFlexPercentBp: row.reward_flex_percent_bp,
    prizeLine,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    epigraph: content.storyEpigraph ?? null,
    eventDay,
    maxDay,
    solvedDays: state.solvedDays,
    showDashboardFab: nextDay != null,
    nextDay,
    puzzle,
    completed,
    rewardsGranted: progRow?.rewards_granted_at != null,
    recentAttempts,
  };
}

async function grantQuestRewards(
  userId: string,
  campaignId: string,
  row: {
    reward_xp: number;
    reward_flex_percent_bp: number;
    achievement_key: string;
    slug: string;
  }
): Promise<void> {
  const supabase = await createClient();
  const { data: grantRow } = await supabase
    .from("user_quest_campaign_progress")
    .select("rewards_granted_at")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (grantRow?.rewards_granted_at) return;

  const idBase = `quest:${campaignId}`;

  const xpOk = await grantQuestFinaleXp(userId, row.reward_xp);
  if (row.reward_xp > 0 && !xpOk) {
    console.error("grantQuestRewards: finale XP niet toegekend voor user", userId);
  }

  await grantFlexPercentOfCapBonus({
    percentBp: row.reward_flex_percent_bp,
    idempotencyKey: `${idBase}:flex_bonus`,
    reason: "platform_quest_finale",
    meta: { campaign_id: campaignId, slug: row.slug },
  });

  const { error: achErr } = await supabase.from("achievements").insert({
    user_id: userId,
    achievement_key: row.achievement_key,
    unlocked_at: new Date().toISOString(),
  } as never);
  if (achErr && (achErr as { code?: string }).code !== "23505") {
    console.error("quest achievement insert:", achErr.message);
  }

  await supabase
    .from("user_quest_campaign_progress")
    .update({
      rewards_granted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("campaign_id", campaignId);
}

export type SubmitQuestAnswerResult =
  | { ok: true; correct: true; unlockMessage?: string; unlockWord?: string; completed?: boolean }
  | { ok: true; correct: false; message: string }
  | { ok: false; error: string };

function validateAnswerForDay(def: QuestDayDef, state: QuestProgressState, rawAnswer: string): boolean {
  const norm = normalizeQuestAnswer(rawAnswer);
  if (def.kind === "coords" && def.acceptCoords) {
    return matchCoords(rawAnswer, def.acceptCoords);
  }
  if (def.kind === "multi" && def.steps?.length) {
    const sub = state.sub?.[String(def.day)] ?? 0;
    const step = def.steps[sub];
    if (!step) return false;
    return answerMatchesAccepts(norm, step.accepts);
  }
  if (!def.accepts?.length) return false;
  return answerMatchesAccepts(norm, def.accepts);
}

export async function submitQuestAnswer(campaignId: string, answer: string): Promise<SubmitQuestAnswerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Niet ingelogd." };

  const trimmed = answer.trim();
  if (!trimmed) return { ok: true, correct: false, message: "Vul een antwoord in." };

  const { row, error: loadErr } = await loadLiveCampaignRow(supabase);
  if (loadErr || !row || row.id !== campaignId) {
    return { ok: false, error: "Deze quest is nu niet beschikbaar." };
  }

  const content = parseQuestContent(row.content as Json);
  if (!content) return { ok: false, error: "Quest-inhoud ontbreekt." };

  const maxDay = Math.max(...content.days.map((d) => d.day), 1);
  const startYmd = isoToAmsterdamYmd(row.starts_at);
  const todayYmd = todayDateString();
  const eventDay = computeEventDayIndex(startYmd, todayYmd, maxDay);
  if (eventDay < 1) return { ok: false, error: "De quest is nog niet begonnen." };

  const { data: progRow } = await supabase
    .from("user_quest_campaign_progress")
    .select("state, rewards_granted_at, answer_log")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  let state = parseQuestProgressState((progRow?.state as Json) ?? undefined);
  const nextDay = resolveNextChallengeDay(content, eventDay, state);
  if (nextDay == null) {
    return { ok: true, correct: false, message: "Je hebt alles voor vandaag opgelost. Kom morgen terug." };
  }

  const def = getDayDef(content, nextDay);
  if (!def) return { ok: false, error: "Ongeldige dag." };

  const stepKey = challengeStepForLog(def, state, nextDay);
  const nowIso = new Date().toISOString();
  const correct = validateAnswerForDay(def, state, trimmed);

  if (!correct) {
    const wrongLog = appendAnswerLog(progRow?.answer_log as Json, {
      at: nowIso,
      day: nextDay,
      step: stepKey,
      answer: trimmed,
      correct: false,
    });
    const { error: wrongErr } = await supabase.from("user_quest_campaign_progress").upsert(
      {
        user_id: user.id,
        campaign_id: campaignId,
        state: toJsonState(state),
        answer_log: wrongLog,
        rewards_granted_at: progRow?.rewards_granted_at ?? null,
        updated_at: nowIso,
      } as TablesInsert<"user_quest_campaign_progress">,
      { onConflict: "user_id,campaign_id" }
    );
    if (wrongErr) return { ok: false, error: wrongErr.message };
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { ok: true, correct: false, message: "Niet correct. Probeer opnieuw." };
  }

  const newState: QuestProgressState = {
    solvedDays: [...state.solvedDays],
    sub: state.sub ? { ...state.sub } : undefined,
  };

  if (def.kind === "multi" && def.steps?.length) {
    const sub = newState.sub?.[String(def.day)] ?? 0;
    const nextSub = sub + 1;
    if (nextSub < def.steps.length) {
      newState.sub = { ...newState.sub, [String(def.day)]: nextSub };
    } else {
      if (!newState.solvedDays.includes(def.day)) newState.solvedDays.push(def.day);
      newState.solvedDays.sort((a, b) => a - b);
      if (newState.sub) {
        const { [String(def.day)]: _, ...rest } = newState.sub;
        newState.sub = Object.keys(rest).length ? rest : undefined;
      }
    }
  } else {
    if (!newState.solvedDays.includes(def.day)) newState.solvedDays.push(def.day);
    newState.solvedDays.sort((a, b) => a - b);
  }

  const okLog = appendAnswerLog(progRow?.answer_log as Json, {
    at: nowIso,
    day: nextDay,
    step: stepKey,
    answer: trimmed,
    correct: true,
  });

  const upsertPayload: TablesInsert<"user_quest_campaign_progress"> = {
    user_id: user.id,
    campaign_id: campaignId,
    state: toJsonState(newState),
    answer_log: okLog,
    rewards_granted_at: progRow?.rewards_granted_at ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: upErr } = await supabase.from("user_quest_campaign_progress").upsert(upsertPayload, {
    onConflict: "user_id,campaign_id",
  });
  if (upErr) return { ok: false, error: upErr.message };

  const fullyDone = isQuestFullyComplete(content, newState);
  if (fullyDone && !progRow?.rewards_granted_at) {
    await grantQuestRewards(user.id, campaignId, {
      reward_xp: row.reward_xp,
      reward_flex_percent_bp: row.reward_flex_percent_bp,
      achievement_key: row.achievement_key,
      slug: row.slug,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  const completedNow = isQuestFullyComplete(content, newState);
  const multiMidStep =
    def.kind === "multi" &&
    def.steps?.length &&
    !newState.solvedDays.includes(def.day);

  return {
    ok: true,
    correct: true,
    unlockMessage: multiMidStep ? "Goed. Eén stap verder…" : def.unlockMessage,
    unlockWord: multiMidStep ? undefined : def.unlockWord,
    completed: completedNow,
  };
}

/** Admin: upsert campaign by slug (creates if missing). Returns campaign id. */
export async function adminUpsertQuestCampaign(input: {
  slug?: string;
  title: string;
  tagline: string;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  content_json: string;
  reward_xp: number;
  reward_flex_percent_bp: number;
  achievement_key: string;
  badge_label: string;
  prize_summary?: string | null;
}) {
  const admin = await getAdminSessionUser();
  if (!admin) throw new Error("Geen beheerderstoegang.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(input.content_json) as unknown;
  } catch {
    throw new Error("Content is geen geldige JSON.");
  }
  const content = parseQuestContent(parsed as Json);
  if (!content || content.days.length < 1) throw new Error("Content moet een quest met minstens één dag bevatten.");

  const supabase = await createClient();
  const slug = (input.slug ?? DEFAULT_SLUG).trim() || DEFAULT_SLUG;
  const now = new Date().toISOString();

  const { data: existing } = await supabase.from("platform_quest_campaigns").select("id").eq("slug", slug).maybeSingle();

  const prizeTrim = input.prize_summary?.trim();
  const base = {
    slug,
    title: input.title.trim(),
    tagline: input.tagline.trim(),
    starts_at: input.starts_at,
    ends_at: input.ends_at && input.ends_at.length > 0 ? input.ends_at : null,
    active: input.active,
    content: parsed as Json,
    reward_xp: Math.max(0, Math.round(input.reward_xp)),
    reward_flex_percent_bp: Math.max(0, Math.min(10000, Math.round(input.reward_flex_percent_bp))),
    achievement_key: input.achievement_key.trim() || "the_unbreakable",
    badge_label: input.badge_label.trim() || "The Unbreakable",
    prize_summary: prizeTrim && prizeTrim.length > 0 ? prizeTrim : null,
    updated_at: now,
  };

  if (existing?.id) {
    const { error } = await supabase.from("platform_quest_campaigns").update(base).eq("id", existing.id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/quests");
    revalidatePath("/admin/games");
    return { id: existing.id };
  }
  const { data: inserted, error } = await supabase
    .from("platform_quest_campaigns")
    .insert({ ...base, created_at: now })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (!inserted?.id) throw new Error("Campagne aangemaakt maar geen id ontvangen.");
  revalidatePath("/admin/quests");
  revalidatePath("/admin/games");
  return { id: inserted.id as string };
}

/** Admin: quest onmiddellijk beëindigen — niet meer zichtbaar voor spelers. Zet `active` uit, eindigt het event indien nodig, en wist alle gebruikersvoortgang voor deze campagne. */
export async function adminStopQuestCampaign(campaignId: string) {
  const admin = await getAdminSessionUser();
  if (!admin) throw new Error("Geen beheerderstoegang.");

  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("platform_quest_campaigns")
    .select("starts_at, ends_at")
    .eq("id", campaignId)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("Campagne niet gevonden.");

  const nowIso = new Date().toISOString();
  const nowMs = Date.now();
  const startsMs = new Date(row.starts_at).getTime();

  const patch: { active: boolean; updated_at: string; ends_at?: string | null } = {
    active: false,
    updated_at: nowIso,
  };

  if (startsMs <= nowMs) {
    const curEndMs = row.ends_at ? new Date(row.ends_at).getTime() : Infinity;
    if (curEndMs > nowMs) patch.ends_at = nowIso;
  }

  const { error } = await supabase.from("platform_quest_campaigns").update(patch).eq("id", campaignId);
  if (error) throw new Error(error.message);

  const { error: delErr } = await supabase.from("user_quest_campaign_progress").delete().eq("campaign_id", campaignId);
  if (delErr) throw new Error(delErr.message);

  revalidatePath("/admin/quests");
  revalidatePath("/admin/games");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

export async function adminUpdateQuestPrizeSummary(input: { campaign_id: string; prize_summary: string }) {
  const admin = await getAdminSessionUser();
  if (!admin) throw new Error("Geen beheerderstoegang.");
  const supabase = await createClient();
  const t = input.prize_summary.trim();
  const { error } = await supabase
    .from("platform_quest_campaigns")
    .update({
      prize_summary: t.length > 0 ? t : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.campaign_id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
  revalidatePath("/admin/quests");
}

export async function getDefaultQuestContentJson(): Promise<string> {
  return JSON.stringify(getDefaultKatsuoQuestContent(), null, 2);
}

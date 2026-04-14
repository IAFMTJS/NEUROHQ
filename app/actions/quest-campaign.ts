"use server";

import { revalidatePath } from "next/cache";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { addXP } from "@/app/actions/xp";
import { grantFlexPercentOfCapBonus } from "@/app/actions/flex-budget";
import { notifyUsersNewPlatformLaunch } from "@/lib/platform-launch-push";
import { todayDateString } from "@/lib/utils/timezone";
import type { Json, TablesInsert } from "@/types/database.types";
import { getDefaultDictatorQuestContent } from "@/lib/quests/default-dictator-content";
import { getDefaultKatsuoQuestContent } from "@/lib/quests/default-katsuo-content";
import {
  hasQuestFinaleChoice,
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
  isPuzzlesComplete,
  matchCoords,
  needsFinaleChoiceSelection,
  normalizeQuestAnswer,
  resolveNextChallengeDay,
  isQuestFullyComplete,
} from "@/lib/quests/engine";
import { buildQuestPrizeLine } from "@/lib/quests/prize-line";
import { appendAnswerLog, recentAttemptsForPuzzle, type QuestRecentAttempt } from "@/lib/quests/answer-log";
import { buildQuestAnswerHistoryRows, type QuestAnswerHistoryDisplayRow } from "@/lib/quests/answer-history-display";

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
  /** Alle geregistreerde pogingen met bijbehorende vraagtekst (nieuwste eerst). */
  answerHistory: QuestAnswerHistoryDisplayRow[];
  /** Puzzels opgelost; speler moet HELPEN/STOPPEN kiezen. */
  needsFinaleChoice: boolean;
  finaleChoiceIntro?: string | null;
  finaleHelpLabel?: string | null;
  finaleStopLabel?: string | null;
  /** Na morele keuze: epiloog + slottekst (geen XP-bedragen). */
  finaleOutcomeText?: string | null;
};

type QuestStatusMode = "full" | "dock";

export type QuestDockPayload = {
  showDashboardFab: boolean;
};

function sanitizeQuestPaintingImageUrl(raw: string | undefined): string | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value.startsWith("/")) return undefined;
  return value;
}

function buildPuzzlePublic(def: QuestDayDef, state: QuestProgressState): QuestPuzzlePublic {
  if (def.kind === "paintings") {
    return {
      day: def.day,
      headline: def.headline,
      kind: "paintings",
      intro: def.intro,
      storyLine: def.storyLine,
      paintings: def.paintings?.map((p) => {
        const imageUrl = sanitizeQuestPaintingImageUrl(p.imageUrl);
        return {
          title: p.title,
          caption: p.caption,
          ...(imageUrl ? { imageUrl } : {}),
        };
      }),
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

function buildFinaleOutcomeText(content: QuestCampaignContent, choice: "help" | "stop"): string {
  const f = content.finaleChoice;
  if (!f) return "";
  const branch = choice === "help" ? f.help : f.stop;
  const parts = [branch.epilogue.trim()];
  if (f.closingThought?.trim()) parts.push(f.closingThought.trim());
  return parts.join("\n\n—\n\n");
}

/** Alleen service role — als gewone addXP faalt (edge cases). */
async function applyQuestFinaleXpServiceRoleFallback(userId: string, points: number): Promise<boolean> {
  if (points <= 0) return true;
  const admin = createServiceRoleClient();
  if (!admin) {
    console.error("applyQuestFinaleXpServiceRoleFallback: no service role client");
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
    console.error("quest finale XP fallback user_xp:", uerr.message);
    return false;
  }
  const { error: ierr } = await admin.from("xp_events").insert({
    user_id: userId,
    amount: points,
    source_type: "platform_quest_finale",
    task_id: null,
  });
  if (ierr) console.error("quest finale XP fallback xp_events:", ierr.message);
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

export async function getQuestCampaignPublicStatus(mode: "dock"): Promise<QuestDockPayload | null>;
export async function getQuestCampaignPublicStatus(mode?: "full"): Promise<QuestClientPayload | null>;
export async function getQuestCampaignPublicStatus(
  mode: QuestStatusMode = "full"
): Promise<QuestClientPayload | QuestDockPayload | null> {
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
  const needsFinale = needsFinaleChoiceSelection(content, state);
  if (mode === "dock") {
    return { showDashboardFab: nextDay != null || needsFinale };
  }
  const fc = content.finaleChoice;
  const choiceMade =
    state.finaleChoice === "help" || state.finaleChoice === "stop" ? state.finaleChoice : null;
  const finaleOutcomeText =
    choiceMade != null && fc ? buildFinaleOutcomeText(content, choiceMade) : null;
  const puzzle = nextDay != null ? buildPuzzlePublic(getDayDef(content, nextDay)!, state) : null;
  const stepForHistory =
    puzzle?.kind === "multi" && puzzle.stepIndex != null ? puzzle.stepIndex : null;
  const recentAttempts =
    puzzle != null
      ? recentAttemptsForPuzzle(progRow?.answer_log as Json, puzzle.day, stepForHistory)
      : [];

  const answerHistory = buildQuestAnswerHistoryRows(content, progRow?.answer_log as Json);

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
    showDashboardFab: nextDay != null || needsFinale,
    nextDay,
    puzzle,
    completed,
    rewardsGranted: progRow?.rewards_granted_at != null,
    recentAttempts,
    answerHistory,
    needsFinaleChoice: needsFinale,
    finaleChoiceIntro: needsFinale ? (fc?.intro ?? null) : null,
    finaleHelpLabel: needsFinale ? (fc?.help.label ?? null) : null,
    finaleStopLabel: needsFinale ? (fc?.stop.label ?? null) : null,
    finaleOutcomeText: finaleOutcomeText && finaleOutcomeText.length > 0 ? finaleOutcomeText : null,
  };
}

type QuestGrantRow = {
  reward_xp: number;
  reward_flex_percent_bp: number;
  achievement_key: string;
  slug: string;
  badge_label: string;
};

export type QuestClaimRewardsResult =
  | { ok: true; alreadyClaimed: true }
  | {
      ok: true;
      alreadyClaimed: false;
      xp: number;
      pointsApplied: number;
      flexPercentBp: number;
      flexAppliedCents: number | null;
      flexSkippedReason?: string;
      badgeLabel: string;
      levelUp: boolean;
      newLevel?: number;
      /** Quest met finale-keuze: story-XP kwam al bij HELPEN/STOPPEN; claim = flex/badge. */
      storyXpFromFinaleChoice?: boolean;
    }
  | { ok: false; error: string };

/** Eén keer uitvoeren na expliciet claimen; idempotent bij dubbele aanroep. */
async function grantQuestRewardsOnce(
  userId: string,
  campaignId: string,
  row: QuestGrantRow
): Promise<
  | { status: "already" }
  | {
      status: "granted";
      xp: number;
      pointsApplied: number;
      flexPercentBp: number;
      flexAppliedCents: number | null;
      flexSkippedReason?: string;
      badgeLabel: string;
      levelUp: boolean;
      newLevel?: number;
    }
> {
  const supabase = await createClient();
  const { data: grantRow } = await supabase
    .from("user_quest_campaign_progress")
    .select("rewards_granted_at")
    .eq("user_id", userId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (grantRow?.rewards_granted_at) return { status: "already" };

  const idBase = `quest:${campaignId}`;
  let pointsApplied = 0;
  let levelUp = false;
  let newLevel: number | undefined;

  if (row.reward_xp > 0) {
    const xpR = await addXP(row.reward_xp, {
      source_type: "platform_quest_finale",
      skipOverdriveMultiplier: true,
    });
    if (xpR) {
      pointsApplied = xpR.pointsApplied;
      levelUp = xpR.levelUp;
      newLevel = xpR.newLevel;
    } else {
      const xpOk = await applyQuestFinaleXpServiceRoleFallback(userId, row.reward_xp);
      if (!xpOk) console.error("grantQuestRewardsOnce: finale XP niet toegekend voor user", userId);
      else pointsApplied = row.reward_xp;
    }
  }

  let flexAppliedCents: number | null = null;
  let flexSkippedReason: string | undefined;
  const flexRes = await grantFlexPercentOfCapBonus({
    percentBp: row.reward_flex_percent_bp,
    idempotencyKey: `${idBase}:flex_bonus`,
    reason: "platform_quest_finale",
    meta: { campaign_id: campaignId, slug: row.slug },
  });
  if ("appliedCents" in flexRes) flexAppliedCents = flexRes.appliedCents;
  else flexSkippedReason = flexRes.reason;

  const { error: achErr } = await supabase.from("achievements").insert({
    user_id: userId,
    achievement_key: row.achievement_key,
    unlocked_at: new Date().toISOString(),
  } as never);
  if (achErr && (achErr as { code?: string }).code !== "23505") {
    console.error("quest achievement insert:", achErr.message);
  }

  const nowIso = new Date().toISOString();
  await supabase
    .from("user_quest_campaign_progress")
    .update({
      rewards_granted_at: nowIso,
      updated_at: nowIso,
    })
    .eq("user_id", userId)
    .eq("campaign_id", campaignId);

  return {
    status: "granted",
    xp: row.reward_xp,
    pointsApplied,
    flexPercentBp: row.reward_flex_percent_bp,
    flexAppliedCents,
    flexSkippedReason,
    badgeLabel: row.badge_label,
    levelUp,
    newLevel,
  };
}

export async function claimQuestCampaignRewards(campaignId: string): Promise<QuestClaimRewardsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Niet ingelogd." };

  const { data: row, error: rowErr } = await supabase
    .from("platform_quest_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (rowErr || !row) return { ok: false, error: "Quest niet gevonden." };

  const content = parseQuestContent(row.content as Json);
  if (!content) return { ok: false, error: "Quest-inhoud ontbreekt." };

  const { data: progRow } = await supabase
    .from("user_quest_campaign_progress")
    .select("state, rewards_granted_at")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (!progRow) return { ok: false, error: "Geen voortgang voor deze quest." };

  const state = parseQuestProgressState((progRow.state as Json) ?? undefined);
  if (!isQuestFullyComplete(content, state)) {
    return { ok: false, error: "Quest is nog niet voltooid." };
  }

  const g = await grantQuestRewardsOnce(user.id, campaignId, {
    reward_xp: hasQuestFinaleChoice(content) ? 0 : row.reward_xp,
    reward_flex_percent_bp: row.reward_flex_percent_bp,
    achievement_key: row.achievement_key,
    slug: row.slug,
    badge_label: row.badge_label,
  });

  if (g.status === "already") return { ok: true, alreadyClaimed: true };

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/budget");
  revalidatePath("/learning");

  return {
    ok: true,
    alreadyClaimed: false,
    xp: g.xp,
    pointsApplied: g.pointsApplied,
    flexPercentBp: g.flexPercentBp,
    flexAppliedCents: g.flexAppliedCents,
    flexSkippedReason: g.flexSkippedReason,
    badgeLabel: g.badgeLabel,
    levelUp: g.levelUp,
    newLevel: g.newLevel,
    storyXpFromFinaleChoice: hasQuestFinaleChoice(content),
  };
}

export type SubmitQuestAnswerResult =
  | {
      ok: true;
      correct: true;
      unlockMessage?: string;
      unlockWord?: string;
      /** True wanneer puzzels + eventuele finale-keuze rond zijn (claim beschikbaar). */
      completed?: boolean;
      /** Puzzels af; speler moet nog HELPEN/STOPPEN kiezen (geen XP-toast voor “quest klaar”). */
      awaitingFinaleChoice?: boolean;
    }
  | { ok: true; correct: false; message: string }
  | { ok: false; error: string };

export type SubmitQuestFinaleChoiceResult =
  | {
      ok: true;
      already?: boolean;
      choiceXpGranted?: number;
      levelUp?: boolean;
      newLevel?: number;
    }
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
    if (needsFinaleChoiceSelection(content, state)) {
      return {
        ok: false,
        error: "Maak eerst je finale keuze in het questscherm (HELPEN of STOPPEN).",
      };
    }
    if (isPuzzlesComplete(content, state)) {
      return { ok: false, error: "Deze quest is al afgerond." };
    }
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

  revalidatePath("/dashboard");
  revalidatePath("/profile");

  const completedNow = isQuestFullyComplete(content, newState);
  const awaitingFinaleChoice =
    isPuzzlesComplete(content, newState) && hasQuestFinaleChoice(content) && !newState.finaleChoice;
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
    ...(awaitingFinaleChoice ? { awaitingFinaleChoice: true } : {}),
  };
}

export async function submitQuestFinaleChoice(
  campaignId: string,
  choice: "help" | "stop"
): Promise<SubmitQuestFinaleChoiceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Niet ingelogd." };

  const { row, error: loadErr } = await loadLiveCampaignRow(supabase);
  if (loadErr || !row || row.id !== campaignId) {
    return { ok: false, error: "Deze quest is nu niet beschikbaar." };
  }

  const content = parseQuestContent(row.content as Json);
  if (!content || !hasQuestFinaleChoice(content) || !content.finaleChoice) {
    return { ok: false, error: "Deze quest heeft geen finale keuze." };
  }

  const { data: progRow } = await supabase
    .from("user_quest_campaign_progress")
    .select("state, rewards_granted_at, answer_log")
    .eq("user_id", user.id)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (!progRow) return { ok: false, error: "Geen voortgang voor deze quest." };

  const state = parseQuestProgressState((progRow.state as Json) ?? undefined);
  if (!isPuzzlesComplete(content, state)) {
    return { ok: false, error: "Los eerst alle puzzels op." };
  }
  if (state.finaleChoice === "help" || state.finaleChoice === "stop") {
    return { ok: true, already: true };
  }

  const xp =
    choice === "help" ? content.finaleChoice.help.xp : content.finaleChoice.stop.xp;
  const newState: QuestProgressState = {
    ...state,
    finaleChoice: choice,
  };
  const nowIso = new Date().toISOString();
  const logJson: Json = (progRow.answer_log as Json) ?? ([] as unknown as Json);
  const { error: upErr } = await supabase.from("user_quest_campaign_progress").upsert(
    {
      user_id: user.id,
      campaign_id: campaignId,
      state: toJsonState(newState),
      answer_log: logJson,
      rewards_granted_at: progRow.rewards_granted_at ?? null,
      updated_at: nowIso,
    } as TablesInsert<"user_quest_campaign_progress">,
    { onConflict: "user_id,campaign_id" }
  );
  if (upErr) return { ok: false, error: upErr.message };

  let levelUp = false;
  let newLevel: number | undefined;
  let granted = 0;
  if (xp > 0) {
    const xpR = await addXP(xp, {
      source_type: "platform_quest_finale",
      skipOverdriveMultiplier: true,
    });
    if (xpR) {
      granted = xpR.pointsApplied;
      levelUp = xpR.levelUp;
      newLevel = xpR.newLevel;
    } else {
      const okFb = await applyQuestFinaleXpServiceRoleFallback(user.id, xp);
      if (!okFb) console.error("submitQuestFinaleChoice: XP niet toegekend", user.id);
      else granted = xp;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  revalidatePath("/learning");

  return {
    ok: true,
    choiceXpGranted: granted,
    ...(levelUp && newLevel != null ? { levelUp: true, newLevel } : {}),
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
  try {
    await notifyUsersNewPlatformLaunch({
      kind: "quest",
      launchId: inserted.id as string,
      title: base.title,
      startsAt: base.starts_at,
      preview: base.tagline,
      url: "/dashboard",
    });
  } catch (err) {
    console.warn("[push] quest launch push failed", { questId: inserted.id, err });
  }
  revalidatePath("/admin/quests");
  revalidatePath("/admin/games");
  return { id: inserted.id as string };
}

/**
 * Admin: quest-run verwijderen — niet meer zichtbaar voor spelers.
 * Verwijdert de campagne-instantie (user-voortgang valt weg via cascade) en voegt een inactief sjabloon toe
 * (zelfde slug/inhoud/beloningen; start op placeholder-datum tot je opnieuw plant).
 */
export async function adminStopQuestCampaign(campaignId: string): Promise<{ id: string }> {
  const admin = await getAdminSessionUser();
  if (!admin) throw new Error("Geen beheerderstoegang.");

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_archive_quest_campaign_to_template", {
    p_campaign_id: campaignId,
  });
  if (error) throw new Error(error.message);
  const id = typeof data === "string" ? data : data != null ? String(data) : "";
  if (!id) throw new Error("Geen nieuwe sjabloon-id ontvangen. Draai migratie 119_quest_archive_to_template.sql.");

  revalidatePath("/admin/quests");
  revalidatePath("/admin/games");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { id };
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

export async function getDictatorQuestContentJson(): Promise<string> {
  return JSON.stringify(getDefaultDictatorQuestContent(), null, 2);
}

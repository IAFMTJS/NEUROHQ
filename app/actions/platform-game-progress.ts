"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { addXP } from "@/app/actions/xp";
import { grantFlexPercentOfCapBonus } from "@/app/actions/flex-budget";
import type { Database, Json } from "@/types/database.types";
import { isPlatformGameLive } from "@/lib/platform-games";
import {
  answerWin,
  checklistWin,
  parsePlatformGameProgressSpec,
  parseProgressState,
  type PlatformGameAutoPublic,
  type PlatformGameStateShape,
} from "@/lib/platform-games-config";
import { evaluatePlatformGameAutoRules } from "@/lib/platform-games-metrics-eval";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  return { supabase, userId: user.id };
}

type GameRowMini = { id: string; starts_at: string; ends_at: string | null; config: Json; title: string };

/**
 * Evalueert auto-metrische regels en zet completed_at bij win — beloning pas na claim.
 */
export async function evaluateAndSyncAutoPlatformGame(
  supabase: SupabaseClient<Database>,
  userId: string,
  game: GameRowMini
): Promise<{ autoPublic: PlatformGameAutoPublic | null; completedAt: string | null }> {
  const spec = parsePlatformGameProgressSpec(game.config);
  if (spec.mode !== "auto" || spec.autoRules.length === 0) {
    return { autoPublic: null, completedAt: null };
  }

  const { data: row } = await supabase
    .from("user_platform_game_progress")
    .select("state, completed_at, rewards_granted_at")
    .eq("user_id", userId)
    .eq("game_id", game.id)
    .maybeSingle();

  const existingCompleted = row?.completed_at ?? null;

  const { satisfied, results } = await evaluatePlatformGameAutoRules(
    supabase,
    userId,
    game.starts_at,
    game.ends_at,
    spec.autoRules,
    spec.autoWinLogic
  );

  const autoPublic: PlatformGameAutoPublic = {
    winLogic: spec.autoWinLogic,
    rules: results,
    satisfied,
  };

  if (satisfied && !existingCompleted) {
    const nowIso = new Date().toISOString();
    const prev = parseProgressState(row?.state as Json);
    const { error } = await supabase.from("user_platform_game_progress").upsert(
      {
        user_id: userId,
        game_id: game.id,
        state: prev as unknown as Json,
        updated_at: nowIso,
        completed_at: nowIso,
        rewards_granted_at: row?.rewards_granted_at ?? null,
      },
      { onConflict: "user_id,game_id" }
    );
    if (!error) {
      revalidatePath("/profile");
      revalidatePath("/dashboard");
      return { autoPublic, completedAt: nowIso };
    }
  }

  return { autoPublic, completedAt: existingCompleted };
}

async function loadLiveGame(supabase: Awaited<ReturnType<typeof createClient>>, gameId: string) {
  const { data: game, error } = await supabase.from("platform_games").select("*").eq("id", gameId).maybeSingle();
  if (error) return { error: error.message } as const;
  if (!game) return { error: "Game niet gevonden." } as const;
  if (
    !isPlatformGameLive(
      {
        active: game.active ?? true,
        starts_at: game.starts_at,
        ends_at: game.ends_at,
      },
      Date.now()
    )
  ) {
    return { error: "Deze game is niet actief." } as const;
  }
  return { game } as const;
}

async function loadGameRowForClaim(supabase: Awaited<ReturnType<typeof createClient>>, gameId: string) {
  const { data: game, error } = await supabase.from("platform_games").select("*").eq("id", gameId).maybeSingle();
  if (error) return { error: error.message ?? "Game niet gevonden." } as const;
  if (!game) return { error: "Game niet gevonden." } as const;
  return { game } as const;
}

/** Checklist-stap aan/uit; zet completed_at wanneer alle vakjes aan staan (beloning via claim). */
export async function setPlatformGameChecklistItem(gameId: string, itemId: string, done: boolean) {
  const { supabase, userId } = await requireUser();
  const live = await loadLiveGame(supabase, gameId);
  if ("error" in live) throw new Error(live.error);

  const spec = parsePlatformGameProgressSpec(live.game.config as Json);
  if (spec.mode !== "checklist") throw new Error("Deze game gebruikt geen checklist.");
  if (!spec.checklist.some((i) => i.id === itemId)) throw new Error("Ongeldige stap.");

  const { data: row } = await supabase
    .from("user_platform_game_progress")
    .select("state, completed_at, rewards_granted_at")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .maybeSingle();

  const existingCompleted = row?.completed_at ?? null;
  const prev = parseProgressState(row?.state as Json);
  const checklist = { ...prev.checklist, [itemId]: done };
  const newState: PlatformGameStateShape = { checklist };

  const won = !existingCompleted && checklistWin(spec, checklist);
  const nowIso = new Date().toISOString();
  const completed_at = existingCompleted ?? (won ? nowIso : null);

  const { error } = await supabase.from("user_platform_game_progress").upsert(
    {
      user_id: userId,
      game_id: gameId,
      state: newState as unknown as Json,
      updated_at: nowIso,
      completed_at,
      rewards_granted_at: row?.rewards_granted_at ?? null,
    },
    { onConflict: "user_id,game_id" }
  );
  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    completed: Boolean(completed_at),
    needsRewardClaim: Boolean(completed_at) && !(row?.rewards_granted_at ?? null),
  };
}

/** Antwoord indienen voor answer-mode; win zet completed_at — beloning via claim. */
export async function submitPlatformGameAnswer(gameId: string, rawAnswer: string) {
  const { supabase, userId } = await requireUser();
  const live = await loadLiveGame(supabase, gameId);
  if ("error" in live) return { ok: false as const, error: live.error };

  const spec = parsePlatformGameProgressSpec(live.game.config as Json);
  if (spec.mode !== "answer") return { ok: false as const, error: "Deze game vraagt geen antwoord." };

  const { data: row } = await supabase
    .from("user_platform_game_progress")
    .select("state, completed_at, rewards_granted_at")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .maybeSingle();

  if (row?.completed_at) {
    return {
      ok: true as const,
      completed: true as const,
      message: spec.winMessage ?? "Je had deze game al voltooid.",
    };
  }

  if (!answerWin(spec, rawAnswer)) {
    return { ok: false as const, error: "Dat is niet het juiste antwoord." };
  }

  const nowIso = new Date().toISOString();
  const prev = parseProgressState(row?.state as Json);
  const { error } = await supabase.from("user_platform_game_progress").upsert(
    {
      user_id: userId,
      game_id: gameId,
      state: (prev as PlatformGameStateShape) as unknown as Json,
      updated_at: nowIso,
      completed_at: nowIso,
      rewards_granted_at: row?.rewards_granted_at ?? null,
    },
    { onConflict: "user_id,game_id" }
  );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    completed: true as const,
    message: spec.winMessage ?? "Goed zo!",
  };
}

export type PlatformGameClaimRewardsResult =
  | { ok: true; alreadyClaimed: true }
  | {
      ok: true;
      alreadyClaimed: false;
      xp: number;
      pointsApplied: number;
      flexPercentBp: number;
      flexAppliedCents: number | null;
      flexSkippedReason?: string;
      levelUp: boolean;
      newLevel?: number;
    }
  | { ok: false; error: string };

export async function claimPlatformGameRewards(gameId: string): Promise<PlatformGameClaimRewardsResult> {
  const { supabase, userId } = await requireUser();
  const live = await loadGameRowForClaim(supabase, gameId);
  if ("error" in live) return { ok: false, error: live.error ?? "Game niet gevonden." };

  const spec = parsePlatformGameProgressSpec(live.game.config as Json);
  const { data: prog } = await supabase
    .from("user_platform_game_progress")
    .select("completed_at, rewards_granted_at")
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .maybeSingle();

  if (!prog?.completed_at) return { ok: false, error: "Game is nog niet voltooid." };
  if (prog.rewards_granted_at) return { ok: true, alreadyClaimed: true };

  if (spec.rewardXp <= 0 && spec.rewardFlexPercentBp <= 0) {
    const nowIso = new Date().toISOString();
    await supabase
      .from("user_platform_game_progress")
      .update({ rewards_granted_at: nowIso, updated_at: nowIso })
      .eq("user_id", userId)
      .eq("game_id", gameId);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return {
      ok: true,
      alreadyClaimed: false,
      xp: 0,
      pointsApplied: 0,
      flexPercentBp: 0,
      flexAppliedCents: null,
      levelUp: false,
    };
  }

  let pointsApplied = 0;
  let levelUp = false;
  let newLevel: number | undefined;
  if (spec.rewardXp > 0) {
    const xpR = await addXP(spec.rewardXp, { source_type: "platform_game_win", skipOverdriveMultiplier: true });
    if (xpR) {
      pointsApplied = xpR.pointsApplied;
      levelUp = xpR.levelUp;
      newLevel = xpR.newLevel;
    }
  }

  let flexAppliedCents: number | null = null;
  let flexSkippedReason: string | undefined;
  if (spec.rewardFlexPercentBp > 0) {
    const flexRes = await grantFlexPercentOfCapBonus({
      percentBp: spec.rewardFlexPercentBp,
      idempotencyKey: `platform_game:${gameId}:flex_bonus`,
      reason: "platform_game_win",
      meta: { game_id: gameId, title: live.game.title },
    });
    if ("appliedCents" in flexRes) flexAppliedCents = flexRes.appliedCents;
    else flexSkippedReason = flexRes.reason;
  }

  const nowIso = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("user_platform_game_progress")
    .update({ rewards_granted_at: nowIso, updated_at: nowIso })
    .eq("user_id", userId)
    .eq("game_id", gameId);
  if (upErr) return { ok: false, error: upErr.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/budget");

  return {
    ok: true,
    alreadyClaimed: false,
    xp: spec.rewardXp,
    pointsApplied,
    flexPercentBp: spec.rewardFlexPercentBp,
    flexAppliedCents,
    flexSkippedReason,
    levelUp,
    newLevel,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addXP } from "@/app/actions/xp";
import type { Json } from "@/types/database.types";
import { isPlatformGameLive } from "@/lib/platform-games";
import {
  answerWin,
  checklistWin,
  parsePlatformGameProgressSpec,
  parseProgressState,
  type PlatformGameStateShape,
} from "@/lib/platform-games-config";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");
  return { supabase, userId: user.id };
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

/** Checklist-stap aan/uit; zet completed_at wanneer alle vakjes aan staan. */
export async function setPlatformGameChecklistItem(gameId: string, itemId: string, done: boolean) {
  const { supabase, userId } = await requireUser();
  const live = await loadLiveGame(supabase, gameId);
  if ("error" in live) throw new Error(live.error);

  const spec = parsePlatformGameProgressSpec(live.game.config as Json);
  if (spec.mode !== "checklist") throw new Error("Deze game gebruikt geen checklist.");
  if (!spec.checklist.some((i) => i.id === itemId)) throw new Error("Ongeldige stap.");

  const { data: row } = await supabase
    .from("user_platform_game_progress")
    .select("state, completed_at")
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
    },
    { onConflict: "user_id,game_id" }
  );
  if (error) throw new Error(error.message);

  if (won && spec.rewardXp > 0) {
    await addXP(spec.rewardXp, { source_type: "platform_game_win", skipOverdriveMultiplier: true });
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true as const, completed: Boolean(completed_at) };
}

/** Antwoord indienen voor answer-mode; accepts alleen server-side. */
export async function submitPlatformGameAnswer(gameId: string, rawAnswer: string) {
  const { supabase, userId } = await requireUser();
  const live = await loadLiveGame(supabase, gameId);
  if ("error" in live) return { ok: false as const, error: live.error };

  const spec = parsePlatformGameProgressSpec(live.game.config as Json);
  if (spec.mode !== "answer") return { ok: false as const, error: "Deze game vraagt geen antwoord." };

  const { data: row } = await supabase
    .from("user_platform_game_progress")
    .select("state, completed_at")
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
    },
    { onConflict: "user_id,game_id" }
  );
  if (error) return { ok: false as const, error: error.message };

  if (spec.rewardXp > 0) {
    await addXP(spec.rewardXp, { source_type: "platform_game_win", skipOverdriveMultiplier: true });
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return {
    ok: true as const,
    completed: true as const,
    message: spec.winMessage ?? "Goed zo!",
  };
}

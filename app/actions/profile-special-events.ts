"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformEventLive } from "@/lib/platform-events";
import { isPlatformGameLive } from "@/lib/platform-games";
import {
  parsePlatformGameProgressSpec,
  parseProgressState,
  publicPlatformGameConfig,
  type PlatformGameAutoPublic,
} from "@/lib/platform-games-config";
import type { Json } from "@/types/database.types";
import { getQuestCampaignPublicStatus, type QuestClientPayload } from "@/app/actions/quest-campaign";
import { evaluateAndSyncAutoPlatformGame } from "@/app/actions/platform-game-progress";

export type ProfileSpecialEventRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
};

/** Zichtbare interactie (geen geheime accepts); afgeleid server-side uit volledige config. */
export type ProfileGameInteraction = {
  mode: "none" | "checklist" | "answer" | "auto";
  checklist: { id: string; label: string }[];
  prompt: string | null;
  answerPlaceholder: string | null;
  winMessage: string | null;
  /** Live meting (taken, learning, …) — null tenzij mode auto. */
  auto: PlatformGameAutoPublic | null;
};

export type ProfileSpecialGameRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  config: Json;
  interaction: ProfileGameInteraction;
  completedAt: string | null;
  checklistState: Record<string, boolean>;
};

export type ProfileSpecialEventsBundle = {
  events: ProfileSpecialEventRow[];
  games: ProfileSpecialGameRow[];
  quest: QuestClientPayload | null;
};

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/**
 * Live platform-games met dezelfde voortgang/sync als op het profiel (incl. auto-meting + XP).
 * Gebruikt door profiel-bundle, /api/platform-games en overal waar games server-side nodig zijn.
 */
export async function getPlatformGamesForSession(
  supabase: SupabaseServer,
  userId: string,
  nowMs: number = Date.now()
): Promise<ProfileSpecialGameRow[]> {
  const { data: gRes, error } = await supabase
    .from("platform_games")
    .select("id, title, body, starts_at, ends_at, active, config")
    .order("starts_at", { ascending: false });
  if (error) return [];

  const liveGameRows = (gRes ?? []).filter((row) =>
    isPlatformGameLive(
      { active: row.active ?? true, starts_at: row.starts_at, ends_at: row.ends_at },
      nowMs
    )
  );

  const gameIds = liveGameRows.map((g) => g.id);
  const progByGame: Record<string, { state: Json; completed_at: string | null }> = {};
  if (gameIds.length > 0) {
    const { data: progRows, error: progErr } = await supabase
      .from("user_platform_game_progress")
      .select("game_id, state, completed_at")
      .eq("user_id", userId)
      .in("game_id", gameIds);
    if (!progErr) {
      for (const p of progRows ?? []) {
        progByGame[p.game_id] = { state: p.state as Json, completed_at: p.completed_at };
      }
    }
  }

  const games: ProfileSpecialGameRow[] = [];
  for (const g of liveGameRows) {
    const spec = parsePlatformGameProgressSpec(g.config as Json);
    let pr = progByGame[g.id];
    let autoPublic: PlatformGameAutoPublic | null = null;

    if (spec.mode === "auto" && spec.autoRules.length > 0) {
      const sync = await evaluateAndSyncAutoPlatformGame(supabase, userId, {
        id: g.id,
        starts_at: g.starts_at,
        ends_at: g.ends_at,
        config: g.config as Json,
      });
      autoPublic = sync.autoPublic;
      if (sync.completedAt) {
        pr = {
          state: (pr?.state as Json) ?? null,
          completed_at: sync.completedAt,
        };
      }
    }

    const checklistState = parseProgressState(pr?.state as Json).checklist ?? {};
    const interaction: ProfileGameInteraction = {
      mode: spec.mode,
      checklist: spec.checklist,
      prompt: spec.prompt,
      answerPlaceholder: spec.answerPlaceholder,
      winMessage: spec.winMessage,
      auto: autoPublic,
    };
    games.push({
      id: g.id,
      title: g.title,
      body: g.body,
      starts_at: g.starts_at,
      ends_at: g.ends_at,
      config: publicPlatformGameConfig(g.config as Json),
      interaction,
      completedAt: pr?.completed_at ?? null,
      checklistState,
    });
  }

  return games;
}

/** Voor API-routes: zelfde payload als profiel-games (sync + auto-evaluatie). */
export async function getPlatformGamesForCurrentUser(): Promise<ProfileSpecialGameRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getPlatformGamesForSession(supabase, user.id);
}

export async function getProfileSpecialEventsBundle(): Promise<ProfileSpecialEventsBundle | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = Date.now();

  const [evRes, quest, games] = await Promise.all([
    supabase.from("platform_events").select("id, title, body, starts_at, ends_at, active").order("starts_at", { ascending: false }),
    getQuestCampaignPublicStatus(),
    getPlatformGamesForSession(supabase, user.id, now),
  ]);

  const events = (evRes.data ?? []).filter((row) =>
    isPlatformEventLive(
      { active: row.active ?? true, starts_at: row.starts_at, ends_at: row.ends_at },
      now
    )
  ) as ProfileSpecialEventRow[];

  return { events, games, quest };
}

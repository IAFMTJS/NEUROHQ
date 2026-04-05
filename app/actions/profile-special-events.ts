"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformEventLive } from "@/lib/platform-events";
import { isPlatformGameLive } from "@/lib/platform-games";
import {
  parsePlatformGameProgressSpec,
  parseProgressState,
  publicPlatformGameConfig,
} from "@/lib/platform-games-config";
import type { Json } from "@/types/database.types";
import { getQuestCampaignPublicStatus, type QuestClientPayload } from "@/app/actions/quest-campaign";

export type ProfileSpecialEventRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
};

/** Zichtbare interactie (geen geheime accepts); afgeleid server-side uit volledige config. */
export type ProfileGameInteraction = {
  mode: "none" | "checklist" | "answer";
  checklist: { id: string; label: string }[];
  prompt: string | null;
  answerPlaceholder: string | null;
  winMessage: string | null;
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

export async function getProfileSpecialEventsBundle(): Promise<ProfileSpecialEventsBundle | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const now = Date.now();

  const [evRes, gRes, quest] = await Promise.all([
    supabase.from("platform_events").select("id, title, body, starts_at, ends_at, active").order("starts_at", { ascending: false }),
    supabase.from("platform_games").select("id, title, body, starts_at, ends_at, active, config").order("starts_at", { ascending: false }),
    getQuestCampaignPublicStatus(),
  ]);

  const events = (evRes.data ?? []).filter((row) =>
    isPlatformEventLive(
      { active: row.active ?? true, starts_at: row.starts_at, ends_at: row.ends_at },
      now
    )
  ) as ProfileSpecialEventRow[];

  const liveGameRows = (gRes.data ?? []).filter((row) =>
    isPlatformGameLive(
      { active: row.active ?? true, starts_at: row.starts_at, ends_at: row.ends_at },
      now
    )
  );

  const gameIds = liveGameRows.map((g) => g.id);
  const progByGame: Record<string, { state: Json; completed_at: string | null }> = {};
  if (gameIds.length > 0) {
    const { data: progRows, error: progErr } = await supabase
      .from("user_platform_game_progress")
      .select("game_id, state, completed_at")
      .eq("user_id", user.id)
      .in("game_id", gameIds);
    if (!progErr) {
      for (const p of progRows ?? []) {
        progByGame[p.game_id] = { state: p.state as Json, completed_at: p.completed_at };
      }
    }
  }

  const games: ProfileSpecialGameRow[] = liveGameRows.map((g) => {
    const spec = parsePlatformGameProgressSpec(g.config as Json);
    const pr = progByGame[g.id];
    const checklistState = parseProgressState(pr?.state).checklist ?? {};
    const interaction: ProfileGameInteraction = {
      mode: spec.mode,
      checklist: spec.checklist,
      prompt: spec.prompt,
      answerPlaceholder: spec.answerPlaceholder,
      winMessage: spec.winMessage,
    };
    return {
      id: g.id,
      title: g.title,
      body: g.body,
      starts_at: g.starts_at,
      ends_at: g.ends_at,
      config: publicPlatformGameConfig(g.config as Json),
      interaction,
      completedAt: pr?.completed_at ?? null,
      checklistState,
    };
  });

  return { events, games, quest };
}

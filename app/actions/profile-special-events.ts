"use server";

import { createClient } from "@/lib/supabase/server";
import { isPlatformEventLive } from "@/lib/platform-events";
import { isPlatformGameLive } from "@/lib/platform-games";
import type { Json } from "@/types/database.types";
import { getQuestCampaignPublicStatus, type QuestClientPayload } from "@/app/actions/quest-campaign";

export type ProfileSpecialEventRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
};

export type ProfileSpecialGameRow = {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  config: Json;
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

  const games = (gRes.data ?? []).filter((row) =>
    isPlatformGameLive(
      { active: row.active ?? true, starts_at: row.starts_at, ends_at: row.ends_at },
      now
    )
  ) as ProfileSpecialGameRow[];

  return { events, games, quest };
}

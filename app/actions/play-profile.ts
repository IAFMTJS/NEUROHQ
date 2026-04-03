"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database.types";
import {
  EMPTY_PLAY_PROFILE_DOCUMENT,
  PLAY_PROFILE_SCHEMA_VERSION,
  type PlayProfileDocument,
} from "@/types/play-profile.types";

/** ~900KB — JSONB can be large; cap avoids abuse. */
const MAX_PLAY_PROFILE_BYTES = 900_000;

function normalizePlayProfile(raw: unknown): PlayProfileDocument {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...EMPTY_PLAY_PROFILE_DOCUMENT };
  }
  const o = raw as Record<string, unknown>;
  const sv = o.schemaVersion === 1 ? 1 : PLAY_PROFILE_SCHEMA_VERSION;
  const dataRaw = o.data;
  const data =
    dataRaw != null && typeof dataRaw === "object" && !Array.isArray(dataRaw)
      ? { ...(dataRaw as Record<string, unknown>) }
      : {};
  return { schemaVersion: sv, data };
}

export async function getPlayProfileDocument(): Promise<PlayProfileDocument> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ...EMPTY_PLAY_PROFILE_DOCUMENT };

  const { data } = await supabase
    .from("behavior_profile")
    .select("play_profile")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = data as { play_profile?: unknown } | null;
  return normalizePlayProfile(row?.play_profile);
}

export async function updatePlayProfileDocument(
  doc: PlayProfileDocument
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Niet ingelogd." };

  const payload: PlayProfileDocument = {
    schemaVersion: PLAY_PROFILE_SCHEMA_VERSION,
    data: doc.data && typeof doc.data === "object" && !Array.isArray(doc.data) ? doc.data : {},
  };

  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    return { ok: false, error: "Ongeldige gegevens." };
  }
  if (json.length > MAX_PLAY_PROFILE_BYTES) {
    return { ok: false, error: "Play-profiel is te groot. Verkort teksten of verwijder een deel." };
  }

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("behavior_profile")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("behavior_profile")
      .update({ play_profile: payload as unknown as Json, updated_at: now })
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("behavior_profile").insert({
      user_id: user.id,
      play_profile: payload as unknown as Json,
      updated_at: now,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/tasks");
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import type { Json, TablesInsert } from "@/types/database.types";

async function requireAdmin() {
  const admin = await getAdminSessionUser();
  if (!admin) throw new Error("Geen beheerderstoegang.");
  return admin;
}

function parseConfigJson(raw: string): Json {
  const t = raw.trim();
  if (!t) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(t) as unknown;
  } catch {
    throw new Error("Config is geen geldige JSON.");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Config moet een JSON-object zijn (geen array).");
  }
  return parsed as Json;
}

export async function createPlatformGame(input: {
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  config_json: string;
}) {
  await requireAdmin();
  const config = parseConfigJson(input.config_json);
  const supabase = await createClient();
  const now = new Date().toISOString();
  const row: TablesInsert<"platform_games"> = {
    title: input.title.trim(),
    body: input.body.trim(),
    starts_at: input.starts_at,
    ends_at: input.ends_at && input.ends_at.length > 0 ? input.ends_at : null,
    active: input.active,
    config,
    updated_at: now,
  };
  const { error } = await supabase.from("platform_games").insert(row);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
}

export async function updatePlatformGame(input: {
  id: string;
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
  config_json: string;
}) {
  await requireAdmin();
  const config = parseConfigJson(input.config_json);
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_games")
    .update({
      title: input.title.trim(),
      body: input.body.trim(),
      starts_at: input.starts_at,
      ends_at: input.ends_at && input.ends_at.length > 0 ? input.ends_at : null,
      active: input.active,
      config,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
}

export async function setPlatformGameActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_games")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
}

/** Admin: game onmiddellijk beëindigen — `active` uit, en `ends_at` op nu als het venster nog open was (past binnen de DB-check). */
export async function stopPlatformGameNow(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: row, error: fetchErr } = await supabase
    .from("platform_games")
    .select("starts_at, ends_at")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!row) throw new Error("Game niet gevonden.");

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

  const { error } = await supabase.from("platform_games").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
}

export async function deletePlatformGame(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("platform_games").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/games");
}

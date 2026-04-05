"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type GrowthFocusState = {
  slug: string | null;
  locale: string;
};

/** Cached per request — Learning Growth command center. */
export const getGrowthFocus = cache(async (): Promise<GrowthFocusState> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { slug: null, locale: "nl" };

  const { data, error } = await supabase
    .from("user_preferences")
    .select("growth_focus_protocol_slug, growth_focus_protocol_locale")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    const msg = error.message ?? "";
    if (error.code === "42703" || msg.includes("growth_focus") || msg.toLowerCase().includes("schema cache")) {
      return { slug: null, locale: "nl" };
    }
    throw new Error(error.message);
  }

  if (!data) return { slug: null, locale: "nl" };
  const row = data as {
    growth_focus_protocol_slug?: string | null;
    growth_focus_protocol_locale?: string | null;
  };
  return {
    slug: row.growth_focus_protocol_slug ?? null,
    locale: row.growth_focus_protocol_locale ?? "nl",
  };
});

export async function setGrowthFocusProtocol(params: { slug: string | null; locale?: string }): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Niet ingelogd.");

  const locale = params.locale ?? "nl";
  const updated_at = new Date().toISOString();
  const patch = {
    growth_focus_protocol_slug: params.slug,
    growth_focus_protocol_locale: params.slug ? locale : null,
    updated_at,
  };

  const { data: existing, error: selErr } = await supabase
    .from("user_preferences")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr && selErr.code !== "PGRST116") throw new Error(selErr.message);

  if (!existing) {
    const { error: insErr } = await supabase.from("user_preferences").insert({
      user_id: user.id,
      ...patch,
    });
    if (insErr) {
      const msg = insErr.message ?? "";
      if (insErr.code === "42703" || msg.includes("growth_focus")) {
        throw new Error("Database nog niet gemigreerd (091 growth focus).");
      }
      throw new Error(insErr.message);
    }
  } else {
    const { error: upErr } = await supabase.from("user_preferences").update(patch).eq("user_id", user.id);
    if (upErr) {
      const msg = upErr.message ?? "";
      if (upErr.code === "42703" || msg.includes("growth_focus")) {
        throw new Error("Database nog niet gemigreerd (091 growth focus).");
      }
      throw new Error(upErr.message);
    }
  }

  revalidatePath("/learning");
  revalidatePath("/dashboard");
}

/**
 * Focus-protocol zetten + huidige protocolweek automatisch op Missions (taken willekeurig over rest van de week).
 */
export async function setGrowthFocusAndCommitProtocolWeek(params: {
  slug: string;
  locale?: string;
}): Promise<{ created: number; skipped: number }> {
  await setGrowthFocusProtocol(params);
  const { commitProtocolWeekToMissions } = await import("./protocol-missions");
  const r = await commitProtocolWeekToMissions({
    protocol_slug: params.slug,
    locale: params.locale ?? "nl",
  });
  return { created: r.created, skipped: r.skipped };
}

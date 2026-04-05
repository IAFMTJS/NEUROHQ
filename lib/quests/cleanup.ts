import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Verwijdert alle user_quest_campaign_progress voor campagnes waarvan de start
 * meer dan `daysAfterStart` dagen geleden is (server-tijd).
 */
export async function purgeQuestUserProgressAfterDays(
  admin: SupabaseClient<Database>,
  daysAfterStart: number
): Promise<number> {
  const cutoffMs = Date.now() - daysAfterStart * 86400000;
  const cutoffIso = new Date(cutoffMs).toISOString();

  const { data: stale, error: selErr } = await admin.from("platform_quest_campaigns").select("id").lt("starts_at", cutoffIso);

  if (selErr || !stale?.length) return 0;

  const ids = stale.map((r) => r.id);
  const { data: deleted, error: delErr } = await admin
    .from("user_quest_campaign_progress")
    .delete()
    .in("campaign_id", ids)
    .select("user_id");

  if (delErr) {
    console.error("purgeQuestUserProgressAfterDays:", delErr.message);
    return 0;
  }

  return deleted?.length ?? 0;
}

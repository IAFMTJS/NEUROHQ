import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export type RunQuarterlyCronInput = {
  supabase: AdminClient;
  /** When null, loads `users.id` from DB. When set (bundle), skips that query. */
  userIds: string[] | null;
  userIdFilter: string | null;
};

/**
 * Ensures each user has a `quarterly_strategy` row for the current calendar quarter.
 */
export async function runQuarterlyCronExecution(input: RunQuarterlyCronInput): Promise<Record<string, unknown>> {
  const { supabase, userIds: preloadedIds, userIdFilter } = input;
  const d = new Date();
  const year = d.getFullYear();
  const quarter = Math.floor(d.getMonth() / 3) + 1;

  let ids: string[];
  if (preloadedIds != null) {
    ids = userIdFilter ? preloadedIds.filter((id) => id === userIdFilter) : preloadedIds;
  } else {
    let q = supabase.from("users").select("id");
    if (userIdFilter) q = q.eq("id", userIdFilter);
    const { data: users } = await q;
    ids = (users ?? []).map((u) => u.id as string);
  }

  if (!ids.length) {
    return { ok: true, job: "quarterly", year, quarter, ensured: 0, users: 0 };
  }

  let ensured = 0;
  for (const userId of ids) {
    const { data: existing } = await supabase
      .from("quarterly_strategy")
      .select("id")
      .eq("user_id", userId)
      .eq("year", year)
      .eq("quarter", quarter)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("quarterly_strategy").insert({
        user_id: userId,
        year,
        quarter,
        primary_theme: null,
        secondary_theme: null,
        savings_goal_id: null,
        identity_statement: null,
      });
      if (!error) ensured++;
    }
  }

  return { ok: true, job: "quarterly", year, quarter, ensured, users: ids.length };
}

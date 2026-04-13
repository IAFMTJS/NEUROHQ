import { createAdminClient } from "@/lib/supabase/admin";
import type { PersonalityMode } from "@/lib/behavioral-notifications";
import { parsePushCopyHistory } from "@/lib/push-copy-dedupe";

/** User row fields needed by hourly + daily + weekly cron passes (single `users` fetch). */
export type CronBundleUserRow = {
  id: string;
  timezone: string | null;
  last_rollover_date?: string | null;
  push_quiet_hours_start?: string | null;
  push_quiet_hours_end?: string | null;
  push_quote_enabled?: boolean | null;
  push_quote_time?: string | null;
  push_subscription_json?: unknown;
};

export type CronUserPrefsBundle = {
  users: CronBundleUserRow[];
  prefsByUser: Map<
    string,
    {
      emailRemindersEnabled: boolean;
      pushRemindersEnabled: boolean;
      pushMorningEnabled: boolean;
      pushEveningEnabled: boolean;
      personalityMode: PersonalityMode;
    }
  >;
  pushCopyHistoryByUser: Map<string, ReturnType<typeof parsePushCopyHistory>>;
};

const USERS_SELECT_FOR_CRON_BUNDLE =
  "id, timezone, last_rollover_date, push_quiet_hours_start, push_quiet_hours_end, push_quote_enabled, push_quote_time, push_subscription_json";

const PREFS_SELECT_FOR_CRON_BUNDLE =
  "user_id, email_reminders_enabled, push_reminders_enabled, push_morning_enabled, push_evening_enabled, push_personality_mode, push_copy_history";

/** Page size for `users` reads (stable `order id` + `range`). Avoids one huge PostgREST response. */
export const CRON_USERS_PAGE_SIZE = 150;

const PREFS_IN_CHUNK = 200;

type AdminClient = ReturnType<typeof createAdminClient>;

function mergePrefsChunk(
  chunkPrefs: unknown[] | null,
  prefsByUser: CronUserPrefsBundle["prefsByUser"],
  pushCopyHistoryByUser: CronUserPrefsBundle["pushCopyHistoryByUser"]
) {
  if (!chunkPrefs?.length) return;
  for (const raw of chunkPrefs) {
    const pref = raw as {
      user_id: string;
      email_reminders_enabled?: boolean | null;
      push_reminders_enabled?: boolean | null;
      push_morning_enabled?: boolean | null;
      push_evening_enabled?: boolean | null;
      push_personality_mode?: PersonalityMode | null;
      push_copy_history?: unknown;
    };
    const mode = pref.push_personality_mode ?? "auto";
    prefsByUser.set(pref.user_id, {
      emailRemindersEnabled: pref.email_reminders_enabled ?? true,
      pushRemindersEnabled: pref.push_reminders_enabled ?? true,
      pushMorningEnabled: pref.push_morning_enabled ?? true,
      pushEveningEnabled: pref.push_evening_enabled ?? true,
      personalityMode: mode,
    });
    pushCopyHistoryByUser.set(pref.user_id, parsePushCopyHistory(pref.push_copy_history));
  }
}

/**
 * Load all users matching `userIdFilter` (or everyone) with `selectList`, using paged `users` queries.
 * Shared by daily cron and any job that needs a full user list without pulling one giant row set.
 */
export async function fetchAllCronUsersForSelect(
  supabase: AdminClient,
  selectList: string,
  userIdFilter: string | null
): Promise<CronBundleUserRow[]> {
  const users: CronBundleUserRow[] = [];
  for (let from = 0; ; from += CRON_USERS_PAGE_SIZE) {
    const to = from + CRON_USERS_PAGE_SIZE - 1;
    let q = supabase.from("users").select(selectList).order("id", { ascending: true }).range(from, to);
    if (userIdFilter) q = q.eq("id", userIdFilter);
    const { data } = await q;
    const batch = (data ?? []) as CronBundleUserRow[];
    if (!batch.length) break;
    users.push(...batch);
    if (userIdFilter || batch.length < CRON_USERS_PAGE_SIZE) break;
  }
  return users;
}

async function fetchPrefsForUserIds(
  supabase: AdminClient,
  userIds: string[],
  prefsByUser: CronUserPrefsBundle["prefsByUser"],
  pushCopyHistoryByUser: CronUserPrefsBundle["pushCopyHistoryByUser"]
) {
  for (let i = 0; i < userIds.length; i += PREFS_IN_CHUNK) {
    const chunk = userIds.slice(i, i + PREFS_IN_CHUNK);
    const { data: chunkPrefs, error: prefsError } = await supabase
      .from("user_preferences")
      .select(PREFS_SELECT_FOR_CRON_BUNDLE)
      .in("user_id", chunk);
    if (!prefsError && chunkPrefs?.length) mergePrefsChunk(chunkPrefs, prefsByUser, pushCopyHistoryByUser);
  }
}

/**
 * Paged `users` reads plus `user_preferences` loaded per page (not one monolithic query).
 * Pref rows are restricted to those user ids (not the full prefs table).
 */
export async function loadCronUserPrefsBundle(
  supabase: AdminClient,
  userIdFilter: string | null
): Promise<CronUserPrefsBundle> {
  const prefsByUser = new Map<
    string,
    {
      emailRemindersEnabled: boolean;
      pushRemindersEnabled: boolean;
      pushMorningEnabled: boolean;
      pushEveningEnabled: boolean;
      personalityMode: PersonalityMode;
    }
  >();
  const pushCopyHistoryByUser = new Map<string, ReturnType<typeof parsePushCopyHistory>>();
  const users: CronBundleUserRow[] = [];

  for (let from = 0; ; from += CRON_USERS_PAGE_SIZE) {
    const to = from + CRON_USERS_PAGE_SIZE - 1;
    let usersQuery = supabase
      .from("users")
      .select(USERS_SELECT_FOR_CRON_BUNDLE)
      .order("id", { ascending: true })
      .range(from, to);
    if (userIdFilter) usersQuery = usersQuery.eq("id", userIdFilter);
    const { data: usersRaw } = await usersQuery;
    const batch = (usersRaw ?? []) as CronBundleUserRow[];
    if (!batch.length) break;

    users.push(...batch);
    const userIds = batch.map((u) => u.id).filter(Boolean);
    await fetchPrefsForUserIds(supabase, userIds, prefsByUser, pushCopyHistoryByUser);

    if (userIdFilter || batch.length < CRON_USERS_PAGE_SIZE) break;
  }

  return {
    users,
    prefsByUser,
    pushCopyHistoryByUser,
  };
}

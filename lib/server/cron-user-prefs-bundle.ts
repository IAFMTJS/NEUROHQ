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

/**
 * One `users` + one `user_preferences` read for all cron jobs in a bundle tick.
 * Replaces separate identical queries in hourly, daily, and weekly when invoked together.
 */
type AdminClient = ReturnType<typeof createAdminClient>;

export async function loadCronUserPrefsBundle(
  supabase: AdminClient,
  userIdFilter: string | null
): Promise<CronUserPrefsBundle> {
  let usersQuery = supabase.from("users").select(USERS_SELECT_FOR_CRON_BUNDLE);
  if (userIdFilter) usersQuery = usersQuery.eq("id", userIdFilter);
  const { data: usersRaw } = await usersQuery;

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

  const { data: prefs, error: prefsError } = await supabase
    .from("user_preferences")
    .select(PREFS_SELECT_FOR_CRON_BUNDLE);

  if (!prefsError && prefs?.length) {
    for (const pref of prefs) {
      const mode = (pref as { push_personality_mode?: PersonalityMode | null }).push_personality_mode ?? "auto";
      prefsByUser.set(pref.user_id, {
        emailRemindersEnabled: pref.email_reminders_enabled ?? true,
        pushRemindersEnabled: pref.push_reminders_enabled ?? true,
        pushMorningEnabled: pref.push_morning_enabled ?? true,
        pushEveningEnabled: pref.push_evening_enabled ?? true,
        personalityMode: mode,
      });
      pushCopyHistoryByUser.set(
        pref.user_id,
        parsePushCopyHistory((pref as { push_copy_history?: unknown }).push_copy_history)
      );
    }
  }

  return {
    users: (usersRaw ?? []) as CronBundleUserRow[],
    prefsByUser,
    pushCopyHistoryByUser,
  };
}

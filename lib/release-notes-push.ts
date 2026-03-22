import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/push";
import { applyPersonalityToPayload } from "@/lib/push-personality";
import { loadUserNotificationContextForUser } from "@/lib/behavioral-notification-server";
import type { PersonalityMode } from "@/lib/behavioral-notifications";
import {
  getConfiguredReleaseVersion,
  getReleaseNotesLines,
  formatReleaseNotesForPushBody,
} from "@/lib/app-release";

/**
 * Sends one "what's new" push per user per configured release version.
 * Skips when env is unset or notes are empty. Respects push_reminders_enabled.
 */
export async function runReleaseNotesPush(
  supabase: SupabaseClient,
  opts?: { userIdFilter?: string | null }
): Promise<{ sent: number; skippedReason: string | null }> {
  const version = getConfiguredReleaseVersion();
  if (!version) {
    return { sent: 0, skippedReason: "NEUROHQ_APP_RELEASE_VERSION unset" };
  }
  const lines = getReleaseNotesLines();
  if (!lines.length) {
    return { sent: 0, skippedReason: "NEUROHQ_APP_RELEASE_NOTES_JSON empty or invalid" };
  }

  const body = formatReleaseNotesForPushBody(lines);

  let usersQuery = supabase
    .from("users")
    .select("id, push_subscription_json")
    .not("push_subscription_json", "is", null);
  if (opts?.userIdFilter) usersQuery = usersQuery.eq("id", opts.userIdFilter);
  const { data: users } = await usersQuery;

  let sent = 0;

  for (const u of users ?? []) {
    const { data: pref } = await supabase
      .from("user_preferences")
      .select("last_release_push_version, push_reminders_enabled")
      .eq("user_id", u.id)
      .maybeSingle();

    const prefRow = pref as { last_release_push_version?: string | null; push_reminders_enabled?: boolean } | null;
    if (prefRow?.last_release_push_version === version) continue;
    if (prefRow?.push_reminders_enabled === false) continue;

    try {
      const ctx = await loadUserNotificationContextForUser(supabase, u.id);
      const base = {
        title: "NEUROHQ",
        body,
        tag: "app-release",
        url: "/dashboard?whats_new=1",
        priority: "normal" as const,
      };
      const payload = applyPersonalityToPayload(
        base,
        ctx.personalityMode as PersonalityMode,
        "release_notes",
        `${u.id}:${version}`
      );
      const ok = await sendPushToUser(supabase, u.id, payload);
      if (!ok) continue;

      sent++;
      const now = new Date().toISOString();
      const { data: existingPref } = await supabase
        .from("user_preferences")
        .select("user_id")
        .eq("user_id", u.id)
        .maybeSingle();
      if (existingPref) {
        await supabase
          .from("user_preferences")
          .update({ last_release_push_version: version, updated_at: now })
          .eq("user_id", u.id);
      } else {
        await supabase.from("user_preferences").insert({
          user_id: u.id,
          last_release_push_version: version,
          updated_at: now,
        });
      }
    } catch {
      // skip user
    }
  }

  return { sent, skippedReason: null };
}

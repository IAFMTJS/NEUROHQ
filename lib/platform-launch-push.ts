import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";

type PlatformLaunchKind = "event" | "game" | "quest";

type NotifyNewPlatformLaunchInput = {
  kind: PlatformLaunchKind;
  launchId: string;
  title: string;
  startsAt: string;
  preview: string;
  url?: string;
};

type PlatformLaunchStartRow = {
  kind: PlatformLaunchKind;
  id: string;
  title: string;
  starts_at: string;
  preview: string;
};

type PlatformLaunchActiveRow = {
  kind: PlatformLaunchKind;
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  preview: string;
};

function normalizePreviewLine(raw: string): string {
  const compact = raw.replace(/\s+/g, " ").trim();
  if (!compact) return "Open NEUROHQ to check the details.";
  return compact.length > 110 ? `${compact.slice(0, 107).trimEnd()}...` : compact;
}

function buildPushTitle(kind: PlatformLaunchKind): string {
  if (kind === "event") return "New event announced";
  if (kind === "game") return "New game announced";
  return "New quest announced";
}

function buildStartPushTitle(kind: PlatformLaunchKind): string {
  if (kind === "event") return "Event is live";
  if (kind === "game") return "Game is live";
  return "Quest is live";
}

function buildActiveReminderTitle(kind: PlatformLaunchKind): string {
  if (kind === "event") return "Event reminder";
  if (kind === "game") return "Game reminder";
  return "Quest reminder";
}

function startsSoon(startsAt: string): boolean {
  const startsMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsMs)) return false;
  return startsMs - Date.now() <= 6 * 60 * 60 * 1000;
}

function buildPushBody(input: NotifyNewPlatformLaunchInput): string {
  const preview = normalizePreviewLine(input.preview);
  if (input.kind === "quest") {
    const lead = startsSoon(input.startsAt)
      ? `Starts soon: ${input.title}.`
      : `A new quest is scheduled: ${input.title}.`;
    return `${lead} ${preview}`;
  }
  if (input.kind === "event") {
    const lead = startsSoon(input.startsAt)
      ? `Starts soon: ${input.title}.`
      : `A new event is planned: ${input.title}.`;
    return `${lead} ${preview}`;
  }
  const lead = startsSoon(input.startsAt)
    ? `Starts soon: ${input.title}.`
    : `A new game is planned: ${input.title}.`;
  return `${lead} ${preview}`;
}

async function getSubscribedUsersWithPushEnabled(
  supabase: SupabaseClient
): Promise<Array<{ id: string }>> {
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .not("push_subscription_json", "is", null);
  if (!users?.length) return [];

  const userIds = users.map((u) => u.id);
  const { data: disabledPrefs } = await supabase
    .from("user_preferences")
    .select("user_id")
    .in("user_id", userIds)
    .eq("push_reminders_enabled", false);
  const disabled = new Set((disabledPrefs ?? []).map((row) => row.user_id));
  return users.filter((u) => !disabled.has(u.id));
}

async function getRecentStarts(
  supabase: SupabaseClient,
  lookbackHours = 24
): Promise<PlatformLaunchStartRow[]> {
  const nowIso = new Date().toISOString();
  const sinceIso = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString();

  const [{ data: events }, { data: games }, { data: quests }] = await Promise.all([
    supabase
      .from("platform_events")
      .select("id, title, starts_at, body")
      .eq("active", true)
      .gte("starts_at", sinceIso)
      .lte("starts_at", nowIso),
    supabase
      .from("platform_games")
      .select("id, title, starts_at, body")
      .eq("active", true)
      .gte("starts_at", sinceIso)
      .lte("starts_at", nowIso),
    supabase
      .from("platform_quest_campaigns")
      .select("id, title, starts_at, tagline")
      .eq("active", true)
      .gte("starts_at", sinceIso)
      .lte("starts_at", nowIso),
  ]);

  const out: PlatformLaunchStartRow[] = [];
  for (const row of events ?? []) {
    out.push({
      kind: "event",
      id: row.id,
      title: row.title,
      starts_at: row.starts_at,
      preview: row.body ?? "",
    });
  }
  for (const row of games ?? []) {
    out.push({
      kind: "game",
      id: row.id,
      title: row.title,
      starts_at: row.starts_at,
      preview: row.body ?? "",
    });
  }
  for (const row of quests ?? []) {
    out.push({
      kind: "quest",
      id: row.id,
      title: row.title,
      starts_at: row.starts_at,
      preview: row.tagline ?? "",
    });
  }
  return out;
}

function isActiveNow(startsAt: string, endsAt: string | null, nowMs: number): boolean {
  const startsMs = new Date(startsAt).getTime();
  if (!Number.isFinite(startsMs) || startsMs > nowMs) return false;
  if (!endsAt) return true;
  const endsMs = new Date(endsAt).getTime();
  if (!Number.isFinite(endsMs)) return true;
  return endsMs >= nowMs;
}

export async function getActivePlatformLaunchForReminder(
  supabase: SupabaseClient
): Promise<PlatformLaunchActiveRow | null> {
  const nowMs = Date.now();

  const [{ data: events }, { data: games }, { data: quests }] = await Promise.all([
    supabase
      .from("platform_events")
      .select("id, title, starts_at, ends_at, body")
      .eq("active", true)
      .order("starts_at", { ascending: false })
      .limit(6),
    supabase
      .from("platform_games")
      .select("id, title, starts_at, ends_at, body")
      .eq("active", true)
      .order("starts_at", { ascending: false })
      .limit(6),
    supabase
      .from("platform_quest_campaigns")
      .select("id, title, starts_at, ends_at, tagline")
      .eq("active", true)
      .order("starts_at", { ascending: false })
      .limit(6),
  ]);

  const normalized: PlatformLaunchActiveRow[] = [];
  for (const row of quests ?? []) {
    normalized.push({
      kind: "quest",
      id: row.id,
      title: row.title,
      starts_at: row.starts_at,
      ends_at: row.ends_at ?? null,
      preview: row.tagline ?? "",
    });
  }
  for (const row of events ?? []) {
    normalized.push({
      kind: "event",
      id: row.id,
      title: row.title,
      starts_at: row.starts_at,
      ends_at: row.ends_at ?? null,
      preview: row.body ?? "",
    });
  }
  for (const row of games ?? []) {
    normalized.push({
      kind: "game",
      id: row.id,
      title: row.title,
      starts_at: row.starts_at,
      ends_at: row.ends_at ?? null,
      preview: row.body ?? "",
    });
  }

  const active = normalized.find((row) => isActiveNow(row.starts_at, row.ends_at, nowMs)) ?? null;
  return active;
}

export function buildActivePlatformReminderPayload(active: {
  kind: PlatformLaunchKind;
  title: string;
  preview: string;
}) {
  let body = "";
  if (active.kind === "quest") {
    body = `New day, new question. Continue ${active.title}.`;
  } else if (active.kind === "event") {
    body = `Don't miss today's event: ${active.title}.`;
  } else {
    body = `Your game challenge is waiting: ${active.title}.`;
  }
  const preview = normalizePreviewLine(active.preview);
  return {
    title: buildActiveReminderTitle(active.kind),
    body: `${body} ${preview}`,
    tag: "platform-active-reminder",
    url: "/dashboard",
    priority: "normal" as const,
  };
}

export async function notifyUsersNewPlatformLaunch(input: NotifyNewPlatformLaunchInput): Promise<number> {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return 0;

  const supabase = createAdminClient();
  const users = await getSubscribedUsersWithPushEnabled(supabase);
  if (!users.length) return 0;

  let sent = 0;
  const payload = {
    title: buildPushTitle(input.kind),
    body: buildPushBody(input),
    tag: `platform-${input.kind}-new:${input.launchId}`,
    url: input.url ?? "/dashboard",
    priority: "normal" as const,
  };

  for (const user of users) {
    const ok = await sendPushToUser(supabase, user.id, payload);
    if (ok) sent++;
  }
  return sent;
}

/**
 * Sends one "started now" push per user+launch when a platform event/game/quest enters its start window.
 * Uses per-launch tags and push_sends_log checks to avoid duplicate sends across hourly cron runs.
 */
export async function notifyUsersPlatformLaunchStarted(
  supabase: SupabaseClient,
  opts?: { userIdFilter?: string | null; lookbackHours?: number }
): Promise<number> {
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return 0;

  const launches = await getRecentStarts(supabase, opts?.lookbackHours ?? 24);
  if (!launches.length) return 0;

  let users = await getSubscribedUsersWithPushEnabled(supabase);
  if (opts?.userIdFilter) {
    users = users.filter((u) => u.id === opts.userIdFilter);
  }
  if (!users.length) return 0;

  const launchTags = launches.map((launch) => `platform-${launch.kind}-start:${launch.id}`);
  let sent = 0;

  for (const user of users) {
    const { data: priorRows } = await supabase
      .from("push_sends_log")
      .select("trigger_type")
      .eq("user_id", user.id)
      .in("trigger_type", launchTags);
    const alreadySent = new Set((priorRows ?? []).map((row) => row.trigger_type));

    for (const launch of launches) {
      const tag = `platform-${launch.kind}-start:${launch.id}`;
      if (alreadySent.has(tag)) continue;
      const startBody =
        launch.kind === "quest"
          ? `Day 1 is ready in ${launch.title}. ${normalizePreviewLine(launch.preview)}`
          : launch.kind === "event"
            ? `${launch.title} has started. ${normalizePreviewLine(launch.preview)}`
            : `${launch.title} is now playable. ${normalizePreviewLine(launch.preview)}`;
      const ok = await sendPushToUser(supabase, user.id, {
        title: buildStartPushTitle(launch.kind),
        body: startBody,
        tag,
        url: "/dashboard",
        priority: "normal",
      });
      if (ok) sent++;
    }
  }
  return sent;
}

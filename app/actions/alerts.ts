"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { sendPushToUser } from "@/lib/push";
import type { DashboardCritical } from "@/types/dashboard-data.types";
import type { UnifiedDecision } from "@/lib/unified-decision-engine";

export type UserAlertSeverity = "info" | "warning" | "urgent";

export type UserAlertRow = {
  id: string;
  title: string;
  body: string | null;
  severity: UserAlertSeverity;
  link_path: string | null;
  read_at: string | null;
  push_sent_at: string | null;
  created_at: string;
};

/** Generated DB types may lag new migrations; keep runtime table name. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = { from: (t: string) => any };

/**
 * Creates an in-app alert for the current user. Optionally sends the same title/body as a web push
 * (same tagging/caps as other HQ pushes). Failed pushes stay pending for hourly sweep.
 */
export async function emitUserAlert(input: {
  title: string;
  body?: string;
  severity?: UserAlertSeverity;
  linkPath?: string;
  sendPush?: boolean;
  pushTag?: string;
}): Promise<{ id: string }> {
  const supabase = await createClient();
  const db = supabase as unknown as AnyDb;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const severity = input.severity ?? "info";
  const linkPath = input.linkPath?.trim() || null;
  const tag = input.pushTag?.slice(0, 120) ?? null;

  const { data: inserted, error } = await db
    .from("user_alerts")
    .insert({
      user_id: user.id,
      title: input.title.slice(0, 200),
      body: input.body?.slice(0, 2000) ?? null,
      severity,
      link_path: linkPath,
      push_tag: tag,
    })
    .select("id")
    .single();

  let id: string;
  if (error) {
    if ((error as { code?: string }).code === "23505" || String(error.message ?? "").includes("duplicate key")) {
      if (!tag) throw new Error(error.message);
      const { data: row } = await db
        .from("user_alerts")
        .select("id, push_sent_at")
        .eq("user_id", user.id)
        .eq("push_tag", tag)
        .maybeSingle();
      if (!row) throw new Error(error.message);
      id = String((row as { id: string }).id);
      if (input.sendPush && !(row as { push_sent_at?: string | null }).push_sent_at) {
        const prefs = await getUserPreferencesOrDefaults();
        if (prefs.push_reminders_enabled) {
          const path = linkPath && linkPath.startsWith("/") ? linkPath : linkPath ? `/${linkPath}` : "/dashboard";
          const delivered = await sendPushToUser(supabase, user.id, {
            title: input.title.slice(0, 120),
            body: input.body?.slice(0, 280),
            url: path,
            tag: tag ?? `hq-alert-${id}`,
            priority: severity === "urgent" ? "high" : "normal",
          });
          if (delivered) {
            await db.from("user_alerts").update({ push_sent_at: new Date().toISOString() }).eq("id", id);
          }
        }
      }
      revalidatePath("/dashboard");
      revalidatePath("/profile");
      return { id };
    }
    throw new Error(error.message);
  }

  id = String((inserted as { id: string }).id);

  if (input.sendPush) {
    const prefs = await getUserPreferencesOrDefaults();
    if (prefs.push_reminders_enabled) {
      const path = linkPath && linkPath.startsWith("/") ? linkPath : linkPath ? `/${linkPath}` : "/dashboard";
      const delivered = await sendPushToUser(supabase, user.id, {
        title: input.title.slice(0, 120),
        body: input.body?.slice(0, 280),
        url: path,
        tag: tag ?? `hq-alert-${id}`,
        priority: severity === "urgent" ? "high" : "normal",
      });
      if (delivered) {
        await db.from("user_alerts").update({ push_sent_at: new Date().toISOString() }).eq("id", id);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return { id };
}

export async function markUserAlertRead(alertId: string): Promise<void> {
  const supabase = await createClient();
  const db = supabase as unknown as AnyDb;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await db.from("user_alerts").update({ read_at: new Date().toISOString() }).eq("id", alertId).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

/** Marks every unread inbox row read for the current user. */
export async function markAllUserAlertsRead(): Promise<void> {
  const supabase = await createClient();
  const db = supabase as unknown as AnyDb;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await db
    .from("user_alerts")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

export async function deleteUserAlert(alertId: string): Promise<void> {
  const supabase = await createClient();
  const db = supabase as unknown as AnyDb;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await db.from("user_alerts").delete().eq("id", alertId).eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

/** Removes every inbox row for the current user. */
export async function deleteAllUserAlerts(): Promise<void> {
  const supabase = await createClient();
  const db = supabase as unknown as AnyDb;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await db.from("user_alerts").delete().eq("user_id", user.id);
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}

function normalizeInboxLinkPath(href: string): string {
  const t = href.trim();
  if (!t) return "/dashboard";
  if (t.startsWith("/")) return t;
  if (t.startsWith("http://") || t.startsWith("https://")) return "/dashboard";
  return `/${t}`;
}

function severityForUnifiedDecision(d: UnifiedDecision): UserAlertSeverity {
  if (d.decisionType === "budget_guardrail" || d.decisionType === "recovery_protocol" || d.decisionType === "streak_rescue") {
    return "warning";
  }
  if (d.decisionType === "reduce_overload") return "warning";
  return "info";
}

async function ensureInboxAlertIfNew(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  input: {
    pushTag: string;
    title: string;
    body: string | null;
    severity: UserAlertSeverity;
    linkPath: string;
  }
): Promise<void> {
  const db = supabase as unknown as AnyDb;
  const tag = input.pushTag.slice(0, 120);
  const { error } = await db.from("user_alerts").insert({
    user_id: userId,
    title: input.title.slice(0, 200),
    body: input.body ? input.body.slice(0, 2000) : null,
    severity: input.severity,
    link_path: input.linkPath,
    push_tag: tag,
  });
  if (!error) return;
  if (error.code === "23505" || String(error.message ?? "").includes("duplicate key")) {
    return;
  }
  console.error("[ensureInboxAlertIfNew]", error.message);
}

/**
 * Upserts dashboard-driven inbox rows (deduped by unique user_id + push_tag).
 * Called from buildCriticalPayload so meldingen vullen bij elke dashboard/bootstrap load.
 */
export async function syncInboxAlertsFromDashboardCritical(critical: DashboardCritical): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const candidates: {
    pushTag: string;
    title: string;
    body: string | null;
    severity: UserAlertSeverity;
    linkPath: string;
  }[] = [];

  if (critical.unifiedDecision) {
    const u = critical.unifiedDecision;
    // Stable per (day, decision type): decisionId changes when task count / ranking shifts,
    // which would mint endless duplicate inbox rows + pushes if used as push_tag.
    candidates.push({
      pushTag: `hq-inbox-unified-${critical.dateStr}-${u.decisionType}`,
      title: u.title.slice(0, 200),
      body: u.description ? u.description.slice(0, 2000) : null,
      severity: severityForUnifiedDecision(u),
      linkPath: normalizeInboxLinkPath(u.href),
    });
  }

  const streakCoveredByUnified = critical.unifiedDecision?.decisionType === "streak_rescue";
  if (critical.streakAtRisk && !streakCoveredByUnified) {
    candidates.push({
      pushTag: `hq-inbox-streak-${critical.dateStr}`,
      title: "Streak in gevaar",
      body: "Voltooi vandaag minstens één missie om je reeks te behouden.",
      severity: "warning",
      linkPath: "/tasks",
    });
  }

  if (critical.burnout) {
    candidates.push({
      pushTag: `hq-inbox-burnout-${critical.dateStr}`,
      title: "Herstel eerst",
      body: "Je signalen wijzen op overload. Neem rust en verklein je planning vandaag.",
      severity: "urgent",
      linkPath: "/dashboard",
    });
  }

  for (const c of candidates) {
    await ensureInboxAlertIfNew(supabase, user.id, c);
  }
}

export async function listUserAlertsForApi(limit = 30): Promise<UserAlertRow[]> {
  const supabase = await createClient();
  const db = supabase as unknown as AnyDb;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await db
    .from("user_alerts")
    .select("id, title, body, severity, link_path, read_at, push_sent_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(Math.min(80, Math.max(1, limit)));

  if (error) return [];
  return (data ?? []) as UserAlertRow[];
}

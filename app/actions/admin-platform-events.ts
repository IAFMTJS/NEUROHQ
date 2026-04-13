"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { notifyUsersNewPlatformLaunch } from "@/lib/platform-launch-push";
import type { TablesInsert } from "@/types/database.types";

async function requireAdmin() {
  const admin = await getAdminSessionUser();
  if (!admin) throw new Error("Geen beheerderstoegang.");
  return admin;
}

export async function createPlatformEvent(input: {
  title: string;
  body: string;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const now = new Date().toISOString();
  const row: TablesInsert<"platform_events"> = {
    title: input.title.trim(),
    body: input.body.trim(),
    starts_at: input.starts_at,
    ends_at: input.ends_at && input.ends_at.length > 0 ? input.ends_at : null,
    active: input.active,
    updated_at: now,
  };
  const { data: inserted, error } = await supabase.from("platform_events").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  if (inserted?.id) {
    try {
      await notifyUsersNewPlatformLaunch({
        kind: "event",
        launchId: inserted.id,
        title: row.title,
        startsAt: row.starts_at,
        preview: row.body,
        url: "/dashboard",
      });
    } catch (err) {
      console.warn("[push] event launch push failed", { eventId: inserted.id, err });
    }
  }
  revalidatePath("/admin/events");
}

export async function setPlatformEventActive(id: string, active: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_events")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/events");
}

export async function deletePlatformEvent(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("platform_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/events");
}

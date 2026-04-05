import "server-only";

import { createClient } from "@/lib/supabase/server";

/** Resolved server-side; proxy also enforces admin on /admin routes. */
export async function getAdminSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") return null;
  return user;
}

"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureUserProfile(userId: string, email: string | undefined) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();
  if (existing) return;
  await supabase.from("users").insert({
    id: userId,
    email: email ?? null,
    role: "user",
  });
}

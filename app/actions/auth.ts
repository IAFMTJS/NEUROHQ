"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

/** Call after login so dashboard layout does not block on profile creation. */
export async function ensureUserProfileForSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await ensureUserProfile(user.id, user.email ?? undefined);
}

export async function getUserTimezone(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", user.id)
    .single();
  return (data as { timezone?: string | null } | null)?.timezone ?? null;
}

export async function updateUserTimezone(timezone: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("users").update({ timezone }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

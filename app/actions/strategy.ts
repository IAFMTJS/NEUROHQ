"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentQuarter as getCurrentQuarterUtil } from "@/lib/utils/strategy";

export async function getQuarterlyStrategy() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { year, quarter } = getCurrentQuarterUtil();
  const { data } = await supabase
    .from("quarterly_strategy")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("quarter", quarter)
    .single();
  return data;
}

export async function upsertQuarterlyStrategy(params: {
  primary_theme?: string | null;
  secondary_theme?: string | null;
  savings_goal_id?: string | null;
  identity_statement?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { year, quarter } = getCurrentQuarterUtil();
  const payload = {
    user_id: user.id,
    year,
    quarter,
    primary_theme: params.primary_theme ?? null,
    secondary_theme: params.secondary_theme ?? null,
    savings_goal_id: params.savings_goal_id ?? null,
    identity_statement: params.identity_statement ?? null,
  };
  const { error } = await supabase
    .from("quarterly_strategy")
    .upsert(payload, { onConflict: "user_id,year,quarter" });
  if (error) throw new Error(error.message);
  revalidatePath("/strategy");
  revalidatePath("/dashboard");
}

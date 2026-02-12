"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentQuarter as getCurrentQuarterUtil, getPreviousQuarter } from "@/lib/utils/strategy";

export async function getQuarterlyStrategy(yearQuarter?: { year: number; quarter: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { year, quarter } = yearQuarter ?? getCurrentQuarterUtil();
  const { data } = await supabase
    .from("quarterly_strategy")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("quarter", quarter)
    .single();
  return data;
}

export async function getPastQuarterlyStrategies(limit = 8) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const current = getCurrentQuarterUtil();
  const { data } = await supabase
    .from("quarterly_strategy")
    .select("id, year, quarter, primary_theme, secondary_theme, identity_statement, one_word")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("quarter", { ascending: false })
    .limit(limit + 1);
  const list = (data ?? []).filter((r) => r.year !== current.year || r.quarter !== current.quarter);
  return list.slice(0, limit);
}

export async function upsertQuarterlyStrategy(params: {
  primary_theme?: string | null;
  secondary_theme?: string | null;
  savings_goal_id?: string | null;
  identity_statement?: string | null;
  key_results?: string | null;
  anti_goals?: string | null;
  one_word?: string | null;
  north_star?: string | null;
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
    key_results: params.key_results ?? null,
    anti_goals: params.anti_goals ?? null,
    one_word: params.one_word ?? null,
    north_star: params.north_star ?? null,
  };
  const { error } = await supabase
    .from("quarterly_strategy")
    .upsert(payload, { onConflict: "user_id,year,quarter" });
  if (error) throw new Error(error.message);
  revalidatePath("/strategy");
  revalidatePath("/dashboard");
}

export async function getStrategyKeyResults(strategyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("strategy_key_results")
    .select("*")
    .eq("strategy_id", strategyId)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

export async function exportStrategyMarkdown(): Promise<string> {
  const strategy = await getQuarterlyStrategy();
  if (!strategy) return "";
  const s = strategy as {
    year: number;
    quarter: number;
    primary_theme?: string | null;
    secondary_theme?: string | null;
    identity_statement?: string | null;
    key_results?: string | null;
    anti_goals?: string | null;
    one_word?: string | null;
    north_star?: string | null;
  };
  const lines = [
    `# Q${s.quarter} ${s.year} Strategy`,
    "",
    s.one_word ? `**One word:** ${s.one_word}` : "",
    s.primary_theme ? `**Themes:** ${[s.primary_theme, s.secondary_theme].filter(Boolean).join(" · ")}` : "",
    s.identity_statement ? `**Identity:** "${s.identity_statement}"` : "",
    s.north_star ? `**North star:** ${s.north_star}` : "",
    s.anti_goals ? `**Anti-goals:** ${s.anti_goals}` : "",
    s.key_results ? `**Key results:**\n${(s.key_results as string).trim().split(/\n/).map((l) => `- ${l.trim()}`).filter(Boolean).join("\n")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function copyStrategyFromLastQuarter() {
  const prev = getPreviousQuarter();
  const strategy = await getQuarterlyStrategy(prev);
  if (!strategy) throw new Error("No previous quarter strategy to copy");
  const s = strategy as {
    primary_theme?: string | null;
    secondary_theme?: string | null;
    savings_goal_id?: string | null;
    identity_statement?: string | null;
    key_results?: string | null;
    anti_goals?: string | null;
    one_word?: string | null;
    north_star?: string | null;
  };
  await upsertQuarterlyStrategy({
    primary_theme: s.primary_theme ?? null,
    secondary_theme: s.secondary_theme ?? null,
    savings_goal_id: s.savings_goal_id ?? null,
    identity_statement: s.identity_statement ?? null,
    key_results: s.key_results ?? null,
    anti_goals: s.anti_goals ?? null,
    one_word: s.one_word ?? null,
    north_star: s.north_star ?? null,
  });
}

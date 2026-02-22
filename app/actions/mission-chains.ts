"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MissionChain = {
  id: string;
  user_id: string;
  name: string;
  alignment_bonus_pct: number;
  completed_at: string | null;
  created_at: string;
  steps?: { task_id: string | null; step_order: number }[];
};

export async function getChainsForUser(): Promise<MissionChain[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: chains } = await supabase
    .from("mission_chains")
    .select("id, user_id, name, alignment_bonus_pct, completed_at, created_at")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .order("created_at", { ascending: false });
  if (!chains?.length) return chains ?? [];
  const { data: steps } = await supabase
    .from("mission_chain_steps")
    .select("chain_id, task_id, step_order")
    .in("chain_id", chains.map((c) => c.id));
  const stepsByChain = new Map<string, { task_id: string | null; step_order: number }[]>();
  for (const s of steps ?? []) {
    const list = stepsByChain.get((s as { chain_id: string }).chain_id) ?? [];
    list.push({
      task_id: (s as { task_id: string | null }).task_id,
      step_order: (s as { step_order: number }).step_order,
    });
    stepsByChain.set((s as { chain_id: string }).chain_id, list);
  }
  return (chains ?? []).map((c) => ({
    ...c,
    steps: (stepsByChain.get(c.id) ?? []).sort((a, b) => a.step_order - b.step_order),
  }));
}

export async function createChain(name: string, alignmentBonusPct: number = 10): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("mission_chains")
    .insert({
      user_id: user.id,
      name,
      alignment_bonus_pct: Math.min(50, Math.max(0, alignmentBonusPct)),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !data) return null;
  revalidatePath("/tasks");
  return (data as { id: string }).id;
}

export async function addStepToChain(chainId: string, taskId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: chain } = await supabase
    .from("mission_chains")
    .select("id")
    .eq("id", chainId)
    .eq("user_id", user.id)
    .single();
  if (!chain) return false;
  const { data: maxOrder } = await supabase
    .from("mission_chain_steps")
    .select("step_order")
    .eq("chain_id", chainId)
    .order("step_order", { ascending: false })
    .limit(1)
    .single();
  const nextOrder = ((maxOrder as { step_order?: number })?.step_order ?? -1) + 1;
  const { error } = await supabase.from("mission_chain_steps").insert({
    chain_id: chainId,
    task_id: taskId,
    step_order: nextOrder,
  });
  if (error) return false;
  await supabase.from("tasks").update({ mission_chain_id: chainId }).eq("id", taskId).eq("user_id", user.id);
  revalidatePath("/tasks");
  return true;
}

/** Call after completing a task: if task was part of a chain, check if chain is now complete and award bonus. Returns true if chain was completed. */
export async function checkChainCompletionOnTaskComplete(taskId: string): Promise<{ chainCompleted: boolean; chainId?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { chainCompleted: false };
  const { data: task } = await supabase
    .from("tasks")
    .select("mission_chain_id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();
  const chainId = (task as { mission_chain_id?: string | null } | null)?.mission_chain_id ?? null;
  if (!chainId) return { chainCompleted: false };
  const { data: steps } = await supabase
    .from("mission_chain_steps")
    .select("task_id")
    .eq("chain_id", chainId)
    .order("step_order", { ascending: true });
  const taskIds = (steps ?? []).map((s) => (s as { task_id: string | null }).task_id).filter(Boolean) as string[];
  if (taskIds.length === 0) return { chainCompleted: false };
  const { data: completed } = await supabase
    .from("tasks")
    .select("id")
    .in("id", taskIds)
    .eq("user_id", user.id)
    .eq("completed", true);
  const completedIds = new Set((completed ?? []).map((t) => (t as { id: string }).id));
  const allDone = taskIds.every((id) => completedIds.has(id));
  if (!allDone) return { chainCompleted: false };
  const { data: chain } = await supabase
    .from("mission_chains")
    .select("id, alignment_bonus_pct")
    .eq("id", chainId)
    .eq("user_id", user.id)
    .single();
  if (!chain) return { chainCompleted: false };
  await supabase
    .from("mission_chains")
    .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", chainId)
    .eq("user_id", user.id);
  const bonusPct = (chain as { alignment_bonus_pct?: number }).alignment_bonus_pct ?? 10;
  const { addXP } = await import("./xp");
  await addXP(Math.max(5, Math.floor(10 * (bonusPct / 10))));
  revalidatePath("/tasks");
  revalidatePath("/strategy");
  return { chainCompleted: true, chainId };
}

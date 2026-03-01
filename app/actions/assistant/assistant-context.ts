"use server";

import { createClient } from "@/lib/supabase/server";

const RECENT_CONTEXT_LIMIT = 10;

export type AssistantUserContext = {
  recentGoals: string[];
  recentTasks: string[];
};

export type LastTurn = {
  lastUserMessage: string | null;
  lastResponseType: string | null;
  lastExtractedContent: string | null;
  lastExtractedType: string | null;
  updatedAt: string | null;
};

/** Haalt recente genoemde doelen en taken op voor templates. */
export async function getAssistantUserContext(
  userId: string
): Promise<AssistantUserContext> {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const { data: rows } = await supabase
    .from("assistant_user_context")
    .select("content, type")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(RECENT_CONTEXT_LIMIT * 2);

  const recentGoals: string[] = [];
  const recentTasks: string[] = [];
  const seenGoals = new Set<string>();
  const seenTasks = new Set<string>();

  for (const r of rows ?? []) {
    const c = (r.content ?? "").trim();
    if (!c) continue;
    if (r.type === "goal" || r.type === "skill") {
      if (!seenGoals.has(c.toLowerCase())) {
        seenGoals.add(c.toLowerCase());
        recentGoals.push(c);
      }
    } else {
      if (!seenTasks.has(c.toLowerCase())) {
        seenTasks.add(c.toLowerCase());
        recentTasks.push(c);
      }
    }
  }

  return {
    recentGoals: recentGoals.slice(0, RECENT_CONTEXT_LIMIT),
    recentTasks: recentTasks.slice(0, RECENT_CONTEXT_LIMIT),
  };
}

/** Slaat een genoemde taak/doel op (leren uit antwoorden). */
export async function saveAssistantUserContext(
  userId: string,
  content: string,
  type: "task" | "goal" | "skill"
): Promise<void> {
  const supabase = await createClient();
  const c = content.trim();
  if (!c) return;

  await supabase.from("assistant_user_context").insert({
    user_id: userId,
    content: c,
    type,
  });
}

/** Laatste beurt (gespreksgeheugen) ophalen. */
export async function getLastTurn(userId: string): Promise<LastTurn | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("assistant_conversation_turn")
    .select("last_user_message, last_response_type, last_extracted_content, last_extracted_type, updated_at")
    .eq("user_id", userId)
    .single();

  if (!data) return null;

  return {
    lastUserMessage: data.last_user_message ?? null,
    lastResponseType: data.last_response_type ?? null,
    lastExtractedContent: data.last_extracted_content ?? null,
    lastExtractedType: data.last_extracted_type ?? null,
    updatedAt: data.updated_at ?? null,
  };
}

/** Laatste beurt opslaan (na elke assistant-response). */
export async function saveLastTurn(
  userId: string,
  lastUserMessage: string,
  lastResponseType: string,
  lastExtractedContent: string | null,
  lastExtractedType: string | null
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("assistant_conversation_turn").upsert(
    {
      user_id: userId,
      last_user_message: lastUserMessage,
      last_response_type: lastResponseType,
      last_extracted_content: lastExtractedContent,
      last_extracted_type: lastExtractedType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}

"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

type EventCategory = "core" | "engine" | "governance" | "custom";
type EventSchema = {
  version: number;
  category: EventCategory;
  requiredKeys?: string[];
};

const CORE_EVENT_NAMES = new Set([
  "mission_suggested",
  "mission_started",
  "mission_completed",
  "mission_aborted",
  "mission_skipped",
  "CTA_clicked",
] as const);

const EVENT_SCHEMAS: Record<string, EventSchema> = {
  mission_suggested: { version: 1, category: "core", requiredKeys: ["source"] },
  mission_started: { version: 1, category: "core", requiredKeys: ["taskId"] },
  mission_completed: { version: 1, category: "core", requiredKeys: ["taskId"] },
  mission_aborted: { version: 1, category: "core", requiredKeys: ["taskId"] },
  mission_skipped: { version: 1, category: "core", requiredKeys: ["taskId"] },
  CTA_clicked: { version: 1, category: "core", requiredKeys: ["context"] },
  CTA_shown: { version: 1, category: "custom", requiredKeys: ["context"] },
  card_viewed: { version: 1, category: "custom", requiredKeys: ["context"] },
  decision_exposed: { version: 1, category: "engine", requiredKeys: ["decisionId", "decisionType", "surface"] },
  decision_action: { version: 1, category: "engine", requiredKeys: ["decisionId", "decisionType", "surface", "actionType"] },
  decision_outcome: { version: 1, category: "engine", requiredKeys: ["decisionId", "decisionType", "surface", "outcome"] },
};

function validatePayload(eventName: string, payload: Record<string, unknown>): { ok: boolean; missing: string[] } {
  const schema = EVENT_SCHEMAS[eventName];
  if (!schema?.requiredKeys?.length) return { ok: true, missing: [] };
  const missing = schema.requiredKeys.filter((k) => payload[k] == null);
  return { ok: missing.length === 0, missing };
}

/** Record a named analytics event (funnel: mission_completed, CTA_clicked, etc.). */
export async function trackEvent(eventName: string, payload: Record<string, unknown> = {}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const normalizedName = eventName.trim();
  const schema = EVENT_SCHEMAS[normalizedName];
  const validation = validatePayload(normalizedName, payload);
  const eventCategory: EventCategory =
    schema?.category ??
    (CORE_EVENT_NAMES.has(normalizedName as never) ? "core" : "custom");
  const normalizedPayload = {
    ...payload,
    schemaVersion: schema?.version ?? 1,
    eventCategory,
    schemaKnown: Boolean(schema),
    schemaValid: validation.ok,
    missingRequiredKeys: validation.missing,
  } satisfies Record<string, unknown>;
  await supabase.from("analytics_events").insert({
    user_id: user.id,
    event_name: normalizedName,
    payload: normalizedPayload as Json,
  });
}

export type AnalyticsEventSummaryItem = { event_name: string; count: number };

/** Count by event_name for last 7 days (for Insights page). */
export async function getAnalyticsEventsSummaryLast7(): Promise<AnalyticsEventSummaryItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const sinceStr = since.toISOString();
  const { data: rows } = await supabase
    .from("analytics_events")
    .select("event_name")
    .eq("user_id", user.id)
    .gte("created_at", sinceStr);
  const byName = new Map<string, number>();
  for (const row of rows ?? []) {
    const name = (row as { event_name: string }).event_name ?? "unknown";
    byName.set(name, (byName.get(name) ?? 0) + 1);
  }
  return Array.from(byName.entries())
    .map(([event_name, count]) => ({ event_name, count }))
    .sort((a, b) => b.count - a.count);
}

export type TelemetryGovernanceSnapshot = {
  totalEvents: number;
  withSchemaVersion: number;
  schemaKnownCount: number;
  schemaValidCount: number;
  unknownEventNames: string[];
  invalidEvents: { event_name: string; count: number }[];
};

export async function getTelemetryGovernanceSnapshot(days = 14): Promise<TelemetryGovernanceSnapshot> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      totalEvents: 0,
      withSchemaVersion: 0,
      schemaKnownCount: 0,
      schemaValidCount: 0,
      unknownEventNames: [],
      invalidEvents: [],
    };
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("analytics_events")
    .select("event_name, payload")
    .eq("user_id", user.id)
    .gte("created_at", since);

  const unknownNames = new Set<string>();
  const invalidByName = new Map<string, number>();
  let withSchemaVersion = 0;
  let schemaKnownCount = 0;
  let schemaValidCount = 0;
  for (const row of rows ?? []) {
    const eventName = ((row as { event_name?: string }).event_name ?? "").trim();
    const payload = ((row as { payload?: Record<string, unknown> }).payload ?? {}) as Record<string, unknown>;
    if (payload.schemaVersion != null) withSchemaVersion++;
    if (payload.schemaKnown === true) schemaKnownCount++;
    if (payload.schemaValid === true) schemaValidCount++;
    if (!EVENT_SCHEMAS[eventName]) unknownNames.add(eventName);
    const validation = validatePayload(eventName, payload);
    if (!validation.ok) invalidByName.set(eventName, (invalidByName.get(eventName) ?? 0) + 1);
  }

  return {
    totalEvents: (rows ?? []).length,
    withSchemaVersion,
    schemaKnownCount,
    schemaValidCount,
    unknownEventNames: Array.from(unknownNames).filter(Boolean).sort(),
    invalidEvents: Array.from(invalidByName.entries())
      .map(([event_name, count]) => ({ event_name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export type ClosedLoopDecisionSummary = {
  decisionType: string;
  exposed: number;
  acted: number;
  outcomes: number;
  actionRate: number;
  outcomeRate: number;
};

export async function getClosedLoopLearningSummary(days = 14): Promise<ClosedLoopDecisionSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("analytics_events")
    .select("event_name, payload")
    .eq("user_id", user.id)
    .gte("created_at", since)
    .in("event_name", ["decision_exposed", "decision_action", "decision_outcome"]);

  const byType = new Map<string, { exposed: number; acted: number; outcomes: number }>();
  for (const row of rows ?? []) {
    const eventName = (row as { event_name?: string }).event_name ?? "";
    const payload = ((row as { payload?: Record<string, unknown> }).payload ?? {}) as Record<string, unknown>;
    const decisionType = String(payload.decisionType ?? "unknown");
    const current = byType.get(decisionType) ?? { exposed: 0, acted: 0, outcomes: 0 };
    if (eventName === "decision_exposed") current.exposed += 1;
    if (eventName === "decision_action") current.acted += 1;
    if (eventName === "decision_outcome") current.outcomes += 1;
    byType.set(decisionType, current);
  }

  return Array.from(byType.entries())
    .map(([decisionType, d]) => ({
      decisionType,
      exposed: d.exposed,
      acted: d.acted,
      outcomes: d.outcomes,
      actionRate: d.exposed > 0 ? d.acted / d.exposed : 0,
      outcomeRate: d.exposed > 0 ? d.outcomes / d.exposed : 0,
    }))
    .sort((a, b) => b.exposed - a.exposed);
}

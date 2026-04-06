/**
 * Supabase-first data contract for mobile + web offline flows.
 *
 * This contract is intentionally strict:
 * - Supabase is the only source of truth for persisted user data.
 * - Local stores (SQLite/IndexedDB) are cache + mutation outbox only.
 * - In conflicts, server state wins unless a domain explicitly overrides.
 */

export const SUPABASE_FIRST_CONTRACT_VERSION = "2026-04-06";

/** Header used by client outbox writes to dedupe retries server-side. */
export const IDEMPOTENCY_HEADER = "x-neurohq-idempotency-key";

/** Header used by sync clients to identify themselves in logs/metrics. */
export const SYNC_CLIENT_HEADER = "x-neurohq-sync-client";

export type ConflictPolicy = "serverWins";

export const DEFAULT_CONFLICT_POLICY: ConflictPolicy = "serverWins";

export type OutboxActionType =
  | "task.create"
  | "task.complete"
  | "task.uncomplete"
  | "task.delete"
  | "task.snooze"
  | "task.skip_next"
  | "task.reschedule"
  | "task.duplicate"
  | "task.update"
  | "budget.add_entry"
  | "budget.update_settings";

export type SyncDeliveryState = "queued" | "processing" | "dead_letter";

export const OUTBOX_MAX_RETRIES = 8;

/**
 * Server-authoritative timestamp field expected in payloads that can conflict.
 * Clients may compare this against local snapshots, but may not overrule server.
 */
export const AUTHORITATIVE_UPDATED_AT_FIELD = "updated_at";

export function isSupabaseFirstConflictPolicy(value: string): value is ConflictPolicy {
  return value === "serverWins";
}


/**
 * NEUROHQ — ideal split between Capacitor, Supabase, and local SQLite/IndexedDB
 *
 * Goals: one mental model for mobile and PWA; no “two sources of truth”; safe offline writes.
 *
 * 1) Supabase (Postgres + Auth + RLS)
 *    - Sole authority for persisted user data. RLS stays enforced; clients never hold service-role keys.
 *    - Native runs the same hosted Next app in WebView; session is the normal browser session (cookies).
 *
 * 2) Next.js API (`/api/mobile/sync/push`, `/pull`, …)
 *    - Validates the user via `createClient()` (server), runs the same actions as the web app, persists
 *      idempotency in `mobile_sync_receipts`. Business logic parity: one path to Supabase.
 *
 * 3) SQLite on Capacitor (IndexedDB mirror when SQLite is unavailable)
 *    Tables are intentionally non-authoritative:
 *    - `entity_cache` — read-through cache (stale-at, prefer fresh from network when online).
 *    - `outbox` — durable mutation queue until push succeeds (idempotency key per attempt).
 *    - `sync_checkpoint` — pull/bookkeeping per domain.
 *    - `native_asset_registry` + app Filesystem — static visuals only; not user domain data.
 *
 * 4) Capacitor’s role
 *    - Shell (WebView), native SQLite, Filesystem for assets/splash, optional platform listeners.
 *    - Not a second backend: it does not replace Supabase writes; it adds durability and UX on device.
 *
 * Golden rules:
 *    - Writes: UI → local outbox → POST push → server actions → Supabase. Never “SQLite wins” over server.
 *    - Reads: use cache for instant UI; reconcile from `pull` or existing authenticated fetches.
 *    - Conflicts: default server wins (`DEFAULT_CONFLICT_POLICY`).
 *
 * Feature gate: `NEXT_PUBLIC_MOBILE_SYNC_ENABLED` (+ optional rollout). Capacitor: dat volstaat. Browser/PWA:
 * zet `NEXT_PUBLIC_MOBILE_SYNC_PWA=1` zodat IndexedDB dezelfde outbox/entity_cache gebruikt (zonder native app).
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


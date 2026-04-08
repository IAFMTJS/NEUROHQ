import { OUTBOX_MAX_RETRIES, type OutboxActionType } from "@/lib/mobile/supabase-first-contract";
import { getOutboxDepth, getOutboxRowsReady, removeOutboxRow, upsertOutboxRow } from "@/lib/mobile/db";
import { recordDeadLetterHint } from "@/lib/mobile/metrics";
import type { OutboxRow } from "@/lib/mobile/schema";

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createIdempotencyKey(action: OutboxActionType, payload: unknown): string {
  const base = JSON.stringify(payload ?? null);
  let hash = 0;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  return `${action}:${Date.now()}:${Math.abs(hash)}`;
}

export async function enqueueOutboxAction(params: {
  action: OutboxActionType;
  payload: unknown;
  idempotencyKey?: string;
}): Promise<OutboxRow> {
  const now = Date.now();
  const row: OutboxRow = {
    id: makeId(),
    action: params.action,
    payload: params.payload,
    idempotencyKey: params.idempotencyKey ?? createIdempotencyKey(params.action, params.payload),
    createdAt: now,
    retries: 0,
    nextRetryAt: now,
    lastError: null,
    status: "queued",
  };
  await upsertOutboxRow(row);
  return row;
}

export async function listReadyOutboxActions(limit = 30): Promise<OutboxRow[]> {
  return getOutboxRowsReady(Date.now(), limit);
}

export async function ackOutboxAction(id: string): Promise<void> {
  await removeOutboxRow(id);
}

export async function markOutboxActionFailed(row: OutboxRow, errorMessage: string): Promise<OutboxRow> {
  const retries = row.retries + 1;
  const deadLetter = retries >= OUTBOX_MAX_RETRIES;
  const nextRetryAt = deadLetter ? Date.now() : Date.now() + Math.min(60_000, 2 ** retries * 1_000);
  const nextRow: OutboxRow = {
    ...row,
    retries,
    nextRetryAt,
    lastError: errorMessage.slice(0, 500),
    status: deadLetter ? "dead_letter" : "queued",
  };
  await upsertOutboxRow(nextRow);
  if (deadLetter) {
    recordDeadLetterHint(row.action, errorMessage);
  }
  return nextRow;
}

export async function markOutboxActionProcessing(row: OutboxRow): Promise<void> {
  await upsertOutboxRow({
    ...row,
    status: "processing",
    nextRetryAt: Date.now() + 30_000,
  });
}

export async function getOutboxPendingDepth(): Promise<number> {
  return getOutboxDepth();
}


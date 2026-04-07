import { IDEMPOTENCY_HEADER, SYNC_CLIENT_HEADER, type OutboxActionType } from "@/lib/mobile/supabase-first-contract";
import {
  getOutboxPendingDepth,
  listReadyOutboxActions,
  markOutboxActionFailed,
  markOutboxActionProcessing,
} from "@/lib/mobile/outbox";
import { removeOutboxRowsBatch } from "@/lib/mobile/db";
import { publishSyncMetrics, recordOutboxDepth, recordSyncConflict, recordSyncFailure, recordSyncSuccess } from "@/lib/mobile/metrics";
import type { OutboxRow } from "@/lib/mobile/schema";

type PushResult = {
  ok: boolean;
  conflict?: boolean;
  status: number;
};

let flushInFlight: Promise<void> | null = null;

function endpointForAction(action: OutboxActionType): string {
  if (action === "task.create") return "/api/mobile/sync/push";
  if (action === "task.complete") return "/api/mobile/sync/push";
  return "/api/mobile/sync/push";
}

async function pushRow(row: OutboxRow): Promise<PushResult> {
  const action = row.action as OutboxActionType;
  const endpoint = endpointForAction(action);
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      [IDEMPOTENCY_HEADER]: row.idempotencyKey,
      [SYNC_CLIENT_HEADER]: "mobile-outbox-v1",
    },
    body: JSON.stringify({
      action,
      payload: row.payload,
      mutationId: row.id,
    }),
  });
  return {
    ok: response.ok,
    conflict: response.status === 409,
    status: response.status,
  };
}

async function flushOutboxOnce(): Promise<void> {
  const rows = await listReadyOutboxActions(30);
  if (rows.length === 0) {
    recordOutboxDepth(await getOutboxPendingDepth());
    return;
  }
  const toAck: string[] = [];
  for (const row of rows) {
    await markOutboxActionProcessing(row);
    try {
      const result = await pushRow(row);
      if (result.ok) {
        toAck.push(row.id);
        recordSyncSuccess();
      } else if (result.conflict) {
        toAck.push(row.id);
        recordSyncConflict();
      } else {
        await markOutboxActionFailed(row, `http-${result.status}`);
        recordSyncFailure();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "sync-failed";
      await markOutboxActionFailed(row, message);
      recordSyncFailure();
    }
  }
  if (toAck.length > 0) {
    await removeOutboxRowsBatch(toAck);
  }
  recordOutboxDepth(await getOutboxPendingDepth());
  void publishSyncMetrics();
}

export async function flushOutboxQueue(): Promise<void> {
  if (flushInFlight) return flushInFlight;
  flushInFlight = (async () => {
    try {
      await flushOutboxOnce();
    } finally {
      flushInFlight = null;
    }
  })();
  return flushInFlight;
}


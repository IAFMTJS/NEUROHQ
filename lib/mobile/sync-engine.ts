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

/** Outbox-push mag niet voor altijd blijven hangen (anders reageert “Nu synchroniseren” niet). */
const PUSH_FETCH_TIMEOUT_MS = 45_000;

let flushInFlight: Promise<void> | null = null;

export type FlushOutboxQueueOptions = {
  /**
   * Handmatige sync: wacht eventuele lopende flush af en draai daarna rondes tot de wachtrij leeg is
   * (max. ~40×30 rijen). Achtergrond-flushes blijven één golf per aanroep.
   */
  force?: boolean;
};

function endpointForAction(action: OutboxActionType): string {
  if (action === "task.create") return "/api/mobile/sync/push";
  if (action === "task.complete") return "/api/mobile/sync/push";
  return "/api/mobile/sync/push";
}

async function pushRow(row: OutboxRow): Promise<PushResult> {
  const action = row.action as OutboxActionType;
  const endpoint = endpointForAction(action);
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), PUSH_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      signal: controller.signal,
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
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, status: 408 };
    }
    throw err;
  } finally {
    globalThis.clearTimeout(timer);
  }
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

export async function flushOutboxQueue(options?: FlushOutboxQueueOptions): Promise<void> {
  const force = options?.force === true;

  if (flushInFlight) {
    await flushInFlight;
    if (!force) return;
  }

  flushInFlight = (async () => {
    try {
      if (force) {
        for (let round = 0; round < 40; round += 1) {
          await flushOutboxOnce();
          const next = await listReadyOutboxActions(1);
          if (next.length === 0) break;
        }
      } else {
        await flushOutboxOnce();
      }
    } finally {
      flushInFlight = null;
    }
  })();

  return flushInFlight;
}


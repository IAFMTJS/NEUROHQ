export const MOBILE_DB_NAME = "neurohq-mobile-cache";
export const MOBILE_DB_VERSION = 1;

export const STORE_ENTITY_CACHE = "entityCache";
export const STORE_OUTBOX = "outbox";
export const STORE_SYNC_CHECKPOINT = "syncCheckpoint";

export type EntityCacheRow = {
  key: string;
  payload: unknown;
  etag: string | null;
  serverVersion: string | null;
  fetchedAt: number;
  staleAt: number;
};

export type OutboxRow = {
  id: string;
  action: string;
  payload: unknown;
  idempotencyKey: string;
  createdAt: number;
  retries: number;
  nextRetryAt: number;
  lastError: string | null;
  status: "queued" | "processing" | "dead_letter";
};

export type SyncCheckpointRow = {
  domain: string;
  cursor: string;
  updatedAt: number;
};

/** Capacitor-only: maps web asset URLs to Filesystem paths under Directory.Data. */
export type NativeAssetRegistryRow = {
  urlKey: string;
  fsSubpath: string;
  etag: string | null;
  contentType: string | null;
  byteLength: number;
  fetchedAt: number;
};


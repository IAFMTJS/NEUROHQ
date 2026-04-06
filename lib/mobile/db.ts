import {
  MOBILE_DB_NAME,
  MOBILE_DB_VERSION,
  STORE_ENTITY_CACHE,
  STORE_OUTBOX,
  STORE_SYNC_CHECKPOINT,
  type EntityCacheRow,
  type OutboxRow,
  type SyncCheckpointRow,
} from "@/lib/mobile/schema";

type SQLiteLike = {
  execute: (statement: string, values?: unknown[]) => Promise<unknown>;
  query: (statement: string, values?: unknown[]) => Promise<{ values?: Record<string, unknown>[] }>;
};

let sqliteDbPromise: Promise<SQLiteLike | null> | null = null;

async function getNativeSqliteDb(): Promise<SQLiteLike | null> {
  if (sqliteDbPromise) return sqliteDbPromise;
  sqliteDbPromise = (async () => {
    try {
      const core = await import("@capacitor/core");
      const platform = core.Capacitor.getPlatform();
      const isNative = platform === "android" || platform === "ios";
      if (!isNative) return null;
      const sqliteModule = await import("@capacitor-community/sqlite");
      const sqliteConnection = new sqliteModule.SQLiteConnection(sqliteModule.CapacitorSQLite);
      const consistency = await sqliteConnection.checkConnectionsConsistency();
      const hasConnection = consistency.result
        ? await sqliteConnection.isConnection("neurohq_mobile", false)
        : { result: false };
      const db = hasConnection.result
        ? await sqliteConnection.retrieveConnection("neurohq_mobile", false)
        : await sqliteConnection.createConnection("neurohq_mobile", false, "no-encryption", 1, false);
      await db.open();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS entity_cache (
          key TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          etag TEXT,
          server_version TEXT,
          fetched_at INTEGER NOT NULL,
          stale_at INTEGER NOT NULL
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS outbox (
          id TEXT PRIMARY KEY NOT NULL,
          action TEXT NOT NULL,
          payload TEXT NOT NULL,
          idempotency_key TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          retries INTEGER NOT NULL DEFAULT 0,
          next_retry_at INTEGER NOT NULL,
          last_error TEXT,
          status TEXT NOT NULL
        );
      `);
      await db.execute("CREATE INDEX IF NOT EXISTS idx_outbox_next_retry ON outbox(status, next_retry_at);");
      await db.execute(`
        CREATE TABLE IF NOT EXISTS sync_checkpoint (
          domain TEXT PRIMARY KEY NOT NULL,
          cursor TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      return {
        execute: (statement: string, values?: unknown[]) => db.run(statement, values ?? []),
        query: (statement: string, values?: unknown[]) => db.query(statement, values ?? []),
      };
    } catch {
      return null;
    }
  })();
  return sqliteDbPromise;
}

function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(MOBILE_DB_NAME, MOBILE_DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("mobile-idb-open-failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ENTITY_CACHE)) {
        db.createObjectStore(STORE_ENTITY_CACHE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_CHECKPOINT)) {
        db.createObjectStore(STORE_SYNC_CHECKPOINT, { keyPath: "domain" });
      }
    };
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openIndexedDb();
  try {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    return await run(store);
  } finally {
    db.close();
  }
}

function idbGet<T>(store: IDBObjectStore, key: IDBValidKey): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error("mobile-idb-get-failed"));
  });
}

function idbPut(store: IDBObjectStore, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("mobile-idb-put-failed"));
  });
}

function idbDelete(store: IDBObjectStore, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error("mobile-idb-delete-failed"));
  });
}

function idbGetAll<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[] | undefined) ?? []);
    req.onerror = () => reject(req.error ?? new Error("mobile-idb-get-all-failed"));
  });
}

function encodeJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function decodeJson<T>(value: unknown): T | null {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function getEntityCacheRow(key: string): Promise<EntityCacheRow | null> {
  const native = await getNativeSqliteDb();
  if (native) {
    const result = await native.query(
      "SELECT key, payload, etag, server_version, fetched_at, stale_at FROM entity_cache WHERE key = ? LIMIT 1",
      [key]
    );
    const row = result.values?.[0];
    if (!row) return null;
    return {
      key: String(row.key),
      payload: decodeJson(row.payload),
      etag: row.etag == null ? null : String(row.etag),
      serverVersion: row.server_version == null ? null : String(row.server_version),
      fetchedAt: Number(row.fetched_at ?? 0),
      staleAt: Number(row.stale_at ?? 0),
    };
  }
  return withStore<EntityCacheRow | null>(STORE_ENTITY_CACHE, "readonly", (store) => idbGet<EntityCacheRow>(store, key));
}

export async function upsertEntityCacheRow(row: EntityCacheRow): Promise<void> {
  const native = await getNativeSqliteDb();
  if (native) {
    await native.execute(
      `INSERT OR REPLACE INTO entity_cache (key, payload, etag, server_version, fetched_at, stale_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [row.key, encodeJson(row.payload), row.etag, row.serverVersion, row.fetchedAt, row.staleAt]
    );
    return;
  }
  await withStore<void>(STORE_ENTITY_CACHE, "readwrite", (store) => idbPut(store, row));
}

export async function upsertOutboxRow(row: OutboxRow): Promise<void> {
  const native = await getNativeSqliteDb();
  if (native) {
    await native.execute(
      `INSERT OR REPLACE INTO outbox (
        id, action, payload, idempotency_key, created_at, retries, next_retry_at, last_error, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.id,
        row.action,
        encodeJson(row.payload),
        row.idempotencyKey,
        row.createdAt,
        row.retries,
        row.nextRetryAt,
        row.lastError,
        row.status,
      ]
    );
    return;
  }
  await withStore<void>(STORE_OUTBOX, "readwrite", (store) => idbPut(store, row));
}

export async function getOutboxRowsReady(now: number, limit = 30): Promise<OutboxRow[]> {
  const native = await getNativeSqliteDb();
  if (native) {
    const result = await native.query(
      `SELECT id, action, payload, idempotency_key, created_at, retries, next_retry_at, last_error, status
       FROM outbox
       WHERE status IN ('queued', 'processing') AND next_retry_at <= ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [now, limit]
    );
    return (result.values ?? []).map((row) => ({
      id: String(row.id),
      action: String(row.action),
      payload: decodeJson(row.payload),
      idempotencyKey: String(row.idempotency_key),
      createdAt: Number(row.created_at ?? 0),
      retries: Number(row.retries ?? 0),
      nextRetryAt: Number(row.next_retry_at ?? 0),
      lastError: row.last_error == null ? null : String(row.last_error),
      status: row.status === "dead_letter" ? "dead_letter" : row.status === "processing" ? "processing" : "queued",
    }));
  }
  const allRows = await withStore<OutboxRow[]>(STORE_OUTBOX, "readonly", (store) => idbGetAll<OutboxRow>(store));
  return allRows
    .filter((r) => (r.status === "queued" || r.status === "processing") && r.nextRetryAt <= now)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit);
}

export async function removeOutboxRow(id: string): Promise<void> {
  const native = await getNativeSqliteDb();
  if (native) {
    await native.execute("DELETE FROM outbox WHERE id = ?", [id]);
    return;
  }
  await withStore<void>(STORE_OUTBOX, "readwrite", (store) => idbDelete(store, id));
}

export async function getOutboxDepth(): Promise<number> {
  const native = await getNativeSqliteDb();
  if (native) {
    const result = await native.query("SELECT COUNT(1) AS c FROM outbox WHERE status IN ('queued', 'processing')");
    return Number(result.values?.[0]?.c ?? 0);
  }
  const allRows = await withStore<OutboxRow[]>(STORE_OUTBOX, "readonly", (store) => idbGetAll<OutboxRow>(store));
  return allRows.filter((row) => row.status === "queued" || row.status === "processing").length;
}

export async function getSyncCheckpoint(domain: string): Promise<SyncCheckpointRow | null> {
  const native = await getNativeSqliteDb();
  if (native) {
    const result = await native.query(
      "SELECT domain, cursor, updated_at FROM sync_checkpoint WHERE domain = ? LIMIT 1",
      [domain]
    );
    const row = result.values?.[0];
    if (!row) return null;
    return {
      domain: String(row.domain),
      cursor: String(row.cursor),
      updatedAt: Number(row.updated_at ?? 0),
    };
  }
  return withStore<SyncCheckpointRow | null>(STORE_SYNC_CHECKPOINT, "readonly", (store) =>
    idbGet<SyncCheckpointRow>(store, domain)
  );
}

export async function upsertSyncCheckpoint(row: SyncCheckpointRow): Promise<void> {
  const native = await getNativeSqliteDb();
  if (native) {
    await native.execute(
      "INSERT OR REPLACE INTO sync_checkpoint (domain, cursor, updated_at) VALUES (?, ?, ?)",
      [row.domain, row.cursor, row.updatedAt]
    );
    return;
  }
  await withStore<void>(STORE_SYNC_CHECKPOINT, "readwrite", (store) => idbPut(store, row));
}


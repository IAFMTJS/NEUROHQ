"use client";

import { useCallback, useEffect, useState } from "react";
import { isNativeCapacitorRuntime, isSupabaseFirstMobileEnabled } from "@/lib/mobile/feature-flags";
import {
  getOutboxDeadLetterCount,
  getOutboxDepth,
  listOutboxDeadLetterSample,
  type OutboxDeadLetterSample,
} from "@/lib/mobile/db";
import { getSyncMetrics } from "@/lib/mobile/metrics";
import { flushOutboxQueue } from "@/lib/mobile/sync-engine";

export function SettingsMobileSyncHealth() {
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(0);
  const [deadCount, setDeadCount] = useState(0);
  const [samples, setSamples] = useState<OutboxDeadLetterSample[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<string | null>(null);
  const [deadHint, setDeadHint] = useState<string | null>(null);
  const [flushBusy, setFlushBusy] = useState(false);
  const [reloadBusy, setReloadBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = mounted && isSupabaseFirstMobileEnabled();
  const storageLabel = isNativeCapacitorRuntime() ? "SQLite (native)" : "IndexedDB (browser/PWA)";

  const load = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    try {
      const [depth, dCount, sampleList, m] = await Promise.all([
        getOutboxDepth(),
        getOutboxDeadLetterCount(),
        listOutboxDeadLetterSample(5),
        Promise.resolve(getSyncMetrics()),
      ]);
      setPending(depth);
      setDeadCount(dCount);
      setSamples(sampleList);
      setMetricsSummary(
        `Sync OK ${m.syncSuccessCount} · mislukt ${m.syncFailureCount} · conflict ${m.syncConflictCount} · cache fris ${m.freshReadCount} / verouderd ${m.staleReadCount}`
      );
      if (m.lastDeadLetterSummary && m.lastDeadLetterAt > 0) {
        const when = new Date(m.lastDeadLetterAt).toLocaleString("nl-NL");
        setDeadHint(`${when}: ${m.lastDeadLetterSummary}`);
      } else {
        setDeadHint(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Laden mislukt");
    }
  }, [enabled]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
    const t = window.setInterval(() => void load(), 12_000);
    return () => clearInterval(t);
  }, [enabled, load]);

  async function handleFlush() {
    if (!enabled || flushBusy) return;
    setFlushBusy(true);
    setError(null);
    try {
      await flushOutboxQueue();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Flush mislukt");
    } finally {
      setFlushBusy(false);
    }
  }

  if (!mounted || !enabled) return null;

  return (
    <div className="card-simple p-4 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Offline sync &amp; wachtrij</h3>
      <p className="text-[11px] text-[var(--text-muted)]">
        Lokale opslag: <span className="font-medium text-[var(--text-secondary)]">{storageLabel}</span>
      </p>
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        Wachtrij naar de server. Geen realtime tussen toestellen; dit toestel toont wijzigingen direct, sync loopt op de
        achtergrond.
      </p>
      <ul className="text-xs text-[var(--text-secondary)] space-y-1 font-mono">
        <li>
          Wachtrij (queued/processing): <strong className="text-[var(--text-primary)]">{pending}</strong>
        </li>
        <li>
          Dead letter (max retries): <strong className="text-[var(--text-primary)]">{deadCount}</strong>
        </li>
      </ul>
      {metricsSummary && <p className="text-[11px] text-[var(--text-muted)] leading-snug">{metricsSummary}</p>}
      {deadHint && (
        <p className="text-[11px] text-amber-200/90 leading-snug" role="status">
          Laatste dead letter: {deadHint}
        </p>
      )}
      {samples.length > 0 && (
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)]/40 p-2 text-[10px] text-[var(--text-muted)] space-y-1.5 max-h-40 overflow-y-auto">
          <span className="font-semibold text-[var(--text-secondary)]">Recent dead letter (max 5)</span>
          {samples.map((s) => (
            <div key={s.id} className="border-t border-[var(--card-border)] pt-1 first:border-t-0 first:pt-0">
              <div className="text-[var(--text-primary)]">
                {s.action} · retries {s.retries}
              </div>
              {s.lastError && <div className="break-words opacity-90">{s.lastError}</div>}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleFlush()}
          disabled={flushBusy}
          className="rounded-lg border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-3 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 disabled:opacity-50"
        >
          {flushBusy ? "Synchroniseren…" : "Nu synchroniseren"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (reloadBusy) return;
            setReloadBusy(true);
            void load().finally(() => setReloadBusy(false));
          }}
          disabled={reloadBusy}
          className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50"
        >
          Vernieuwen
        </button>
      </div>
    </div>
  );
}

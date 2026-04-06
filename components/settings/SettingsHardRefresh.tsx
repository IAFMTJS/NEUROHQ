"use client";

import { useState } from "react";
import { clearDailySnapshot } from "@/lib/daily-snapshot-storage";

/**
 * One-shot: clear daily snapshot, NeuroHQ caches, check for a new service worker
 * (activate via SKIP_WAITING like the update toast), otherwise unregister SW and reload.
 */
export function SettingsHardRefresh() {
  const [loading, setLoading] = useState(false);

  async function handleHardRefresh() {
    if (loading) return;
    setLoading(true);
    try {
      await clearDailySnapshot();

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith("neurohq-")).map((k) => caches.delete(k)));
      }

      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
        if (reg) {
          await reg.update().catch(() => {});
          // Install often finishes shortly after update(); brief wait improves odds we activate via skipWaiting.
          await new Promise((r) => setTimeout(r, 250));
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
            return;
          }
        }
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }

      window.location.reload();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="card-simple p-4">
      <p className="text-sm text-[var(--text-muted)] mb-2">
        Alles in één keer: lokale dag-snapshot wissen, app-cache legen, controleren op een nieuwe app-versie (zoals
        bij &quot;Nieuwe versie beschikbaar&quot;) en daarna herladen. Gebruik dit als iets blijft hangen of je de
        nieuwste build wilt.
      </p>
      <button
        type="button"
        onClick={handleHardRefresh}
        disabled={loading}
        className="rounded-lg border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--accent-focus)]/20 disabled:opacity-50"
      >
        {loading ? "Bezig…" : "Volledig vernieuwen"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";

/** Clears service worker caches and optionally unregisters SW, then reloads. Helps with white/empty page after login. */
export function SettingsClearCache() {
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    if (loading) return;
    setLoading(true);
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k.startsWith("neurohq-")).map((k) => caches.delete(k))
        );
      }
      if ("serviceWorker" in navigator) {
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
        Bij een witte of lege pagina na inloggen: cache en service worker legen en opnieuw laden.
      </p>
      <button
        type="button"
        onClick={handleClear}
        disabled={loading}
        className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50"
      >
        {loading ? "Bezig…" : "Cache legen en herladen"}
      </button>
    </div>
  );
}

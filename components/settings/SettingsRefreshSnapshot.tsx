"use client";

import { useState } from "react";
import { clearDailySnapshot } from "@/lib/daily-snapshot-storage";

/**
 * Clears the daily snapshot and reloads so the app runs the full preloader
 * and fetches a fresh snapshot. Use when you want to force "today's data"
 * to be re-fetched (e.g. after fixing something on the server).
 */
export function SettingsRefreshSnapshot() {
  const [loading, setLoading] = useState(false);

  async function handleRefresh() {
    if (loading) return;
    setLoading(true);
    try {
      await clearDailySnapshot();
      window.location.reload();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="card-simple p-4">
      <p className="text-sm text-[var(--text-muted)] mb-2">
        Vandaag opnieuw inladen: haalt dashboard, missies, XP, strategie, budget en learning opnieuw op en toont daarna de app met verse data.
      </p>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        className="rounded-lg border border-[var(--accent-neutral)] bg-transparent px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-white/5 disabled:opacity-50"
      >
        {loading ? "Bezig…" : "Vandaag opnieuw inladen"}
      </button>
    </div>
  );
}

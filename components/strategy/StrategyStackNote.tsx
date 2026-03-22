"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "neurohq-strategy-stack-note";

/**
 * Optional free text: how missions, budget, and growth fit your thesis this week.
 * Stored locally only (no migration).
 */
export function StrategyStackNote() {
  const [value, setValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setValue(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      setValue("");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore quota */
    }
  }, [value, mounted]);

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/60 p-4">
      <label htmlFor="strategy-stack-note" className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Hoe laat je dit in je strategie vallen? (optioneel)
      </label>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">
        Korte notitie: hoe Missions, Budget en Growth deze week samen je thesis dragen. Alleen op dit apparaat opgeslagen.
      </p>
      <textarea
        id="strategy-stack-note"
        value={mounted ? value : ""}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Bijv. deze week drukt budget op hobby-uitgaven → meer learning-missies, minder business-runs…"
        rows={3}
        className="mt-3 w-full resize-y rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)]/80 px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-focus)]"
      />
    </div>
  );
}

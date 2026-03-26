"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "neurohq-callsign";

export function UserCallsignCard() {
  const [callsign, setCallsign] = useState("Commander");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && stored.trim()) {
        setCallsign(stored.trim());
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <section className="card-simple space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Personalisatie</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Kies hoe de app je aanspreekt in de begroeting.
        </p>
      </div>
      <label className="block text-xs text-[var(--text-muted)]">
        Aanspreektitel
        <input
          value={callsign}
          onChange={(e) => {
            setCallsign(e.target.value);
            setSaved(false);
          }}
          maxLength={24}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          placeholder="Commander"
        />
      </label>
      <button
        type="button"
        className="btn-secondary rounded-lg px-3 py-2 text-sm font-medium"
        onClick={() => {
          const next = (callsign.trim() || "Commander").slice(0, 24);
          setCallsign(next);
          try {
            window.localStorage.setItem(STORAGE_KEY, next);
            window.dispatchEvent(new CustomEvent("neurohq-callsign-updated", { detail: { callsign: next } }));
          } catch {
            // ignore
          }
          setSaved(true);
        }}
      >
        Opslaan
      </button>
      {saved && <p className="text-xs text-[var(--text-muted)]">Opgeslagen.</p>}
    </section>
  );
}


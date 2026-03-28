"use client";

import { useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useSettings } from "@/lib/settings-context";

type Props = {
  initialSimplifiedContent: boolean;
  /** Geen dubbele kaart-rand (bijv. in Engine-modi modal). */
  embedded?: boolean;
};

/** Minder secundaire tekst en geen growth shortcut-toast; zelfde thema’s en componenten. */
export function SettingsSimplifiedContent({ initialSimplifiedContent, embedded = false }: Props) {
  const [on, setOn] = useState(initialSimplifiedContent);
  const [pending, startTransition] = useTransition();
  const { invalidate } = useSettings();

  const toggle = () => {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      await updateUserPreferences({ simplified_content: next });
      await invalidate();
    });
  };

  const body = (
    <>
      {embedded ? (
        <p className="text-xs text-[var(--text-muted)]">
          Kortere tekst op kaarten en minder snackbars voor snelkoppelingen (navigatie blijft in de balk). Geen andere
          stijl.
        </p>
      ) : (
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Eenvoudige modus</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Kortere tekst op kaarten en minder snackbars voor snelkoppelingen (navigatie blijft in de balk). Geen andere
            stijl.
          </p>
        </div>
      )}
      <div className={`flex items-center justify-between ${embedded ? "pt-2" : "p-4"}`}>
        <span className="text-sm text-[var(--text-secondary)]">{on ? "Aan" : "Uit"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={pending}
          onClick={toggle}
          className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
          data-state={on ? "on" : "off"}
        >
          <span
            className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform data-[state=on]:translate-x-5"
            data-state={on ? "on" : "off"}
            style={{ transform: on ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-1">{body}</div>;
  }

  return <div className="card-simple overflow-hidden p-0">{body}</div>;
}

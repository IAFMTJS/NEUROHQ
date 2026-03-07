"use client";

import { useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";

type Props = { initialLightUi: boolean };

export function SettingsLightUI({ initialLightUi }: Props) {
  const [light, setLight] = useState(initialLightUi);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.dataset.lightUi = next ? "true" : "false";
    try {
      localStorage.setItem("neurohq-light-ui", next ? "true" : "false");
    } catch (_) {}
    startTransition(async () => {
      await updateUserPreferences({ light_ui: next });
    });
  };

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Light version</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Minder animaties, snellere interface, dezelfde look. Ideaal voor snel gebruik.
        </p>
      </div>
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-[var(--text-secondary)]">
          {light ? "Aan" : "Uit"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={light}
          disabled={pending}
          onClick={toggle}
          className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
          data-state={light ? "on" : "off"}
        >
          <span
            className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform data-[state=on]:translate-x-5"
            data-state={light ? "on" : "off"}
            style={{ transform: light ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>
    </div>
  );
}

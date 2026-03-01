"use client";

import { useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import type { UserPreferences } from "@/types/preferences.types";

type Props = { initialCompactUi: boolean };

export function SettingsCompactUi({ initialCompactUi }: Props) {
  const [compact, setCompact] = useState(initialCompactUi);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !compact;
    setCompact(next);
    document.documentElement.dataset.compactUi = next ? "true" : "false";
    startTransition(async () => {
      await updateUserPreferences({ compact_ui: next });
    });
  };

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Compacte weergave</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Minder witruimte op dashboard en kaarten; meer inhoud op één scherm.
        </p>
      </div>
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-[var(--text-secondary)]">
          {compact ? "Aan" : "Uit"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={compact}
          disabled={pending}
          onClick={toggle}
          className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
          data-state={compact ? "on" : "off"}
        >
          <span
            className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform data-[state=on]:translate-x-5"
            data-state={compact ? "on" : "off"}
            style={{ transform: compact ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>
    </div>
  );
}

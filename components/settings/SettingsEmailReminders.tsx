"use client";

import { useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";

type Props = { initialEnabled: boolean };

export function SettingsEmailReminders({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      await updateUserPreferences({ email_reminders_enabled: next });
    });
  };

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Email reminders</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Morning email (~9h), evening check-in (~20h), and the weekly learning reminder. You can turn this off anytime.
        </p>
      </div>
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-[var(--text-secondary)]">
          {enabled ? "Aan" : "Uit"}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={toggle}
          className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60 data-[state=on]:bg-[var(--accent)]"
          data-state={enabled ? "on" : "off"}
        >
          <span
            className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform data-[state=on]:translate-x-5"
            data-state={enabled ? "on" : "off"}
            style={{ transform: enabled ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>
    </div>
  );
}

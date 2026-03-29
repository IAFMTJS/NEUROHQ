"use client";

import { useState, useTransition } from "react";
import { updateUserPreferences } from "@/app/actions/preferences";
import { useSettings } from "@/lib/settings-context";
import { neuroToast } from "@/lib/ui/neuro-toast";

type Props = { initialEnabled: boolean };

export function SettingsAutoMasterMissions({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const { invalidate: invalidateSettings } = useSettings();

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Auto-missies (Master Pool)</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Voegt automatisch structuur- en identiteitsmissies toe aan je dag (na brain check-in), passend bij je energieband.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm text-[var(--text-secondary)]">{enabled ? "Aan" : "Uit"}</span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={pending}
          onClick={() => {
            const next = !enabled;
            setEnabled(next);
            startTransition(async () => {
              try {
                await updateUserPreferences({ auto_master_missions: next });
                await invalidateSettings();
                neuroToast.success(next ? "Auto-missies aan." : "Auto-missies uit.");
              } catch (e) {
                setEnabled(!next);
                neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
              }
            });
          }}
          className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--input-bg)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] disabled:opacity-60"
          data-state={enabled ? "on" : "off"}
        >
          <span
            className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
            style={{ transform: enabled ? "translateX(20px)" : "translateX(2px)" }}
          />
        </button>
      </div>
    </div>
  );
}

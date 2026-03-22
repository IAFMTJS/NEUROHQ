"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { DcicModeHelpContent } from "@/components/dcic/DcicModeHelpContent";
import { readDCICModeOverride } from "@/lib/dcic/dcic-mode-override";

/** Instellingen: uitleg Focus / War / Recovery (zelfde inhoud als Commander-status modal). */
export function SettingsDcicModeExplain() {
  const [open, setOpen] = useState(false);
  const [override, setOverride] = useState<ReturnType<typeof readDCICModeOverride>>(null);
  useEffect(() => {
    setOverride(readDCICModeOverride());
  }, [open]);

  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Focus, War en Recovery</h3>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Waarom zie je soms recovery als suggestie, en wanneer is war alleen een advies?{" "}
        <button
          type="button"
          className="text-[var(--accent-focus)] underline-offset-2 hover:underline"
          onClick={() => setOpen(true)}
        >
          Lees uitleg
        </button>
      </p>
      <Modal open={open} onClose={() => setOpen(false)} title="Focus, War en Recovery">
        <DcicModeHelpContent
          manualOverrideActive={!!override && override.mode !== "focus"}
          suggestionDiffersFromCurrent={false}
        />
      </Modal>
    </div>
  );
}

"use client";

import { useState } from "react";
import { HowItWorksModal } from "@/components/HowItWorksModal";

type Props = { appVersion: string };

export function SettingsAbout({ appVersion }: Props) {
  const [showHow, setShowHow] = useState(false);

  return (
    <>
      <div className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">About</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--text-muted)]">
            NEUROHQ — nervous-system-aware personal operating system. Version {appVersion}.
          </p>
          <button
            type="button"
            onClick={() => setShowHow(true)}
            className="mt-3 text-sm font-medium text-[var(--accent-focus)] hover:underline"
          >
            How it works
          </button>
        </div>
      </div>
      <HowItWorksModal open={showHow} onClose={() => setShowHow(false)} />
    </>
  );
}

"use client";

import { useState } from "react";
import { HowItWorksModal } from "@/components/HowItWorksModal";

type Props = { appVersion: string };

export function SettingsAbout({ appVersion }: Props) {
  const [showHow, setShowHow] = useState(false);

  return (
    <>
      <div className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">About</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-neuro-muted">
            NEUROHQ — nervous-system-aware personal operating system. Version {appVersion}.
          </p>
          <button
            type="button"
            onClick={() => setShowHow(true)}
            className="mt-3 text-sm font-medium text-neuro-blue hover:underline"
          >
            How it works
          </button>
        </div>
      </div>
      <HowItWorksModal open={showHow} onClose={() => setShowHow(false)} />
    </>
  );
}

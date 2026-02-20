"use client";

import { useEffect, useState } from "react";
import { checkInactivity } from "@/app/actions/behavior";

export function InactivityWarning() {
  const [inactiveDays, setInactiveDays] = useState<number | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    checkInactivity()
      .then(({ inactiveDays, shouldWarn }) => {
        setInactiveDays(inactiveDays);
        setShowWarning(shouldWarn);
      })
      .catch((err) => {
        console.error("Failed to check inactivity:", err);
        // Silently fail - don't show warning if check fails
      });
  }, []);

  if (!showWarning || inactiveDays === null) return null;

  return (
    <div className="card-simple border-red-500/50 bg-red-500/10">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>⚠️</span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Inactivity Detected
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            You have not studied for {inactiveDays} day{inactiveDays !== 1 ? "s" : ""}.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            This is not a notification. This is a confrontation.
          </p>
        </div>
        <button
          onClick={() => setShowWarning(false)}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}

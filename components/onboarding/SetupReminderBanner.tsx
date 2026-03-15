"use client";

import Link from "next/link";
import { useOnboarding } from "./OnboardingProvider";

/**
 * Shown on dashboard when user skipped the tutorial. Gentle reminder to finish setup.
 * Dismissible; state stored in localStorage.
 */
export function SetupReminderBanner() {
  const onboarding = useOnboarding();

  if (!onboarding?.showSetupReminder) return null;

  return (
    <div
      className="card-simple-accent mb-2 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
      role="region"
      aria-label="Setup reminder"
    >
      <p className="text-[var(--text-primary)]">
        <span className="font-medium text-[var(--accent-focus)]">Finish setup:</span>{" "}
        Set your Brain Status and add a task to get the most out of NeuroHQ.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onboarding.openIntroModal()}
          className="btn-primary rounded-xl px-3 py-1.5 text-sm"
        >
          Take the tour
        </button>
        <Link
          href="/help"
          className="rounded-xl border border-[var(--card-border)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]"
        >
          View Setup Guide
        </Link>
        <button
          type="button"
          onClick={() => onboarding.dismissSetupReminder()}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          aria-label="Dismiss reminder"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

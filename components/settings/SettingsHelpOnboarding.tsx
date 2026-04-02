"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { getRoutesVisited } from "@/lib/onboarding-storage";
import { profileInsightsHref } from "@/lib/profile-routes";

const MAIN_ROUTES: { path: string; label: string; href?: string }[] = [
  { path: "/dashboard", label: "HQ" },
  { path: "/tasks", label: "Missions" },
  { path: "/budget", label: "Budget" },
  { path: "/learning", label: "Growth" },
  { path: "/profile", label: "XP" },
  { path: "/strategy", label: "Strategy" },
  { path: "/report", label: "Insights", href: profileInsightsHref("overview") },
];

export function SettingsHelpOnboarding() {
  const onboarding = useOnboarding();
  const [visited, setVisited] = useState<string[]>([]);

  useEffect(() => {
    setVisited(getRoutesVisited());
  }, []);

  const unvisited = MAIN_ROUTES.filter((r) => !visited.includes(r.path));

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Help & Onboarding
      </h2>
      <div className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">
          Restart the tutorial to see the intro and walkthrough again.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onboarding?.restartTutorial()}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10"
          >
            Restart Quick Tutorial
          </button>
          <button
            type="button"
            onClick={() => onboarding?.restartTutorial()}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/80 px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10"
          >
            Restart Full Tutorial
          </button>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          <Link
            href="/help"
            className="font-medium text-[var(--accent-focus)] hover:underline"
          >
            View Setup Guide
          </Link>
          {" "}— full help and documentation.
        </p>
        {unvisited.length > 0 && (
          <div className="border-t border-[var(--card-border)] pt-3 mt-3">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">
              You haven&apos;t opened these yet
            </p>
            <ul className="space-y-1.5">
              {unvisited.map((r) => (
                <li key={r.path}>
                  <Link
                    href={r.href ?? r.path}
                    className="text-sm text-[var(--accent-focus)] hover:underline"
                  >
                    {r.label}
                  </Link>
                  <span className="text-sm text-[var(--text-muted)]">
                    {" "}— you haven&apos;t opened {r.label} yet
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

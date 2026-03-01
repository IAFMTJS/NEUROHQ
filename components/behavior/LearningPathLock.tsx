"use client";

import Link from "next/link";

interface LearningPathLockProps {
  hasBook: boolean;
}

export function LearningPathLock({ hasBook }: LearningPathLockProps) {
  if (hasBook) return null;

  return (
    <div className="card-simple border-amber-500/50 bg-amber-500/10">
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>🔒</span>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Learning Path Required
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Choose a learning path to unlock progression.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Kies een maandboek of opleidingsoptie om door te gaan. Overal staan reminders tot je een pad kiest.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link href="/learning" className="text-sm font-medium text-[var(--accent-focus)] hover:underline">
              Kies een boek →
            </Link>
            <Link href="/learning#education-options" className="text-sm font-medium text-[var(--accent-focus)] hover:underline">
              Opleidingsoptie →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

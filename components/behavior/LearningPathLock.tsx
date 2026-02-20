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
            People need direction. Select a monthly book or education option to continue.
          </p>
          <Link
            href="/learning#education-options"
            className="mt-3 inline-block text-sm font-medium text-[var(--accent-focus)] hover:underline"
          >
            Choose a path →
          </Link>
        </div>
      </div>
    </div>
  );
}

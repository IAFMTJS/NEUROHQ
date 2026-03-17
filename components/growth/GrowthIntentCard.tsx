"use client";

import type { FC } from "react";
import type { LearningFocus } from "@/app/actions/learning-state";
import Link from "next/link";

type Props = {
  focus: LearningFocus;
  currentBookTitle: string | null;
};

export const GrowthIntentCard: FC<Props> = ({ focus, currentBookTitle }) => {
  const primary = focus.primary;
  const secondary = focus.secondary;

  const showDriftWarning =
    primary &&
    secondary &&
    primary.sessionsThisWeek === 0 &&
    secondary.sessionsThisWeek > 0;

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Primary directive</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Concrete orders for this week. No vague wishes.
          </p>
        </div>
        <Link
          href="/strategy"
          className="inline-flex items-center rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:border-[var(--accent-focus)] hover:text-[var(--accent-focus)]"
        >
          Edit focus
        </Link>
      </div>
      <div className="p-4 space-y-3">
        {(!primary && !secondary && !currentBookTitle) ? (
          <p className="text-sm text-[var(--text-muted)]">
            Define one directive for this week (not five ideas). This becomes the baseline the system defends.
          </p>
        ) : (
          <>
            {primary && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    PRIMARY DIRECTIVE
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                    {primary.name}
                  </p>
                  {primary.why && (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {primary.why}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">
                    This week
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                    {primary.sessionsThisWeek} session{primary.sessionsThisWeek === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            )}

            {secondary && (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    SECONDARY OBJECTIVE
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[var(--text-primary)]">
                    {secondary.name}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-[var(--text-muted)]">
                  {secondary.sessionsThisWeek} sessions this week
                </p>
              </div>
            )}

            {currentBookTitle && (
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  Current book
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">
                  {currentBookTitle}
                </p>
              </div>
            )}
          </>
        )}

        {showDriftWarning && (
          <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-100">
            Primary directive is being ignored. Drift increasing.
          </div>
        )}
      </div>
    </section>
  );
};


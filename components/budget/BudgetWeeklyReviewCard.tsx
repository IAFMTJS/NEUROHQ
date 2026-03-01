"use client";

import { useState, useTransition } from "react";
import { completeBudgetWeeklyReview } from "@/app/actions/budget-weekly-review";

type Props = {
  completedThisWeek: boolean;
};

export function BudgetWeeklyReviewCard({ completedThisWeek }: Props) {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(completedThisWeek);

  function handleComplete() {
    if (done) return;
    startTransition(async () => {
      try {
        await completeBudgetWeeklyReview();
        setDone(true);
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Weekly Budget Review</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            One calm check-in per week: what worked, what slipped, what to adjust.
          </p>
        </div>
        <button
          type="button"
          onClick={handleComplete}
          disabled={done || pending}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            done
              ? "border border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
              : "border border-[var(--card-border)] bg-[var(--bg-surface)]/80 text-[var(--text-muted)] hover:border-[var(--accent-primary)]/60 hover:text-[var(--accent-primary)]"
          }`}
        >
          {done ? "Completed this week" : pending ? "Saving…" : "Mark done"}
        </button>
      </div>
      <div className="p-4 space-y-2">
        <p className="text-xs text-[var(--text-muted)]">
          Use this moment to glance at your categories, overspending, and impulse tags. No data entry
          required — just acknowledge and adjust.
        </p>
        {!done && (
          <p className="text-xs text-[var(--text-secondary)]">
            Completing at least one review per week will increasingly feed into your Discipline Index.
          </p>
        )}
      </div>
    </section>
  );
}


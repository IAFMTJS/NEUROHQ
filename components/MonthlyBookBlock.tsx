"use client";

import { useState, useTransition } from "react";
import { setMonthlyBook, completeMonthlyBook } from "@/app/actions/learning";

type Props = { initial: { title: string; completed_at: string | null } | null };

export function MonthlyBookBlock({ initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [pending, startTransition] = useTransition();

  function handleSetTitle(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(() => setMonthlyBook(title.trim()));
  }

  function handleComplete() {
    startTransition(() => completeMonthlyBook());
  }

  const completed = !!initial?.completed_at;

  return (
    <section className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">This month&apos;s book</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">1 book per month goal.</p>
      </div>
      <div className="p-4 space-y-3">
        {!initial ? (
          <form onSubmit={handleSetTitle} className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title"
              className="flex-1 rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30"
            />
            <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
              Set
            </button>
          </form>
        ) : (
          <>
            <p className="text-sm font-medium text-neuro-silver">{initial.title}</p>
            {completed ? (
              <p className="text-xs text-green-500/80">✓ Completed this month</p>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={pending}
                className="rounded-lg bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
              >
                Mark complete
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

"use client";

import type { FC } from "react";
import { useState, useTransition } from "react";
import { addMonthlyBook, setMonthlyBook } from "@/app/actions/learning";

type Props = {
  currentBookTitle: string | null;
  totalPages: number | null;
};

export const MonthlyBookCard: FC<Props> = ({ currentBookTitle, totalPages }) => {
  const [title, setTitle] = useState(currentBookTitle ?? "");
  const [pages, setPages] = useState(totalPages != null ? String(totalPages) : "");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const parsedPages = pages.trim() ? parseInt(pages.trim(), 10) : NaN;
    const safePages = Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : null;

    startTransition(async () => {
      try {
        if (currentBookTitle) {
          await setMonthlyBook(trimmedTitle, 1, safePages);
        } else {
          await addMonthlyBook(trimmedTitle, safePages);
        }
      } catch {
        // Errors surface via toasts elsewhere; keep UI calm here.
      }
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Monthly book</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Set your current book so Growth and Missions can nudge you to read a few pages.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Book title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Work"
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              disabled={pending}
              required
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Total pages (optional)
            </label>
            <input
              type="number"
              min={1}
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              placeholder="e.g. 220"
              disabled={pending}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 sm:mt-0 inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : currentBookTitle ? "Update book" : "Set book"}
          </button>
        </div>
        {currentBookTitle && (
          <p className="text-[11px] text-[var(--text-muted)]">
            Current: <span className="font-medium text-[var(--text-secondary)]">{currentBookTitle}</span>
            {totalPages != null && ` · ${totalPages} pages`}
          </p>
        )}
      </form>
    </section>
  );
};


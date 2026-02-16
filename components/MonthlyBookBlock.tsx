"use client";

import { useState, useTransition } from "react";
import { setMonthlyBook, completeMonthlyBook, addMonthlyBook, setMonthlyBookReadingGoal } from "@/app/actions/learning";

type Book = {
  id: string;
  title: string;
  completed_at: string | null;
  pages_per_day?: number | null;
  chapters_per_week?: number | null;
};

type Props = {
  initial: { title: string; completed_at: string | null } | null;
  books?: Book[];
};

export function MonthlyBookBlock({ initial, books: initialBooks = [] }: Props) {
  const books = initialBooks.length > 0 ? initialBooks : (initial ? [{ id: "", title: initial.title, completed_at: initial.completed_at, pages_per_day: null, chapters_per_week: null }] : []);
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSetTitle(e: React.FormEvent, slot?: number) {
    e.preventDefault();
    const title = (slot === undefined ? newTitle : (e.target as HTMLFormElement).querySelector<HTMLInputElement>("input[name=title]")?.value)?.trim();
    if (!title) return;
    startTransition(async () => {
      if (slot === undefined) await setMonthlyBook(title);
      else await setMonthlyBook(title, slot);
      setNewTitle("");
    });
  }

  function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    startTransition(() => addMonthlyBook(newTitle.trim()));
    setNewTitle("");
  }

  function handleComplete(bookId?: string) {
    startTransition(() => completeMonthlyBook(bookId));
  }

  return (
    <section className="card-modern overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">This month&apos;s book{books.length > 1 ? "s" : ""}</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">1+ book per month. Optional: set pages/day or chapters/week.</p>
      </div>
      <div className="p-4 space-y-4">
        {books.length === 0 && (
          <form onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) handleSetTitle(e); }} className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Book title"
              className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
              Set
            </button>
          </form>
        )}
        {books.map((book) => (
          <MonthlyBookRow
            key={book.id || book.title}
            book={book}
            onComplete={() => handleComplete(book.id || undefined)}
            onSetReadingGoal={(pages, chapters) => {
              if (book.id) startTransition(() => setMonthlyBookReadingGoal(book.id, pages, chapters));
            }}
            pending={pending}
          />
        ))}
        {books.length > 0 && (
          <form onSubmit={handleAddBook} className="flex gap-2 border-t border-[var(--card-border)] pt-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add another book"
              className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <button type="submit" disabled={pending} className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-50">
              Add
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function MonthlyBookRow({
  book,
  onComplete,
  onSetReadingGoal,
  pending,
}: {
  book: Book;
  onComplete: () => void;
  onSetReadingGoal: (pages: number | null, chapters: number | null) => void;
  pending: boolean;
}) {
  const completed = !!book.completed_at;
  const [showGoal, setShowGoal] = useState(!!book.pages_per_day || !!book.chapters_per_week);
  const [pages, setPages] = useState(String(book.pages_per_day ?? ""));
  const [chapters, setChapters] = useState(String(book.chapters_per_week ?? ""));

  function saveGoal() {
    const p = pages ? parseInt(pages, 10) : null;
    const c = chapters ? parseFloat(chapters) : null;
    if (p != null && (isNaN(p) || p < 0)) return;
    if (c != null && (isNaN(c) || c < 0)) return;
    onSetReadingGoal(p ?? null, c ?? null);
  }

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2">
      <p className="text-sm font-medium text-[var(--text-primary)]">{book.title}</p>
      {(book.pages_per_day != null || book.chapters_per_week != null) && (
        <p className="text-xs text-[var(--text-muted)]">
          {book.pages_per_day != null && `${book.pages_per_day} pp/day`}
          {book.pages_per_day != null && book.chapters_per_week != null && " · "}
          {book.chapters_per_week != null && `${book.chapters_per_week} ch/week`}
        </p>
      )}
      {!showGoal && (
        <button type="button" onClick={() => setShowGoal(true)} className="mt-1 text-xs text-[var(--accent-focus)] hover:underline">
          Set reading goal (pages/day or chapters/week)
        </button>
      )}
      {showGoal && book.id && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Pages/day"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            onBlur={saveGoal}
            className="w-20 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
          />
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Ch/week"
            value={chapters}
            onChange={(e) => setChapters(e.target.value)}
            onBlur={saveGoal}
            className="w-20 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
          />
        </div>
      )}
      {completed ? (
        <p className="mt-1 text-xs text-green-500/80">✓ Completed this month</p>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          disabled={pending}
          className="mt-1 rounded-lg bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          Mark complete
        </button>
      )}
    </div>
  );
}

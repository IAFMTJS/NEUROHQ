"use client";

import { useState, useTransition } from "react";
import { setMonthlyBook, completeMonthlyBook, addMonthlyBook, setMonthlyBookReadingGoal, setMonthlyBookPagesRead } from "@/app/actions/learning";

type Book = {
  id: string;
  title: string;
  completed_at: string | null;
  pages_per_day?: number | null;
  chapters_per_week?: number | null;
  total_pages?: number | null;
  pages_read?: number | null;
  pages_updated_at?: string | null;
};

type Props = {
  initial: { title: string; completed_at: string | null } | null;
  books?: Book[];
};

export function MonthlyBookBlock({ initial, books: initialBooks = [] }: Props) {
  const books = initialBooks.length > 0 ? initialBooks : (initial ? [{ id: "", title: initial.title, completed_at: initial.completed_at, pages_per_day: null, chapters_per_week: null, total_pages: null, pages_read: null, pages_updated_at: null }] : []);
  const [newTitle, setNewTitle] = useState("");
  const [newTotalPages, setNewTotalPages] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSetTitle(e: React.FormEvent, slot?: number) {
    e.preventDefault();
    const title = (slot === undefined ? newTitle : (e.target as HTMLFormElement).querySelector<HTMLInputElement>("input[name=title]")?.value)?.trim();
    if (!title) return;
    const totalPages = slot === undefined ? (newTotalPages ? parseInt(newTotalPages, 10) : undefined) : undefined;
    const tp = totalPages != null && !isNaN(totalPages) && totalPages > 0 ? totalPages : undefined;
    startTransition(async () => {
      if (slot === undefined) await setMonthlyBook(title, 1, tp ?? null);
      else await setMonthlyBook(title, slot);
      setNewTitle("");
      setNewTotalPages("");
    });
  }

  function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const totalPages = newTotalPages ? parseInt(newTotalPages, 10) : undefined;
    const tp = totalPages != null && !isNaN(totalPages) && totalPages > 0 ? totalPages : null;
    startTransition(() => addMonthlyBook(newTitle.trim(), tp ?? undefined));
    setNewTitle("");
    setNewTotalPages("");
  }

  function handleComplete(bookId?: string) {
    startTransition(() => completeMonthlyBook(bookId));
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">This month&apos;s book{books.length > 1 ? "s" : ""}</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">1+ book per month. Vul aantal pagina&apos;s in voor check-ins. Optioneel: pagina&apos;s/dag of hoofdstukken/week.</p>
        {books.length === 0 && (
          <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">Kies een boek voor deze maand om voortgang en check-ins bij te houden.</p>
        )}
      </div>
      <div className="p-4 space-y-4">
        {books.length === 0 && (
          <form onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) handleSetTitle(e); }} className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Boektitel"
                className="flex-1 min-w-[160px] rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
              <input
                type="number"
                min="1"
                value={newTotalPages}
                onChange={(e) => setNewTotalPages(e.target.value)}
                placeholder="Pagina&apos;s (totaal)"
                className="w-28 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
              <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
                Kies boek
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Aantal pagina&apos;s is handig voor wekelijkse check-ins (hoeveel gelezen).</p>
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
            onSetPagesRead={(pages) => book.id && startTransition(() => setMonthlyBookPagesRead(book.id, pages))}
            pending={pending}
          />
        ))}
        {books.length > 0 && (
          <form onSubmit={handleAddBook} className="flex flex-wrap gap-2 border-t border-[var(--card-border)] pt-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Nog een boek toevoegen"
              className="flex-1 min-w-[140px] rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <input
              type="number"
              min="1"
              value={newTotalPages}
              onChange={(e) => setNewTotalPages(e.target.value)}
              placeholder="Pagina&apos;s"
              className="w-24 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
            <button type="submit" disabled={pending} className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-primary)] disabled:opacity-50">
              Toevoegen
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
  onSetPagesRead,
  pending,
}: {
  book: Book;
  onComplete: () => void;
  onSetReadingGoal: (pages: number | null, chapters: number | null) => void;
  onSetPagesRead: (pages: number) => void;
  pending: boolean;
}) {
  const completed = !!book.completed_at;
  const [showGoal, setShowGoal] = useState(!!book.pages_per_day || !!book.chapters_per_week);
  const [showPagesUpdate, setShowPagesUpdate] = useState(false);
  const [pages, setPages] = useState(String(book.pages_per_day ?? ""));
  const [chapters, setChapters] = useState(String(book.chapters_per_week ?? ""));
  const [pagesRead, setPagesRead] = useState(String(book.pages_read ?? ""));

  function saveGoal() {
    const p = pages ? parseInt(pages, 10) : null;
    const c = chapters ? parseFloat(chapters) : null;
    if (p != null && (isNaN(p) || p < 0)) return;
    if (c != null && (isNaN(c) || c < 0)) return;
    onSetReadingGoal(p ?? null, c ?? null);
  }

  function savePagesRead() {
    const n = pagesRead ? parseInt(pagesRead, 10) : 0;
    if (!isNaN(n) && n >= 0) onSetPagesRead(n);
    setShowPagesUpdate(false);
  }

  const totalPages = book.total_pages ?? 0;
  const read = book.pages_read ?? 0;
  const needsWeeklyUpdate = book.id && totalPages > 0 && !completed;
  const updatedAt = book.pages_updated_at ? new Date(book.pages_updated_at) : null;
  const daysSinceUpdate = updatedAt ? Math.floor((Date.now() - updatedAt.getTime()) / (24 * 60 * 60 * 1000)) : null;
  const showWeeklyReminder = needsWeeklyUpdate && (daysSinceUpdate === null || daysSinceUpdate >= 7);

  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2">
      <p className="text-sm font-medium text-[var(--text-primary)]">{book.title}</p>
      {totalPages > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          {totalPages} pagina&apos;s totaal
          {read > 0 && ` · ${read} gelezen`}
          {totalPages > 0 && read > 0 && ` (${Math.round((read / totalPages) * 100)}%)`}
        </p>
      )}
      {(book.pages_per_day != null || book.chapters_per_week != null) && (
        <p className="text-xs text-[var(--text-muted)]">
          {book.pages_per_day != null && `${book.pages_per_day} pp/dag`}
          {book.pages_per_day != null && book.chapters_per_week != null && " · "}
          {book.chapters_per_week != null && `${book.chapters_per_week} hfd/week`}
        </p>
      )}
      {!showGoal && book.id && (
        <button type="button" onClick={() => setShowGoal(true)} className="mt-1 text-xs text-[var(--accent-focus)] hover:underline">
          Leesdoel instellen (pagina&apos;s/dag of hoofdstukken/week)
        </button>
      )}
      {showGoal && book.id && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Pagina's/dag"
            value={pages}
            onChange={(e) => setPages(e.target.value)}
            onBlur={saveGoal}
            className="w-20 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
          />
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="Hfd/week"
            value={chapters}
            onChange={(e) => setChapters(e.target.value)}
            onBlur={saveGoal}
            className="w-20 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
          />
        </div>
      )}
      {needsWeeklyUpdate && (
        <div className="mt-2">
          {showWeeklyReminder && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Wekelijks: werk bij hoeveel pagina&apos;s je al gelezen hebt.</p>
          )}
          {!showPagesUpdate ? (
            <button
              type="button"
              onClick={() => setShowPagesUpdate(true)}
              className="text-xs font-medium text-[var(--accent-focus)] hover:underline"
            >
              Pagina&apos;s gelezen bijwerken
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min="0"
                max={totalPages || undefined}
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                placeholder="Gelezen"
                className="w-20 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-xs text-[var(--text-primary)]"
              />
              <span className="text-xs text-[var(--text-muted)]">/ {totalPages}</span>
              <button type="button" onClick={savePagesRead} disabled={pending} className="text-xs font-medium text-[var(--accent-focus)] hover:underline disabled:opacity-50">
                Opslaan
              </button>
              <button type="button" onClick={() => { setShowPagesUpdate(false); setPagesRead(String(book.pages_read ?? "")); }} className="text-xs text-[var(--text-muted)] hover:underline">
                Annuleren
              </button>
            </div>
          )}
        </div>
      )}
      {completed ? (
        <p className="mt-1 text-xs text-green-500/80">✓ Afgerond deze maand</p>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          disabled={pending}
          className="mt-1 rounded-lg bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
        >
          Afronden
        </button>
      )}
    </div>
  );
}

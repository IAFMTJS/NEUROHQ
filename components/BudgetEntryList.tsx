"use client";

import { useState, useTransition } from "react";
import { deleteBudgetEntry, freezePurchase, confirmFreeze, cancelFreeze, updateBudgetEntry } from "@/app/actions/budget";
import { formatCents } from "@/lib/utils/currency";
import { Modal } from "@/components/Modal";

type Entry = {
  id: string;
  amount_cents: number;
  date: string;
  category: string | null;
  note: string | null;
  is_planned: boolean;
  freeze_until: string | null;
  freeze_reminder_sent: boolean;
};

type Goal = { id: string; name: string; target_cents: number; current_cents: number; status?: string };

const ENTRY_PAGE_SIZE = 30;

const BUDGET_CATEGORY_PRESETS = ["Eten", "Vervoer", "Abonnementen", "Boodschappen", "Uit eten", "Gezondheid", "Overig"];

export function BudgetEntryList({
  entries,
  currency = "EUR",
  goals = [],
}: {
  entries: Entry[];
  currency?: string;
  goals?: Goal[];
}) {
  const [pending, startTransition] = useTransition();
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "category">("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expenses">("all");
  const [visibleCount, setVisibleCount] = useState(ENTRY_PAGE_SIZE);
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editNote, setEditNote] = useState("");

  function handleFreeze(id: string) {
    startTransition(() => freezePurchase(id));
  }
  function handleConfirm(id: string) {
    startTransition(() => confirmFreeze(id));
  }
  function handleCancel(id: string) {
    startTransition(() => cancelFreeze(id));
  }
  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(() => deleteBudgetEntry(id));
  }

  function openEdit(e: Entry) {
    setEditing(e);
    setEditAmount((Math.abs(e.amount_cents) / 100).toFixed(2));
    setEditDate(e.date);
    setEditCategory(e.category || "");
    setEditNote(e.note || "");
  }

  function handleSaveEdit() {
    if (!editing) return;
    const amountCents = Math.round(parseFloat(editAmount) * 100);
    if (isNaN(amountCents) || amountCents < 0) return;
    const sign = editing.amount_cents >= 0 ? 1 : -1;
    startTransition(async () => {
      await updateBudgetEntry(editing.id, {
        amount_cents: sign * amountCents,
        date: editDate,
        category: editCategory.trim() || null,
        note: editNote.trim() || null,
      });
      setEditing(null);
    });
  }

  const now = new Date().toISOString();
  const frozen = entries.filter((e) => e.freeze_until && e.freeze_until > now);
  const readyReminder = entries.filter((e) => e.freeze_until && e.freeze_until <= now && !e.freeze_reminder_sent);
  const baseRest = entries.filter((e) => !e.freeze_until || (e.freeze_until <= now && e.freeze_reminder_sent));
  const allCategoriesFromEntries = Array.from(
    new Set(baseRest.filter((e) => e.amount_cents < 0).map((e) => e.category || "Ongecategoriseerd"))
  ).sort();
  const allCategories = Array.from(new Set([...BUDGET_CATEGORY_PRESETS, ...allCategoriesFromEntries]));

  let rest = baseRest;
  if (categoryFilter) rest = rest.filter((e) => (e.category || "Ongecategoriseerd") === categoryFilter);
  if (dateFrom) rest = rest.filter((e) => e.date >= dateFrom);
  if (dateTo) rest = rest.filter((e) => e.date <= dateTo);
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    rest = rest.filter((e) =>
      (e.note && e.note.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q))
    );
  }
  if (typeFilter === "income") rest = rest.filter((e) => e.amount_cents > 0);
  if (typeFilter === "expenses") rest = rest.filter((e) => e.amount_cents < 0);
  rest = [...rest].sort((a, b) => {
    if (sortBy === "date") return b.date.localeCompare(a.date);
    if (sortBy === "amount") return Math.abs(b.amount_cents) - Math.abs(a.amount_cents);
    if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
    return 0;
  });

  const categoryTotals = allCategories.map((cat) => {
    const total = rest.filter((e) => e.amount_cents < 0 && (e.category || "Ongecategoriseerd") === cat).reduce((s, e) => s + Math.abs(e.amount_cents), 0);
    return { category: cat, totalCents: total };
  }).filter(({ totalCents }) => totalCents > 0);

  const visible = rest.slice(0, visibleCount);
  const hasMore = rest.length > visibleCount;
  const filtersActive = !!(categoryFilter || dateFrom || dateTo || searchQuery.trim() || typeFilter !== "all");

  return (
    <>
      <div className="space-y-4">
        {filtersActive && (
          <p className="text-xs text-[var(--text-muted)]">
            Filters actief: {rest.length} van {entries.length} boekingen zichtbaar. Leeg de filters om alles te zien.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search note or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none w-44"
            aria-label="Search entries by note or category"
          />
          <label className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Sort</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | "income" | "expenses")}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
              aria-label="Filter by type"
            >
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expenses">Expenses</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "amount" | "category")}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
              aria-label="Sort entries"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
              <option value="category">Category</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
            >
              <option value="">All</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
            />
          </label>
        </div>

        {categoryTotals.length > 0 && (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">This month by category (filtered)</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--text-primary)]">
              {categoryTotals.map(({ category, totalCents }) => (
                <li key={category}>{category}: {formatCents(-totalCents, currency)}</li>
              ))}
            </ul>
          </div>
        )}

        <ul className="space-y-2">
          {frozen.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2">
              <span className="text-sm text-[var(--text-primary)]">
                {formatCents(e.amount_cents, currency)} · {e.date}
                {e.note && ` · ${e.note}`}
              </span>
              <span className="text-xs text-amber-200">Frozen until {e.freeze_until ? new Date(e.freeze_until).toLocaleString() : ""}</span>
            </li>
          ))}
          {readyReminder.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded border border-neutral-700 bg-[var(--bg-surface)] px-3 py-2">
              <span className="text-sm text-[var(--text-primary)]">
                {formatCents(e.amount_cents, currency)} · {e.date}
                {e.note && ` · ${e.note}`}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleConfirm(e.id)} disabled={pending} className="text-xs text-green-400 hover:underline">Confirm</button>
                <button type="button" onClick={() => handleCancel(e.id)} disabled={pending} className="text-xs text-red-400 hover:underline">Cancel</button>
              </div>
            </li>
          ))}
          {visible.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded border border-neutral-700 bg-[var(--bg-surface)] px-3 py-2">
              <span className="text-sm text-[var(--text-primary)]">
                {formatCents(e.amount_cents, currency)} · {e.date}
                {e.category && ` · ${e.category}`}
                {e.note && ` · ${e.note}`}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(e)} disabled={pending} className="text-xs text-[var(--accent-focus)] hover:underline">Edit</button>
                {e.amount_cents < 0 && !e.freeze_until && (
                  <button type="button" onClick={() => handleFreeze(e.id)} disabled={pending} className="text-xs text-[var(--accent-focus)] hover:underline">Freeze 24h</button>
                )}
                <button type="button" onClick={() => handleDelete(e.id)} disabled={pending} className="text-xs text-neutral-500 hover:text-red-400">Delete</button>
              </div>
            </li>
          ))}
        </ul>
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + ENTRY_PAGE_SIZE)}
            className="text-sm text-[var(--accent-focus)] hover:underline"
          >
            Load more ({rest.length - visibleCount} left)
          </button>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit entry" showBranding>
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">Category</label>
              <input
                type="text"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="e.g. Food"
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)]">Note</label>
              <input
                type="text"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveEdit} disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

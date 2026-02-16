"use client";

import { useState, useTransition } from "react";
import { createRecurringTemplate, deleteRecurringTemplate } from "@/app/actions/budget";
import { formatCents } from "@/lib/utils/currency";
import { Modal } from "@/components/Modal";

type Template = {
  id: string;
  amount_cents: number;
  category: string | null;
  note: string | null;
  recurrence_rule: string;
  next_generate_date: string;
};

export function RecurringBudgetCard({
  templates,
  currency = "EUR",
}: {
  templates: Template[];
  currency?: string;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [rule, setRule] = useState<"weekly" | "monthly">("monthly");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [nextDate, setNextDate] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents === 0) {
      setError("Enter a valid amount.");
      return;
    }
    const next = nextDate || new Date().toISOString().slice(0, 10);
    const dayM = rule === "monthly" ? parseInt(dayOfMonth, 10) : null;
    const dayW = rule === "weekly" ? parseInt(dayOfWeek, 10) : null;
    if (rule === "monthly" && (dayM == null || dayM < 1 || dayM > 31)) {
      setError("Day of month must be 1–31.");
      return;
    }
    if (rule === "weekly" && (dayW == null || dayW < 0 || dayW > 6)) {
      setError("Day of week must be 0 (Sun)–6 (Sat).");
      return;
    }
    startTransition(async () => {
      try {
        await createRecurringTemplate({
          amount_cents: amountCents,
          category: category.trim() || null,
          note: note.trim() || null,
          recurrence_rule: rule,
          day_of_month: dayM ?? undefined,
          day_of_week: dayW ?? undefined,
          next_generate_date: next,
        });
        setShowAdd(false);
        setAmount("");
        setCategory("");
        setNote("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add.");
      }
    });
  }

  if (templates.length === 0 && !showAdd) {
    return (
      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Recurring</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Rent, salary, subscriptions — auto-create entries.</p>
        </div>
        <div className="p-4">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium text-[var(--accent-focus)] hover:underline"
          >
            + Add recurring template
          </button>
        </div>
        <AddModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAdd} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} note={note} setNote={setNote} rule={rule} setRule={setRule} dayOfMonth={dayOfMonth} setDayOfMonth={setDayOfMonth} dayOfWeek={dayOfWeek} setDayOfWeek={setDayOfWeek} nextDate={nextDate} setNextDate={setNextDate} pending={pending} error={error} />
      </section>
    );
  }

  return (
    <section className="card-modern overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Recurring</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Auto-create entries on schedule.</p>
      </div>
      <div className="p-4 space-y-2">
        {templates.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-3 py-2 text-sm">
            <span className="text-[var(--text-primary)]">
              {formatCents(t.amount_cents, currency)} · {t.recurrence_rule} · next {t.next_generate_date}
              {t.category && ` · ${t.category}`}
            </span>
            <button
              type="button"
              onClick={() => startTransition(() => deleteRecurringTemplate(t.id))}
              disabled={pending}
              className="text-xs text-neutral-500 hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        <button type="button" onClick={() => setShowAdd(true)} className="text-sm font-medium text-[var(--accent-focus)] hover:underline">
          + Add recurring
        </button>
      </div>
      <AddModal open={showAdd} onClose={() => setShowAdd(false)} onSubmit={handleAdd} amount={amount} setAmount={setAmount} category={category} setCategory={setCategory} note={note} setNote={setNote} rule={rule} setRule={setRule} dayOfMonth={dayOfMonth} setDayOfMonth={setDayOfMonth} dayOfWeek={dayOfWeek} setDayOfWeek={setDayOfWeek} nextDate={nextDate} setNextDate={setNextDate} pending={pending} error={error} />
    </section>
  );
}

function AddModal({
  open,
  onClose,
  onSubmit,
  amount,
  setAmount,
  category,
  setCategory,
  note,
  setNote,
  rule,
  setRule,
  dayOfMonth,
  setDayOfMonth,
  dayOfWeek,
  setDayOfWeek,
  nextDate,
  setNextDate,
  pending,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  amount: string;
  setAmount: (s: string) => void;
  category: string;
  setCategory: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  rule: "weekly" | "monthly";
  setRule: (r: "weekly" | "monthly") => void;
  dayOfMonth: string;
  setDayOfMonth: (s: string) => void;
  dayOfWeek: string;
  setDayOfWeek: (s: string) => void;
  nextDate: string;
  setNextDate: (s: string) => void;
  pending: boolean;
  error: string | null;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Add recurring" showBranding>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Amount</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Category</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Note</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Frequency</label>
          <select value={rule} onChange={(e) => setRule(e.target.value as "weekly" | "monthly")} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none">
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
        {rule === "monthly" && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Day of month (1–31)</label>
            <input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none" />
          </div>
        )}
        {rule === "weekly" && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)]">Day of week (0=Sun … 6=Sat)</label>
            <input type="number" min="0" max="6" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)]">Next run date</label>
          <input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none" />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">Add</button>
          <button type="button" onClick={onClose} className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--card-border)]/50">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

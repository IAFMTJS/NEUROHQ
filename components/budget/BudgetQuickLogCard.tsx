"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBudgetEntry } from "@/app/actions/budget";
import { deductXP } from "@/app/actions/xp";
import { getCurrencySymbol } from "@/lib/utils/currency";

type Props = {
  date: string;
  currency?: string;
};

type Tag = "planned" | "impulse" | "necessary";

const TAG_OPTIONS: { value: Tag; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "impulse", label: "Impulse" },
  { value: "necessary", label: "Necessary" },
];

const CATEGORY_PRESETS = ["Eten", "Vervoer", "Abonnementen", "Boodschappen", "Uit eten", "Gezondheid", "Overig"];

export function BudgetQuickLogCard({ date, currency = "EUR" }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState<Tag>("planned");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  const symbol = getCurrencySymbol(currency);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.round(parseFloat(amount || "0") * 100);
    if (!value || value <= 0) return;
    const isImpulse = tag === "impulse";
    const isPlanned = tag === "planned";
    startTransition(async () => {
      try {
        await addBudgetEntry({
          amount_cents: -value,
          date,
          category: category.trim() || undefined,
          note: note.trim() || (isImpulse ? "Impulse" : undefined),
          is_planned: isPlanned,
        });
        if (isImpulse) {
          // Light discipline penalty for impulse spending.
          await deductXP(3);
        }
        setAmount("");
        setNote("");
        router.refresh();
        if (!CATEGORY_PRESETS.includes(category) && category) {
          // keep category selected, user might log series
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Quick Log</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Fast single-line capture for today&apos;s spend, with a simple tag for behavior.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Amount
            </label>
            <div className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5">
              <span className="text-xs text-[var(--text-muted)]">{symbol}</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <input
              list="budget-quicklog-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
              placeholder="E.g. Eten"
            />
            <datalist id="budget-quicklog-categories">
              {CATEGORY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Tag
          </label>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTag(t.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tag === t.value
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]"
                    : "border-[var(--card-border)] bg-[var(--bg-surface)]/60 text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Note (optional)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            placeholder="Short context for future you"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !amount}
            className="btn-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "Logging…" : "Log Expense"}
          </button>
        </div>
      </form>
    </section>
  );
}


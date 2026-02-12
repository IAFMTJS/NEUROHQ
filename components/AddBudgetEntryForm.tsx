"use client";

import { useState, useTransition } from "react";
import { addBudgetEntry, checkImpulseSignal, freezePurchase, updateBudgetEntry } from "@/app/actions/budget";
import { Modal } from "@/components/Modal";

export function AddBudgetEntryForm({ date }: { date: string }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [pending, startTransition] = useTransition();
  const [impulseModal, setImpulseModal] = useState<{ entryId: string; amountCents: number } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents === 0) return;
    const amount_cents = isExpense ? -cents : cents;
    startTransition(async () => {
      const result = await addBudgetEntry({ amount_cents, date, category: category || undefined, note: note || undefined });
      setAmount("");
      setNote("");
      if (result?.id && isExpense && amount_cents < 0) {
        const { isPossibleImpulse } = await checkImpulseSignal(amount_cents);
        if (isPossibleImpulse) setImpulseModal({ entryId: result.id, amountCents: amount_cents });
      }
    });
  }

  function handleImpulseChoice(action: "freeze" | "planned" | "skip") {
    if (!impulseModal) return;
    startTransition(async () => {
      if (action === "freeze") await freezePurchase(impulseModal.entryId);
      if (action === "planned") await updateBudgetEntry(impulseModal.entryId, { is_planned: true });
      setImpulseModal(null);
    });
  }

  return (
    <>
      <Modal
        open={!!impulseModal}
        onClose={() => impulseModal && handleImpulseChoice("skip")}
        title="Unplanned expense?"
        showBranding
      >
        <p className="text-sm leading-relaxed text-neutral-400">
          This looks like an unplanned purchase. Add it to a 24h freeze and decide tomorrow, or mark it as planned.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => handleImpulseChoice("freeze")}
            disabled={pending}
            className="btn-primary order-1 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Freeze 24h
          </button>
          <button
            type="button"
            onClick={() => handleImpulseChoice("planned")}
            disabled={pending}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-neuro-silver transition hover:bg-white/10"
          >
            It&apos;s planned
          </button>
          <button
            type="button"
            onClick={() => handleImpulseChoice("skip")}
            disabled={pending}
            className="rounded-xl px-4 py-2.5 text-sm text-neutral-500 transition hover:text-neuro-silver"
          >
            Skip
          </button>
        </div>
      </Modal>
    <form onSubmit={handleSubmit} className="card-modern flex flex-wrap items-end gap-2 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Amount</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-24 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
          required
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isExpense} onChange={(e) => setIsExpense(e.target.checked)} />
        <span className="text-sm text-neutral-400">Expense</span>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Category</span>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. food"
          className="w-28 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs text-neutral-400">Note</span>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional"
          className="w-40 rounded border border-neutral-600 bg-neuro-dark px-2 py-1.5 text-sm text-white"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-primary rounded-xl px-4 py-2 text-sm">
        Add
      </button>
    </form>
    </>
  );
}

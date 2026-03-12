"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { addBudgetEntry, checkImpulseSignal, freezePurchase, updateBudgetEntry } from "@/app/actions/budget";
import { Modal } from "@/components/Modal";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { getPendingBudgetSnapshot, setPendingBudgetSnapshot } from "@/lib/client-pending-budget";

const CATEGORY_PRESETS = ["Eten", "Vervoer", "Abonnementen", "Boodschappen", "Uit eten", "Gezondheid", "Overig"];

const STORE_OPTIONS = ["Albert Heijn", "Jumbo", "Lidl", "Aldi", "Plus", "Dirk", "Overig"];

const EATEN_OPTIONS = ["Thuis", "Delivery", "Kantine", "Meal prep", "Overig"];
const TRANSPORT_OPTIONS = ["NS", "OV-chip", "Uber / taxi", "Tankstation", "Fiets/onderhoud", "Overig"];
const HEALTH_OPTIONS = ["Apotheek", "Huisarts", "Tandarts", "Ziekenhuis", "Overig"];

const QUICK_ADD_AMOUNTS = [5, 10, 20, 50];

export function AddBudgetEntryForm({
  date: initialDate,
  currency = "EUR",
  onSuccess,
}: {
  date: string;
  currency?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const formOpenedAt = useRef(Date.now());
  const [date, setDate] = useState(initialDate);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [note, setNote] = useState("");
  const [storeName, setStoreName] = useState("");
  const [subscriptionName, setSubscriptionName] = useState("");
  const [detailName, setDetailName] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [pending, startTransition] = useTransition();
  const [impulseModal, setImpulseModal] = useState<{ entryId: string; amountCents: number } | null>(null);

  const resolvedCategory = category === "Other" ? categoryOther.trim() : category;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents === 0) return;
    const amount_cents = isExpense ? -cents : cents;
    const addedWithinMinutes = Math.floor((Date.now() - formOpenedAt.current) / 60000);
    const detailForCategory =
      category === "Eten" || category === "Vervoer" || category === "Uit eten" || category === "Gezondheid" || category === "Overig"
        ? (detailName || null)
        : null;
    startTransition(async () => {
      const result = await addBudgetEntry({
        amount_cents,
        date,
        category: resolvedCategory || undefined,
        note: note || undefined,
        store_name: category === "Boodschappen" && storeName ? storeName : null,
        subscription_name: category === "Abonnementen" && subscriptionName ? subscriptionName : null,
        detail_name: detailForCategory,
      });
      // Local-first: adjust pending budget snapshot so Dashboard/Budget badges update immediately.
      try {
        const snapshot = getPendingBudgetSnapshot();
        if (snapshot && typeof snapshot.budgetRemainingCents === "number" && Number.isFinite(snapshot.budgetRemainingCents)) {
          setPendingBudgetSnapshot({
            budgetRemainingCents: snapshot.budgetRemainingCents + amount_cents,
          });
        }
      } catch {
        // ignore local snapshot errors
      }
      setAmount("");
      setNote("");
      setStoreName("");
      setSubscriptionName("");
      setDetailName("");
      router.refresh();
      if (result?.id && isExpense && amount_cents < 0) {
        const { isPossibleImpulse } = await checkImpulseSignal(amount_cents, {
          category: resolvedCategory || undefined,
          addedWithinMinutes,
        });
        if (isPossibleImpulse) setImpulseModal({ entryId: result.id, amountCents: amount_cents });
        else onSuccess?.();
      } else {
        onSuccess?.();
      }
    });
  }

  function handleImpulseChoice(action: "freeze" | "planned" | "skip") {
    if (!impulseModal) return;
    startTransition(async () => {
      if (action === "freeze") await freezePurchase(impulseModal.entryId);
      if (action === "planned") await updateBudgetEntry(impulseModal.entryId, { is_planned: true });
      setImpulseModal(null);
      onSuccess?.();
    });
  }

  const symbol = getCurrencySymbol(currency);

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
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white/10"
          >
            It&apos;s planned
          </button>
          <button
            type="button"
            onClick={() => handleImpulseChoice("skip")}
            disabled={pending}
            className="rounded-xl px-4 py-2.5 text-sm text-neutral-500 transition hover:text-[var(--text-primary)]"
          >
            Skip
          </button>
        </div>
      </Modal>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-36 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Amount ({symbol})</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              required
            />
            <span className="text-xs text-[var(--text-muted)]">Quick:</span>
            {QUICK_ADD_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(String(a))}
                className="rounded-lg border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--card-border)]/50"
              >
                {symbol}{a}
              </button>
            ))}
          </div>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isExpense} onChange={(e) => setIsExpense(e.target.checked)} className="rounded border-[var(--card-border)] text-[var(--accent-focus)] focus:ring-[var(--accent-focus)]" />
          <span className="text-sm text-[var(--text-muted)]">Expense</span>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Category</span>
          <select
            value={category || ""}
            onChange={(e) => setCategory(e.target.value)}
            className="w-36 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          >
            <option value="">—</option>
            {CATEGORY_PRESETS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {category === "Overig" && (
            <input
              type="text"
              value={categoryOther}
              onChange={(e) => setCategoryOther(e.target.value)}
              placeholder="Category name"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
          )}
          {category === "Boodschappen" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Supermarkt</span>
              <select
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              >
                <option value="">— Kies (optioneel)</option>
                {STORE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
          {category === "Abonnementen" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Welk abonnement?</span>
              <input
                type="text"
                value={subscriptionName}
                onChange={(e) => setSubscriptionName(e.target.value)}
                placeholder="Bijv. Netflix, Spotify"
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </div>
          )}
          {category === "Eten" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Waar/type</span>
              <select
                value={detailName || ""}
                onChange={(e) => setDetailName(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              >
                <option value="">— Kies (optioneel)</option>
                {EATEN_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
          {category === "Vervoer" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Vervoerder/type</span>
              <select
                value={detailName || ""}
                onChange={(e) => setDetailName(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              >
                <option value="">— Kies (optioneel)</option>
                {TRANSPORT_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
          {category === "Uit eten" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Restaurant/plek</span>
              <input
                type="text"
                value={detailName}
                onChange={(e) => setDetailName(e.target.value)}
                placeholder="Bijv. restaurantnaam, café"
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </div>
          )}
          {category === "Gezondheid" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Waar/type</span>
              <select
                value={detailName || ""}
                onChange={(e) => setDetailName(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              >
                <option value="">— Kies (optioneel)</option>
                {HEALTH_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
          {category === "Overig" && (
            <div className="mt-1">
              <span className="text-xs text-[var(--text-muted)]">Detail (optioneel)</span>
              <input
                type="text"
                value={detailName}
                onChange={(e) => setDetailName(e.target.value)}
                placeholder="Bijv. wat of waar"
                className="mt-0.5 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </div>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Note</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            className="w-44 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          />
        </label>
        <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
          Add
        </button>
      </form>
    </>
  );
}

"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { addBudgetEntry, checkImpulseSignal, freezePurchase, updateBudgetEntry } from "@/app/actions/budget";
import { Modal } from "@/components/Modal";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { getPendingBudgetSnapshot, setPendingBudgetSnapshot } from "@/lib/client-pending-budget";
import { useBudgetLock } from "@/components/budget/BudgetLockContext";
import { toastForBudgetEntryError } from "@/lib/ui/budget-guardrail-toasts";

const CATEGORY_PRESETS = ["Eten", "Vervoer", "Abonnementen", "Boodschappen", "Uit eten", "Gezondheid", "Overig"];
type QuickTag = "planned" | "impulse" | "necessary";
const QUICK_TAG_OPTIONS: { value: QuickTag; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "impulse", label: "Impulse" },
  { value: "necessary", label: "Necessary" },
];

const STORE_OPTIONS = ["Albert Heijn", "Jumbo", "Lidl", "Aldi", "Plus", "Dirk", "Overig"];

const EATEN_OPTIONS = ["Thuis", "Delivery", "Kantine", "Meal prep", "Overig"];
const TRANSPORT_OPTIONS = ["NS", "OV-chip", "Uber / taxi", "Tankstation", "Fiets/onderhoud", "Overig"];
const HEALTH_OPTIONS = ["Apotheek", "Huisarts", "Tandarts", "Ziekenhuis", "Overig"];

const QUICK_ADD_AMOUNTS = [5, 10, 20, 50];
const TRANSIENT_SERVER_ACTION_ERROR = "An unexpected response was received from the server.";

function isTransientServerActionError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(TRANSIENT_SERVER_ACTION_ERROR);
}

async function withServerActionRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isTransientServerActionError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return fn();
  }
}

export function AddBudgetEntryForm({
  date: initialDate,
  currency = "EUR",
  onSuccess,
  readOnly = false,
  mode = "full",
}: {
  date: string;
  currency?: string;
  onSuccess?: () => void;
  readOnly?: boolean;
  mode?: "full" | "quick";
}) {
  const router = useRouter();
  const { lockActive: budgetLockActive } = useBudgetLock();
  const effectiveReadOnly = readOnly || budgetLockActive;
  const formOpenedAt = useRef(Date.now());
  const [date, setDate] = useState(initialDate);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOther, setCategoryOther] = useState("");
  const [note, setNote] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [storeName, setStoreName] = useState("");
  const [subscriptionName, setSubscriptionName] = useState("");
  const [detailName, setDetailName] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [quickTag, setQuickTag] = useState<QuickTag>("planned");
  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [impulseModal, setImpulseModal] = useState<{ entryId: string; amountCents: number; risk: "low" | "medium" | "high"; pauseSeconds: number } | null>(null);
  const [rationale, setRationale] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!impulseModal || impulseModal.pauseSeconds <= 0) {
      setCooldown(0);
      return;
    }
    setCooldown(impulseModal.pauseSeconds);
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [impulseModal]);


  const resolvedCategory = category === "Other" ? categoryOther.trim() : category;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (effectiveReadOnly) return;
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents === 0) return;
    const quickMode = mode === "quick";
    const effectiveIsExpense = quickMode ? true : isExpense;
    const amount_cents = effectiveIsExpense ? -cents : cents;
    const addedWithinMinutes = Math.floor((Date.now() - formOpenedAt.current) / 60000);
    const isPlanned = quickMode ? quickTag !== "impulse" : undefined;
    const effectiveNote =
      quickMode && quickTag === "impulse" && !note.trim() ? "Impulse" : note || undefined;
    const detailForCategory =
      category === "Eten" || category === "Vervoer" || category === "Uit eten" || category === "Gezondheid" || category === "Overig"
        ? (detailName || null)
        : null;
    startTransition(async () => {
      try {
        setSubmitError(null);
        const result = await withServerActionRetry(() =>
          addBudgetEntry({
            amount_cents,
            date,
            category: resolvedCategory || undefined,
            note: effectiveNote,
            is_planned: isPlanned,
            store_name: category === "Boodschappen" && storeName ? storeName : null,
            subscription_name: category === "Abonnementen" && subscriptionName ? subscriptionName : null,
            detail_name: detailForCategory,
            emergency_override_reason: emergencyReason || null,
          })
        );
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
        setEmergencyReason("");
        router.refresh();
        if (result?.id && isExpense && amount_cents < 0) {
          const { isPossibleImpulse, weeklyAvgCents } = await withServerActionRetry(() =>
            checkImpulseSignal(amount_cents, {
              category: resolvedCategory || undefined,
              addedWithinMinutes,
            })
          );
          if (isPossibleImpulse) {
            const magnitude = Math.abs(amount_cents);
            const ratio = weeklyAvgCents > 0 ? magnitude / weeklyAvgCents : 1;
            const risk: "low" | "medium" | "high" =
              ratio >= 2 ? "high" : ratio >= 1.25 ? "medium" : "low";
            const pauseSeconds = risk === "high" ? 20 : risk === "medium" ? 10 : 0;
            setRationale("");
            setImpulseModal({ entryId: result.id, amountCents: amount_cents, risk, pauseSeconds });
          }
          else onSuccess?.();
        } else {
          onSuccess?.();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Something went wrong while saving.";
        setSubmitError(message);
        toastForBudgetEntryError(message);
      }
    });
  }

  function handleImpulseChoice(action: "freeze" | "planned" | "skip") {
    if (!impulseModal) return;
    if (impulseModal.risk === "high" && action !== "freeze" && rationale.trim().length < 8) {
      return;
    }
    startTransition(async () => {
      try {
        setSubmitError(null);
        if (action === "freeze") await withServerActionRetry(() => freezePurchase(impulseModal.entryId));
        if (action === "planned") {
          await withServerActionRetry(() => updateBudgetEntry(impulseModal.entryId, { is_planned: true }));
        }
        setImpulseModal(null);
        setRationale("");
        onSuccess?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not update this entry.";
        setSubmitError(message);
      }
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
          Dit lijkt op een ongeplande aankoop. Risico:{" "}
          <span className="font-semibold text-[var(--text-primary)]">{impulseModal?.risk ?? "low"}</span>.
          {impulseModal?.pauseSeconds
            ? ` Neem ${impulseModal.pauseSeconds} seconden pauze voordat je beslist.`
            : " Kies bewust: freeze, planned, of overslaan."}
        </p>
        {impulseModal?.risk === "high" && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Korte rationale (verplicht als je niet freezet)
            </label>
            <input
              type="text"
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Waarom is deze uitgave nu nodig?"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
            />
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => handleImpulseChoice("freeze")}
            disabled={pending || cooldown > 0}
            className="btn-primary order-1 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            {cooldown > 0 ? `Wacht ${cooldown}s` : "Freeze 24h"}
          </button>
          <button
            type="button"
            onClick={() => handleImpulseChoice("planned")}
            disabled={pending || cooldown > 0 || (impulseModal?.risk === "high" && rationale.trim().length < 8)}
            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white/10"
          >
            It&apos;s planned
          </button>
          <button
            type="button"
            onClick={() => handleImpulseChoice("skip")}
            disabled={pending || cooldown > 0 || (impulseModal?.risk === "high" && rationale.trim().length < 8)}
            className="rounded-xl px-4 py-2.5 text-sm text-neutral-500 transition hover:text-[var(--text-primary)]"
          >
            Skip
          </button>
        </div>
      </Modal>
      {mode === "quick" ? (
        <form id="budget-quick-log" onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-4">
          <fieldset disabled={effectiveReadOnly} className="space-y-3 disabled:opacity-70">
            <div className="flex flex-wrap gap-3">
              <label className="flex-1 min-w-[120px]">
                <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Amount</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="0,00"
                />
              </label>
              <label className="flex-1 min-w-[140px]">
                <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Category</span>
                <input
                  list="budget-quicklog-categories-shared"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="E.g. Eten"
                />
                <datalist id="budget-quicklog-categories-shared">
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
            </div>
            <div>
              <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Tag</span>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAG_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setQuickTag(t.value)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      quickTag === t.value
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--text-primary)]"
                        : "border-[var(--card-border)] bg-[var(--bg-surface)]/60 text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <label>
              <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Note (optional)</span>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                placeholder="Short context for future you"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Emergency reason (if lock active)</span>
              <input
                type="text"
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                placeholder="Waarom is dit nu noodzakelijk?"
              />
            </label>
          </fieldset>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending || !amount || effectiveReadOnly}
              className="btn-primary inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "Logging..." : "Log Expense"}
            </button>
          </div>
          {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
          {effectiveReadOnly && (
            <p className="text-xs text-[var(--text-muted)]">
              {budgetLockActive
                ? "No-spend lock: gebruik het noodpad onderaan de Budget-pagina."
                : "History mode: adding entries is disabled."}
            </p>
          )}
        </form>
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <fieldset disabled={effectiveReadOnly} className="contents disabled:opacity-70">
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
          <input type="checkbox" checked={isExpense} onChange={(e) => setIsExpense(e.target.checked)} disabled={effectiveReadOnly} className="rounded border-[var(--card-border)] text-[var(--accent-focus)] focus:ring-[var(--accent-focus)] disabled:opacity-50" />
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
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--text-muted)]">Emergency reason (if lock active)</span>
          <input
            type="text"
            value={emergencyReason}
            onChange={(e) => setEmergencyReason(e.target.value)}
            placeholder="Waarom is dit noodzakelijk?"
            className="w-56 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
          />
        </label>
        <button type="submit" disabled={pending || effectiveReadOnly} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
          Add
        </button>
        </fieldset>
        {submitError && <p className="text-xs text-rose-300">{submitError}</p>}
        {effectiveReadOnly && (
          <p className="text-xs text-[var(--text-muted)]">
            {budgetLockActive
              ? "No-spend lock: gebruik het noodpad onderaan de Budget-pagina."
              : "History mode: adding entries is disabled."}
          </p>
        )}
      </form>
      )}
    </>
  );
}

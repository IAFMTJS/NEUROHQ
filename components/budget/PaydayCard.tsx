"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBudgetSettings, setPaydayReceivedToday } from "@/app/actions/budget";
import { addIncomeSource, deleteIncomeSource } from "@/app/actions/dcic/income-sources";
import type { IncomeSource } from "@/lib/dcic/types";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { undoPaydayReceived } from "@/app/actions/budget";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getBudgetToday } from "@/lib/utils/budget-date";
import {
  clearPendingBudgetSnapshot,
  derivePendingPayday,
  getPrimaryPaydayDay,
  markPendingBudgetSynced,
  setPendingBudgetSnapshot,
  type PendingBudgetIncomeSource,
  usePendingBudgetSnapshot,
} from "@/lib/client-pending-budget";
import {
  derivePaydayDisplay,
  setPersistedPayday,
  usePersistedPayday,
} from "@/lib/client-persisted-payday";
import { useSettings } from "@/lib/settings-context";
import { useUndoStore } from "@/lib/undo-registry";

const UNDO_TOAST_DURATION_MS = 25_000;

type Props = {
  daysUntilNextIncome: number;
  nextPaydayLabel: string;
  incomeSources: IncomeSource[];
  paydayDayOfMonth: number | null;
  currency?: string;
  /** Current period: van [cycleStartDate] tot [nextPaydayDate]. Voor "Vandaag loon gehad" + periodelabel. */
  cycleStartDate?: string | null;
  nextPaydayDate?: string | null;
};

export function PaydayCard({ daysUntilNextIncome, nextPaydayLabel, incomeSources, paydayDayOfMonth, currency = "EUR", cycleStartDate, nextPaydayDate }: Props) {
  const router = useRouter();
  const { invalidate: invalidateSettings } = useSettings();
  const pushPaydayUndo = useUndoStore((s) => s.pushPaydayUndo);
  const removeUndo = useUndoStore((s) => s.remove);
  const persistedPayday = usePersistedPayday();
  const pendingBudget = usePendingBudgetSnapshot();
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const serverPaydayDay = paydayDayOfMonth ?? 25;
  const [paydayDay, setPaydayDay] = useState(String(persistedPayday?.paydayDayOfMonth ?? serverPaydayDay));
  const [newName, setNewName] = useState("Salaris");
  const [newAmount, setNewAmount] = useState("");
  const [newDay, setNewDay] = useState("25");
  const effectiveIncomeSources = useMemo<PendingBudgetIncomeSource[]>(
    () =>
      pendingBudget?.incomeSources ??
      incomeSources.map((source) => ({
        id: source.id,
        name: source.name,
        amount: source.amount,
        dayOfMonth: source.dayOfMonth,
        type: source.type,
      })),
    [incomeSources, pendingBudget?.incomeSources]
  );
  const effectivePaydayDay = getPrimaryPaydayDay(
    effectiveIncomeSources,
    persistedPayday?.paydayDayOfMonth ?? pendingBudget?.paydayDayOfMonth ?? paydayDayOfMonth
  );
  const effectiveLastPaydayDate = persistedPayday?.lastPaydayDate ?? pendingBudget?.lastPaydayDate ?? null;
  const displayFromPersisted = (persistedPayday?.lastPaydayDate != null || persistedPayday?.paydayDayOfMonth != null) || (pendingBudget?.lastPaydayDate != null || pendingBudget?.paydayDayOfMonth != null);
  const derived = useMemo(() => derivePaydayDisplay(effectiveLastPaydayDate, effectivePaydayDay), [effectiveLastPaydayDate, effectivePaydayDay]);
  const effectiveDaysUntilNextIncome = displayFromPersisted ? derived.daysUntilNextIncome : (pendingBudget?.daysUntilNextIncome ?? daysUntilNextIncome);
  const effectiveCycleStartDate = displayFromPersisted ? derived.cycleStartDate : (pendingBudget?.cycleStartDate ?? cycleStartDate);
  const effectiveNextPaydayDate = displayFromPersisted ? derived.nextPaydayDate : (pendingBudget?.nextPaydayDate ?? nextPaydayDate ?? null);
  const effectiveNextPaydayLabel =
    effectiveNextPaydayDate != null
      ? `Volgende loondag: ${format(new Date(effectiveNextPaydayDate + "T12:00:00Z"), "d MMMM", { locale: nl })}`
      : nextPaydayLabel;
  const symbol = getCurrencySymbol(pendingBudget?.currency ?? currency);
  const hasSyncedPersistedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedPersistedRef.current || !persistedPayday) return;
    const { lastPaydayDate, paydayDayOfMonth } = persistedPayday;
    if (lastPaydayDate == null && paydayDayOfMonth == null) return;
    hasSyncedPersistedRef.current = true;
    (async () => {
      try {
        await updateBudgetSettings({
          ...(lastPaydayDate != null && { last_payday_date: lastPaydayDate }),
          ...(paydayDayOfMonth != null && { payday_day_of_month: paydayDayOfMonth }),
        });
        router.refresh();
        await invalidateSettings();
      } catch {
        hasSyncedPersistedRef.current = false;
      }
    })();
  }, [persistedPayday, router, invalidateSettings]);

  function handleVandaagLoonGehad() {
    setSaveError(null);
    const previousLastPaydayDate = effectiveLastPaydayDate;
    const today = getBudgetToday();
    setPersistedPayday({ lastPaydayDate: today, paydayDayOfMonth: effectivePaydayDay });
    setPendingBudgetSnapshot({
      paydayDayOfMonth: effectivePaydayDay,
      lastPaydayDate: today,
      incomeSources: effectiveIncomeSources,
      ...derivePendingPayday(effectivePaydayDay, today),
    });
    setShowModal(false);
    startTransition(async () => {
      try {
        await setPaydayReceivedToday();
        markPendingBudgetSynced();
        const undoId = pushPaydayUndo(previousLastPaydayDate);
        toast.success("Loon gehad geregistreerd.", {
          duration: UNDO_TOAST_DURATION_MS,
          action: {
            label: "Ongedaan maken",
            onClick: () => {
              removeUndo(undoId);
              startTransition(async () => {
                try {
                  await undoPaydayReceived(previousLastPaydayDate);
                  setPersistedPayday({
                    lastPaydayDate: previousLastPaydayDate,
                    paydayDayOfMonth: effectivePaydayDay,
                  });
                  router.refresh();
                  await invalidateSettings();
                  clearPendingBudgetSnapshot();
                } catch {
                  toast.error("Ongedaan maken mislukt.");
                }
              });
            },
          },
        });
        router.refresh();
        await invalidateSettings();
        window.setTimeout(() => clearPendingBudgetSnapshot(), 1500);
      } catch (e) {
        console.error(e);
        setSaveError(e instanceof Error ? e.message : "Kon niet opslaan. Probeer opnieuw.");
      }
    });
  }

  function handleSavePaydayDay() {
    const d = parseInt(paydayDay, 10);
    if (isNaN(d) || d < 1 || d > 31) return;
    setSaveError(null);
    setPersistedPayday({ paydayDayOfMonth: d });
    setPendingBudgetSnapshot({
      paydayDayOfMonth: d,
      incomeSources: effectiveIncomeSources,
      ...derivePendingPayday(d, persistedPayday?.lastPaydayDate ?? pendingBudget?.lastPaydayDate),
    });
    setShowModal(false);
    startTransition(async () => {
      try {
        await updateBudgetSettings({ payday_day_of_month: d });
        markPendingBudgetSynced();
        router.refresh();
        await invalidateSettings();
        window.setTimeout(() => clearPendingBudgetSnapshot(), 1500);
      } catch (e) {
        console.error(e);
        setSaveError(e instanceof Error ? e.message : "Kon niet opslaan. Probeer opnieuw.");
      }
    });
  }

  function handleAddIncomeSource() {
    const amount = Math.round(parseFloat(newAmount || "0") * 100);
    const day = Math.max(1, Math.min(31, parseInt(newDay, 10) || 25));
    if (amount <= 0) return;
    const optimisticSources = [...effectiveIncomeSources, {
      id: `local-${Date.now()}`,
      name: newName.trim() || "Salaris",
      amount,
      dayOfMonth: day,
      type: "monthly" as const,
    }].sort((a, b) => a.dayOfMonth - b.dayOfMonth);
    const primaryDay = getPrimaryPaydayDay(optimisticSources, day);
    setPendingBudgetSnapshot({
      incomeSources: optimisticSources,
      paydayDayOfMonth: primaryDay,
      ...derivePendingPayday(primaryDay, pendingBudget?.lastPaydayDate),
    });
    setNewAmount("");
    setNewDay("25");
    setShowModal(false);
    startTransition(async () => {
      try {
        await addIncomeSource({ name: newName.trim() || "Salaris", amount_cents: amount, day_of_month: day });
        markPendingBudgetSynced();
        router.refresh();
        window.setTimeout(() => clearPendingBudgetSnapshot(), 1500);
      } catch (e) {
        clearPendingBudgetSnapshot();
        console.error(e);
        setSaveError(e instanceof Error ? e.message : "Kon niet opslaan. Probeer opnieuw.");
      }
    });
  }

  function handleDeleteIncomeSource(id: string) {
    const optimisticSources = effectiveIncomeSources.filter((source) => source.id !== id);
    const primaryDay = getPrimaryPaydayDay(optimisticSources, paydayDayOfMonth);
    setPendingBudgetSnapshot({
      incomeSources: optimisticSources,
      paydayDayOfMonth: primaryDay,
      ...derivePendingPayday(primaryDay, pendingBudget?.lastPaydayDate),
    });
    startTransition(async () => {
      try {
        await deleteIncomeSource(id);
        markPendingBudgetSynced();
        router.refresh();
        window.setTimeout(() => clearPendingBudgetSnapshot(), 1500);
      } catch (e) {
        clearPendingBudgetSnapshot();
        console.error(e);
        setSaveError(e instanceof Error ? e.message : "Kon niet opslaan. Probeer opnieuw.");
      }
    });
  }

  return (
    <>
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Loon en dagen over</h2>
          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              setPaydayDay(String(effectivePaydayDay));
              setShowModal(true);
            }}
            className="text-sm font-medium text-[var(--accent-focus)] hover:underline"
          >
            Instellen
          </button>
        </div>
        <div className="p-4 space-y-3">
          {effectiveCycleStartDate && effectiveNextPaydayDate && (
            <p className="text-xs text-[var(--text-muted)]">
              Periode: van {format(new Date(effectiveCycleStartDate + "T12:00:00Z"), "d MMM", { locale: nl })} tot {format(new Date(effectiveNextPaydayDate + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}
            </p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Nog te gaan tot volgend loon</span>
            <span className="text-xl font-bold tabular-nums text-[var(--accent-focus)]">{effectiveDaysUntilNextIncome} dagen</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">{effectiveNextPaydayLabel}</p>
          {saveError && (
            <p className="text-sm text-red-400" role="alert">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={handleVandaagLoonGehad}
            disabled={pending}
            className="w-full rounded-lg border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-3 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 disabled:opacity-50"
          >
            {pending ? "Bezig…" : "Vandaag loon gehad"}
          </button>
          {effectiveIncomeSources.length > 0 && (
            <div className="pt-2 border-t border-[var(--card-border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Inkomsten deze maand</p>
              <ul className="space-y-1">
                {effectiveIncomeSources.map((s) => (
                  <li key={s.id} className="flex justify-between text-sm">
                    <span className="text-[var(--text-primary)]">{s.name}</span>
                    <span className="tabular-nums text-[var(--text-muted)]">{symbol}{(s.amount / 100).toFixed(2)} op dag {s.dayOfMonth}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Loon en loondag" showBranding>
        <p className="text-sm text-[var(--text-muted)] mb-4">Loon is afhankelijk van maand en verwerkingstijd. Druk op &quot;Vandaag loon gehad&quot; om de dienstperiode te starten; stel anders de verwachte loondag in.</p>
        <div className="mb-4">
          <button type="button" onClick={handleVandaagLoonGehad} disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
            {pending ? "Bezig…" : "Vandaag loon gehad"}
          </button>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Of stel in op welke dag van de maand je loon meestal beschikbaar is. Je kunt ook inkomstenbronnen toevoegen.</p>
        {effectiveIncomeSources.length === 0 && (
          <>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Loon beschikbaar op dag (1–31)</label>
            <input type="number" min={1} max={31} value={paydayDay} onChange={(e) => setPaydayDay(e.target.value)} className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm mb-4" />
            <button type="button" onClick={handleSavePaydayDay} disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">{pending ? "Opslaan…" : "Opslaan"}</button>
          </>
        )}
        <div className="mt-6 pt-4 border-t border-[var(--card-border)]">
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Inkomstenbron toevoegen</h4>
          <input type="text" placeholder="Naam (bijv. Salaris)" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm mb-2" />
          <input type="number" step="0.01" min="0" placeholder="Bedrag per maand" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm mb-2" />
          <input type="number" min={1} max={31} placeholder="Dag (1–31)" value={newDay} onChange={(e) => setNewDay(e.target.value)} className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm mb-2" />
          <button type="button" onClick={handleAddIncomeSource} disabled={pending || !newAmount} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">Toevoegen</button>
          {effectiveIncomeSources.length > 0 && (
            <ul className="mt-4 space-y-2">
              {effectiveIncomeSources.map((s) => (
                <li key={s.id} className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)]">
                  <span>{s.name} – dag {s.dayOfMonth}, {symbol}{(s.amount / 100).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteIncomeSource(s.id)}
                    className="text-red-500 text-xs hover:underline"
                  >
                    Verwijderen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => setShowModal(false)} className="mt-4 w-full rounded-lg border border-[var(--card-border)] py-2 text-sm">Sluiten</button>
      </Modal>
    </>
  );
}

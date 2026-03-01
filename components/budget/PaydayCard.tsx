"use client";

import { useState, useTransition } from "react";
import { updateBudgetSettings, setPaydayReceivedToday } from "@/app/actions/budget";
import { addIncomeSource, deleteIncomeSource } from "@/app/actions/dcic/income-sources";
import type { IncomeSource } from "@/lib/dcic/types";
import { Modal } from "@/components/Modal";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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
  const [showModal, setShowModal] = useState(false);
  const [pending, startTransition] = useTransition();
  const [paydayDay, setPaydayDay] = useState(String(paydayDayOfMonth ?? 25));
  const [newName, setNewName] = useState("Salaris");
  const [newAmount, setNewAmount] = useState("");
  const [newDay, setNewDay] = useState("25");
  const symbol = getCurrencySymbol(currency);

  function handleVandaagLoonGehad() {
    startTransition(async () => {
      try {
        await setPaydayReceivedToday();
        setShowModal(false);
      } catch (e) {
        console.error(e);
      }
    });
  }

  function handleSavePaydayDay() {
    const d = parseInt(paydayDay, 10);
    if (isNaN(d) || d < 1 || d > 31) return;
    startTransition(async () => {
      try {
        await updateBudgetSettings({ payday_day_of_month: d });
        setShowModal(false);
      } catch (e) {
        console.error(e);
      }
    });
  }

  function handleAddIncomeSource() {
    const amount = Math.round(parseFloat(newAmount || "0") * 100);
    const day = Math.max(1, Math.min(31, parseInt(newDay, 10) || 25));
    if (amount <= 0) return;
    startTransition(async () => {
      try {
        await addIncomeSource({ name: newName.trim() || "Salaris", amount_cents: amount, day_of_month: day });
        setNewAmount("");
        setNewDay("25");
        setShowModal(false);
      } catch (e) {
        console.error(e);
      }
    });
  }

  return (
    <>
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Loon en dagen over</h2>
          <button type="button" onClick={() => setShowModal(true)} className="text-sm font-medium text-[var(--accent-focus)] hover:underline">Instellen</button>
        </div>
        <div className="p-4 space-y-3">
          {cycleStartDate && nextPaydayDate && (
            <p className="text-xs text-[var(--text-muted)]">
              Periode: van {format(new Date(cycleStartDate + "T12:00:00Z"), "d MMM", { locale: nl })} tot {format(new Date(nextPaydayDate + "T12:00:00Z"), "d MMM yyyy", { locale: nl })}
            </p>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Nog te gaan tot volgend loon</span>
            <span className="text-xl font-bold tabular-nums text-[var(--accent-focus)]">{daysUntilNextIncome} dagen</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">{nextPaydayLabel}</p>
          <button
            type="button"
            onClick={handleVandaagLoonGehad}
            disabled={pending}
            className="w-full rounded-lg border border-[var(--accent-focus)]/50 bg-[var(--accent-focus)]/10 px-3 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 disabled:opacity-50"
          >
            {pending ? "Bezig…" : "Vandaag loon gehad"}
          </button>
          {incomeSources.length > 0 && (
            <div className="pt-2 border-t border-[var(--card-border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Inkomsten deze maand</p>
              <ul className="space-y-1">
                {incomeSources.map((s) => (
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
        {incomeSources.length === 0 && (
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
          {incomeSources.length > 0 && (
            <ul className="mt-4 space-y-2">
              {incomeSources.map((s) => (
                <li key={s.id} className="flex justify-between items-center text-sm py-2 border-b border-[var(--card-border)]">
                  <span>{s.name} – dag {s.dayOfMonth}, {symbol}{(s.amount / 100).toFixed(2)}</span>
                  <button type="button" onClick={() => startTransition(() => deleteIncomeSource(s.id))} className="text-red-500 text-xs hover:underline">Verwijderen</button>
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

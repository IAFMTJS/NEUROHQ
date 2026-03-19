"use client";

import { useMemo, useState } from "react";
import { getCurrencySymbol } from "@/lib/utils/currency";

type Props = {
  monthlyBudgetCents: number;
  monthlySavingsCents: number;
  currency: string;
};

type LockMode = "none" | "soft" | "hard";

export function PaydayPlannerCard({ monthlyBudgetCents, monthlySavingsCents, currency }: Props) {
  const symbol = getCurrencySymbol(currency);
  const spendable = Math.max(0, monthlyBudgetCents - monthlySavingsCents);
  const [fixedPct, setFixedPct] = useState(50);
  const [groceryPct, setGroceryPct] = useState(20);
  const [discretionaryPct, setDiscretionaryPct] = useState(20);
  const [savePct, setSavePct] = useState(10);
  const [lockMode, setLockMode] = useState<LockMode>("soft");

  const totalPct = fixedPct + groceryPct + discretionaryPct + savePct;
  const scale = totalPct > 0 ? 100 / totalPct : 1;
  const allocation = useMemo(() => {
    const fixed = Math.floor((spendable * fixedPct * scale) / 100);
    const grocery = Math.floor((spendable * groceryPct * scale) / 100);
    const discretionary = Math.floor((spendable * discretionaryPct * scale) / 100);
    const savings = Math.max(0, spendable - fixed - grocery - discretionary);
    return { fixed, grocery, discretionary, savings };
  }, [discretionaryPct, fixedPct, groceryPct, savePct, scale, spendable]);

  return (
    <section className="card-simple overflow-hidden p-0 ring-1 ring-emerald-400/20 shadow-[0_0_26px_rgba(16,185,129,0.12)]">
      <div className="border-b border-[var(--card-border)] bg-[linear-gradient(90deg,rgba(16,185,129,0.1),rgba(34,211,238,0.04))] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Payday planner</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Verdeel je spendable meteen na loon in concrete potten.
        </p>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-xs text-[var(--text-muted)]">
          Spendable nu: <span className="font-semibold text-[var(--text-primary)]">{symbol}{(spendable / 100).toFixed(2)}</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <PlannerInput label="Vaste lasten %" value={fixedPct} onChange={setFixedPct} />
          <PlannerInput label="Boodschappen %" value={groceryPct} onChange={setGroceryPct} />
          <PlannerInput label="Discretionary %" value={discretionaryPct} onChange={setDiscretionaryPct} />
          <PlannerInput label="Savings %" value={savePct} onChange={setSavePct} />
        </div>
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-3 text-xs text-[var(--text-muted)]">
          <p>Potten:</p>
          <p>Vaste lasten: {symbol}{(allocation.fixed / 100).toFixed(2)}</p>
          <p>Boodschappen: {symbol}{(allocation.grocery / 100).toFixed(2)}</p>
          <p>Discretionary: {symbol}{(allocation.discretionary / 100).toFixed(2)}</p>
          <p>Savings: {symbol}{(allocation.savings / 100).toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)]">Plan lock:</span>
          <select
            value={lockMode}
            onChange={(e) => setLockMode(e.target.value as LockMode)}
            className="rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1 text-[var(--text-primary)]"
          >
            <option value="none">Geen</option>
            <option value="soft">Soft lock</option>
            <option value="hard">Hard lock</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function PlannerInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
        className="w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
      />
    </label>
  );
}

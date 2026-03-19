"use client";

import { useMemo, useState } from "react";
import { formatCents } from "@/lib/utils/currency";

type Props = {
  currency: string;
};

type Item = { id: string; label: string; checked: boolean };

export function GroceryMissionPlannerCard({ currency }: Props) {
  const [plannedDate, setPlannedDate] = useState("");
  const [cap, setCap] = useState("");
  const [itemText, setItemText] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [actualSpent, setActualSpent] = useState("");

  const capCents = Math.round((Number(cap) || 0) * 100);
  const actualCents = Math.round((Number(actualSpent) || 0) * 100);
  const adherence = capCents > 0 ? Math.max(0, Math.round((1 - Math.max(0, actualCents - capCents) / capCents) * 100)) : null;
  const checkedCount = useMemo(() => items.filter((i) => i.checked).length, [items]);

  function addItem() {
    const label = itemText.trim();
    if (!label) return;
    setItems((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, label, checked: false }]);
    setItemText("");
  }

  return (
    <section id="grocery-mission-planner" className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Grocery mission planner</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Plan grote boodschappen een dag vooraf en houd je aan je cap.
        </p>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-[var(--text-muted)]">Shop datum</span>
            <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]" />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[var(--text-muted)]">Budget cap</span>
            <input type="number" step="0.01" min="0" value={cap} onChange={(e) => setCap(e.target.value)} className="w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]" />
          </label>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={itemText}
            onChange={(e) => setItemText(e.target.value)}
            placeholder="Voeg lijst-item toe"
            className="flex-1 rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
          />
          <button type="button" onClick={addItem} className="rounded border border-[var(--card-border)] px-3 py-1.5 text-xs hover:bg-[var(--bg-surface)]">
            Toevoegen
          </button>
        </div>
        {items.length > 0 && (
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, checked: e.target.checked } : p)))}
                />
                <span className={item.checked ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"}>{item.label}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-3">
          <p className="text-xs text-[var(--text-muted)]">
            Checklist: {checkedCount}/{items.length} afgerond
          </p>
          <label className="mt-2 block space-y-1">
            <span className="text-xs text-[var(--text-muted)]">Werkelijk besteed</span>
            <input type="number" step="0.01" min="0" value={actualSpent} onChange={(e) => setActualSpent(e.target.value)} className="w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]" />
          </label>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Cap: {formatCents(capCents, currency)} · Actual: {formatCents(actualCents, currency)}
          </p>
          {adherence != null && (
            <p className="mt-1 text-xs font-medium text-[var(--text-primary)]">Plan adherence: {adherence}%</p>
          )}
        </div>
      </div>
    </section>
  );
}

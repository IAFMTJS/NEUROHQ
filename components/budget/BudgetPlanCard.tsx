"use client";

import { useState, useTransition } from "react";
import { saveBudgetTarget } from "@/app/actions/dcic/finance-state";
import { Modal } from "@/components/Modal";
import { getCurrencySymbol } from "@/lib/utils/currency";

const DEFAULT_CATEGORIES = ["Housing", "Food", "Transport", "Vervoer", "Subscriptions", "Fun", "Savings", "Other"];
/** Link entry categories (Dutch) to plan categories (EN): Transport = Vervoer and vice versa, Food = Eten, etc. */
const CATEGORY_ALIASES: Record<string, string[]> = {
  Transport: ["Vervoer"],
  Vervoer: ["Transport"],
  Food: ["Eten", "Boodschappen", "Uit eten"],
  Subscriptions: ["Abonnementen"],
  Other: ["Overig"],
  Fun: [],
  Housing: [],
  Savings: [],
};
function spentForCategory(category: string, spentByCategory: Record<string, number>): number {
  const aliases = CATEGORY_ALIASES[category];
  let total = spentByCategory[category] ?? 0;
  if (aliases) for (const a of aliases) total += spentByCategory[a] ?? 0;
  return total;
}

type TargetRow = { category: string; target_cents: number; priority: number; flexible: boolean };

interface BudgetPlanCardProps {
  targets: TargetRow[];
  spentByCategory: Record<string, number>;
  currency?: string;
}

export function BudgetPlanCard({ targets: initialTargets, spentByCategory, currency = "EUR" }: BudgetPlanCardProps) {
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [targets, setTargets] = useState(initialTargets);
  const symbol = getCurrencySymbol(currency);

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...targets.map((t) => t.category)])).filter((c) => c.trim());

  function openEdit(category: string) {
    const t = targets.find((x) => x.category === category);
    setEditingCategory(category);
    setEditTarget(t ? String(t.target_cents / 100) : "");
  }

  function handleSaveTarget() {
    if (!editingCategory) return;
    const cents = Math.round(parseFloat(editTarget || "0") * 100);
    if (cents < 0) return;
    startTransition(async () => {
      try {
        await saveBudgetTarget({ category: editingCategory, target_cents: cents });
        setTargets((prev) => {
          const rest = prev.filter((p) => p.category !== editingCategory);
          return [...rest, { category: editingCategory, target_cents: cents, priority: 2, flexible: true }];
        });
        setEditingCategory(null);
        setShowModal(false);
      } catch (e) {
        console.error(e);
      }
    });
  }

  const hasAnyTarget = targets.some((t) => t.target_cents > 0);

  return (
    <>
      <section className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Budgetplan per categorie</h2>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Stel in hoeveel je per categorie wilt besteden.</p>
          </div>
          <button type="button" onClick={() => { setShowModal(true); setEditingCategory(null); setEditTarget(""); }} className="text-sm font-medium text-[var(--accent-focus)] hover:underline">
            Bewerken
          </button>
        </div>
        <div className="p-4">
          {!hasAnyTarget ? (
            <p className="text-sm text-[var(--text-muted)]">Stel een bedrag per categorie in. Klik op Bewerken.</p>
          ) : (
            <ul className="space-y-3">
              {targets
                .filter((t) => t.target_cents > 0)
                .sort((a, b) => a.category.localeCompare(b.category))
                .map((t) => {
                  const spent = spentForCategory(t.category, spentByCategory);
                  const pct = t.target_cents > 0 ? Math.min(150, (spent / t.target_cents) * 100) : 0;
                  const over = spent > t.target_cents;
                  return (
                    <li key={t.category} className="flex flex-col gap-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-[var(--text-primary)]">{t.category}</span>
                        <span className="tabular-nums text-[var(--text-muted)]">{symbol}{(spent / 100).toFixed(2)} / {symbol}{(t.target_cents / 100).toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[var(--card-border)] overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${over ? "bg-amber-500" : "bg-[var(--accent-focus)]"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
          <p className="mt-3 rounded-lg border border-[var(--card-border)]/80 bg-[var(--bg-surface)]/30 px-3 py-2 text-xs text-[var(--text-muted)]">
            <strong className="text-[var(--text-secondary)]">Overspend?</strong> Je hebt meer uitgegeven dan je maandelijkse doel voor die categorie. <strong>Wat kun je doen:</strong> (1) Uitgaven de komende weken verlagen in die categorie, (2) je doel verhogen als het realistisch is, (3) budget van een andere, flexibele categorie verschuiven naar deze. Transport en Vervoer tellen als dezelfde categorie.
          </p>
        </div>
      </section>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingCategory(null); }} title="Budgetplan per categorie" showBranding>
        <p className="text-sm text-[var(--text-muted)] mb-4">Gepland bedrag per maand per categorie.</p>
        {editingCategory ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-primary)]">{editingCategory}</label>
            <input type="number" step="0.01" min="0" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveTarget} disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">{pending ? "Opslaan…" : "Opslaan"}</button>
              <button type="button" onClick={() => { setEditingCategory(null); setEditTarget(""); }} className="rounded-lg border border-[var(--card-border)] px-4 py-2 text-sm">Annuleren</button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {allCategories.map((cat) => {
              const t = targets.find((x) => x.category === cat);
              return (
                <li key={cat} className="flex justify-between items-center py-2 border-b border-[var(--card-border)] last:border-0">
                  <span className="text-sm text-[var(--text-primary)]">{cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm tabular-nums text-[var(--text-muted)]">{t ? `${symbol}${(t.target_cents / 100).toFixed(2)}` : "—"}</span>
                    <button type="button" onClick={() => openEdit(cat)} className="text-xs font-medium text-[var(--accent-focus)] hover:underline">{t ? "Wijzig" : "Stel in"}</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <button type="button" onClick={() => setShowModal(false)} className="mt-4 w-full rounded-lg border border-[var(--card-border)] py-2 text-sm font-medium">Sluiten</button>
      </Modal>
    </>
  );
}

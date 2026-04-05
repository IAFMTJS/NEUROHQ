"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSavingsContribution, updateSavingsGoal, deleteSavingsGoal } from "@/app/actions/savings";
import { weeklyRequired } from "@/lib/utils/savings";
import { formatCentsValue, getCurrencySymbol, parseToCents } from "@/lib/utils/currency";

type Goal = {
  id: string;
  name: string;
  target_cents: number;
  current_cents: number;
  deadline: string | null;
  status?: string;
};

function euroInputToCents(raw: string): number | null {
  return parseToCents(raw.replace(/\s/g, "").replace(",", "."));
}

export function SavingsGoalCard({
  goal,
  weeklyReq,
  currency = "EUR",
  contributedThisMonthCents = 0,
  readOnly = false,
}: {
  goal: Goal;
  weeklyReq: number | null;
  currency?: string;
  contributedThisMonthCents?: number;
  /** Geen bewerken / bijdragen (bijv. historische weergave). */
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editName, setEditName] = useState(goal.name);
  const [editTarget, setEditTarget] = useState(formatCentsValue(goal.target_cents));
  const [editCurrent, setEditCurrent] = useState(formatCentsValue(goal.current_cents));
  const [editDeadline, setEditDeadline] = useState(goal.deadline ?? "");

  useEffect(() => {
    if (!editing) {
      setEditName(goal.name);
      setEditTarget(formatCentsValue(goal.target_cents));
      setEditCurrent(formatCentsValue(goal.current_cents));
      setEditDeadline(goal.deadline ?? "");
    }
  }, [editing, goal.id, goal.name, goal.target_cents, goal.current_cents, goal.deadline]);

  const pct = goal.target_cents ? Math.min(100, Math.round((goal.current_cents / goal.target_cents) * 100)) : 0;
  const symbol = getCurrencySymbol(currency);
  const isReached = goal.current_cents >= goal.target_cents;
  const deadlineDate = goal.deadline ? new Date(goal.deadline) : null;
  const weeksLeft =
    deadlineDate && deadlineDate > new Date()
      ? Math.max(1, Math.ceil((deadlineDate.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
      : null;

  function openEdit() {
    setEditErr(null);
    setEditName(goal.name);
    setEditTarget(formatCentsValue(goal.target_cents));
    setEditCurrent(formatCentsValue(goal.current_cents));
    setEditDeadline(goal.deadline ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEditErr(null);
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const name = editName.trim();
    const target_cents = euroInputToCents(editTarget);
    const current_cents = euroInputToCents(editCurrent);
    if (!name) {
      setEditErr("Vul een naam in.");
      return;
    }
    if (target_cents == null || target_cents <= 0) {
      setEditErr("Doelbedrag moet groter dan nul zijn.");
      return;
    }
    if (current_cents == null || current_cents < 0) {
      setEditErr("Huidig saldo mag niet negatief zijn.");
      return;
    }
    setEditErr(null);
    startTransition(async () => {
      try {
        await updateSavingsGoal(goal.id, {
          name,
          target_cents,
          current_cents,
          deadline: editDeadline.trim() === "" ? null : editDeadline.trim(),
        });
        setEditing(false);
        router.refresh();
      } catch (err) {
        setEditErr(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (readOnly) return;
    const form = e.currentTarget;
    const input = form.elements.namedItem("amount") as HTMLInputElement;
    const noteInput = form.elements.namedItem("note") as HTMLInputElement | null;
    const value = input?.value?.trim();
    if (!value) return;
    const amountCents = Math.round(parseFloat(value.replace(",", ".")) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;
    startTransition(async () => {
      await addSavingsContribution(goal.id, amountCents, noteInput?.value?.trim());
      form.reset();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Dit spaardoel verwijderen? Dit kan niet ongedaan worden.")) return;
    startTransition(() => {
      void deleteSavingsGoal(goal.id).then(() => router.refresh());
    });
  }

  function handleMarkComplete() {
    startTransition(() => {
      void updateSavingsGoal(goal.id, { status: "completed" }).then(() => router.refresh());
    });
  }

  function handleCancelGoal() {
    if (!confirm("Dit doel archiveren? Je kunt gearchiveerde doelen later weer tonen in instellingen.")) return;
    startTransition(() => {
      void updateSavingsGoal(goal.id, { status: "cancelled" }).then(() => router.refresh());
    });
  }

  return (
    <div className="card-simple overflow-hidden p-0">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--card-border)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--text-primary)]">{goal.name}</h3>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {symbol}
            {(goal.current_cents / 100).toFixed(2)} / {symbol}
            {(goal.target_cents / 100).toFixed(2)}
            {goal.deadline && ` · Deadline ${goal.deadline}`}
          </p>
          {weeklyReq !== null && weeklyReq > 0 && (
            <p className="mt-1 text-xs font-medium text-[var(--accent-focus)]">
              ~{symbol}
              {(weeklyReq / 100).toFixed(2)}/week to reach goal
              {weeksLeft !== null && ` · ${weeksLeft} week${weeksLeft !== 1 ? "s" : ""} left`}
            </p>
          )}
          {weeksLeft !== null && weeklyReq !== null && weeklyReq > 0 && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {isReached
                ? "Goal reached!"
                : goal.current_cents + weeklyReq * weeksLeft >= goal.target_cents
                  ? "On track"
                  : "Add more to stay on track"}
            </p>
          )}
          {contributedThisMonthCents > 0 && (
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Added this month: {symbol}
              {(contributedThisMonthCents / 100).toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {!readOnly && (
            <button
              type="button"
              onClick={editing ? cancelEdit : openEdit}
              disabled={pending}
              className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 transition"
            >
              {editing ? "Sluiten" : "Bewerken"}
            </button>
          )}
          {isReached && !readOnly && (
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={pending}
              className="rounded-lg px-2 py-1 text-xs font-medium text-green-400 hover:bg-green-500/10 transition"
            >
              Mark complete
            </button>
          )}
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleCancelGoal}
                disabled={pending}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--card-border)]/50 transition"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400 transition"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {editing && !readOnly && (
        <form
          onSubmit={handleEditSave}
          className="space-y-3 border-b border-[var(--card-border)] bg-[var(--bg-primary)]/35 px-4 py-3"
        >
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">Doel bewerken</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
              Naam
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
              Doel ({symbol})
              <input
                type="text"
                inputMode="decimal"
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
              Huidig saldo ({symbol})
              <input
                type="text"
                inputMode="decimal"
                value={editCurrent}
                onChange={(e) => setEditCurrent(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-[var(--text-muted)]">
              Deadline (optioneel)
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              />
            </label>
          </div>
          <p className="text-[10px] leading-snug text-[var(--text-muted)]">
            Handmatig saldo aanpassen wijkt af van het stortingenlogboek; gebruik dat voor correcties of startwaarden.
          </p>
          {editErr ? <p className="text-xs text-rose-300">{editErr}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">
              Opslaan
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={pending}
              className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            >
              Annuleren
            </button>
          </div>
        </form>
      )}

      <div className="p-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
          <div
            className="h-full rounded-full bg-[var(--accent-focus)] transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        {!isReached && !readOnly && (
          <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="e.g. 50"
              className="w-28 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <input
              name="note"
              type="text"
              placeholder="Note (optional)"
              className="w-32 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            />
            <button type="submit" disabled={pending} className="btn-primary rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50">
              Add
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

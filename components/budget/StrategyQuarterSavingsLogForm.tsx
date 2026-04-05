"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addSavingsContribution } from "@/app/actions/savings";
import { formatCents, getCurrencySymbol } from "@/lib/utils/currency";

export type StrategyQuarterSavingsPayload = {
  quarterLabel: string;
  targetCents: number;
  savedThisQuarterCents: number;
};

type GoalOption = { id: string; name: string };

/**
 * Stortingen op een spaardoel tellen mee voor Strategy zodra er een kwartaaldoel is (alle contributions in het kwartaal).
 * `quarter` mag null zijn: het formulier blijft zichtbaar zodat je altijd kunt storten; zonder contract zie je geen voortgangsbalk.
 */
export function StrategyQuarterSavingsLogForm({
  goals,
  currency,
  quarter,
}: {
  goals: GoalOption[];
  currency: string;
  quarter: StrategyQuarterSavingsPayload | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [goalId, setGoalId] = useState(goals[0]?.id ?? "");
  const symbol = getCurrencySymbol(currency);
  const pct =
    quarter && quarter.targetCents > 0
      ? Math.min(100, Math.round((quarter.savedThisQuarterCents / quarter.targetCents) * 100))
      : 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!goalId) {
      setErr("Kies een spaardoel.");
      return;
    }
    const form = e.currentTarget;
    const amountEl = form.elements.namedItem("amount") as HTMLInputElement;
    const noteEl = form.elements.namedItem("note") as HTMLInputElement | null;
    const raw = amountEl?.value?.trim().replace(",", ".") ?? "";
    const euros = parseFloat(raw);
    if (!Number.isFinite(euros) || euros <= 0) {
      setErr("Vul een geldig bedrag in.");
      return;
    }
    const amountCents = Math.round(euros * 100);
    startTransition(async () => {
      try {
        await addSavingsContribution(goalId, amountCents, noteEl?.value?.trim() || undefined);
        form.reset();
        setErr(null);
        router.refresh();
      } catch (ex) {
        setErr(ex instanceof Error ? ex.message : "Storten mislukt.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-3">
      {quarter ? (
        <>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/90">Strategy · dit kwartaal</p>
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
            Doel {quarter.quarterLabel}:{" "}
            <span className="font-medium text-[var(--text-primary)]">{formatCents(quarter.targetCents, currency)}</span>
            . Stortingen op <span className="font-medium text-[var(--text-secondary)]">elk</span> spaardoel tellen mee voor
            dit kwartaal.
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full bg-emerald-400/80 transition-all"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Gelogd: {formatCents(quarter.savedThisQuarterCents, currency)} ({pct}%)
          </p>
        </>
      ) : (
        <>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/90">Spaarstorting</p>
          <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
            Stort op een spaardoel hieronder. Zodra je op Strategy een kwartaaldoel hebt, tellen deze stortingen automatisch
            mee voor je voortgang.
          </p>
        </>
      )}

      {goals.length === 0 ? (
        <p className="mt-3 text-xs leading-snug text-amber-100/90">
          Je hebt nog geen spaardoel. Maak er hieronder een aan; daarna kun je hier storten (en ze meetellen voor Strategy
          zodra je contract dat vastlegt).
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-3 space-y-2">
          <label className="block text-[11px] text-[var(--text-muted)]">
            Spaardoel
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
              disabled={pending}
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-[6rem] flex-1 text-[11px] text-[var(--text-muted)]">
              Bedrag ({symbol})
              <input
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
                disabled={pending}
              />
            </label>
            <label className="min-w-[8rem] flex-[2] text-[11px] text-[var(--text-muted)]">
              Notitie (optioneel)
              <input
                name="note"
                type="text"
                placeholder="bijv. loon"
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm text-[var(--text-primary)]"
                disabled={pending}
              />
            </label>
            <button
              type="submit"
              disabled={pending || !goalId}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Storten
            </button>
          </div>
          {err ? <p className="text-xs text-rose-300">{err}</p> : null}
        </form>
      )}

      <p className="mt-2 text-[10px] text-[var(--text-muted)]">
        Kwartaaldoel wijzigen?{" "}
        <Link
          href="/strategy?tab=contract#strategy-contract"
          className="font-medium text-[var(--accent-focus)] underline-offset-2 hover:underline"
        >
          Strategy contract
        </Link>
      </p>
    </div>
  );
}

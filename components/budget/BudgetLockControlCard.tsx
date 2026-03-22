"use client";

import { useState, useTransition } from "react";
import { setBudgetNoSpendLock, submitEmergencyExpenseReason } from "@/app/actions/budget-intelligence";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndDateTime } from "@/lib/budget-lock-display";

type Props = {
  lockActive: boolean;
  lockUntil: string | null;
  lockUntilAt: string | null;
  currency: string;
};

export function BudgetLockControlCard({ lockActive, lockUntil, lockUntilAt, currency }: Props) {
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(2);
  const [endTime, setEndTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [emergencyAmount, setEmergencyAmount] = useState("0");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section id="budget-lock-control" className="card-simple space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Budget lock / no-spend</h3>
      <p className="text-xs text-[var(--text-muted)]">
        Active lock:{" "}
        {lockActive
          ? lockUntilAt
            ? `ja — tot ${formatLockEndDateTime(lockUntilAt) ?? lockUntil ?? "-"}`
            : `ja, tot ${lockUntil ?? "-"}`
          : "nee"}
        .
      </p>
      {lockActive && lockUntilAt && (
        <p className="text-xs text-amber-100/90">
          <BudgetLockCountdown unlockAtIso={lockUntilAt} />
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-[var(--text-muted)]">
          Dagen
          <input
            type="number"
            min={1}
            max={7}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-[var(--text-muted)]">
          Einduur (lokale tijd)
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-[var(--text-muted)] sm:col-span-2">
          Reden
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            placeholder="Waarom deze lock?"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={pending || reason.trim().length < 3}
        className="rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
        onClick={() =>
          startTransition(async () => {
            const end = new Date();
            end.setDate(end.getDate() + days);
            const [hh, mm] = endTime.split(":").map((x) => parseInt(x, 10));
            if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
              setMessage("Ongeldig einduur.");
              return;
            }
            end.setHours(hh, mm, 0, 0);
            await setBudgetNoSpendLock({ days, reason, lockUntilAtIso: end.toISOString() });
            setMessage("Budget lock opgeslagen.");
          })
        }
      >
        {pending ? "Opslaan..." : "Activeer no-spend lock"}
      </button>

      <div className="border-t border-[var(--card-border)] pt-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">Nooduitgave reden loggen</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-[var(--text-muted)]">
            Bedrag ({currency})
            <input
              value={emergencyAmount}
              onChange={(e) => setEmergencyAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--text-muted)]">
            Waarom noodzakelijk?
            <input
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={pending || emergencyReason.trim().length < 4}
          className="mt-2 rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold"
          onClick={() =>
            startTransition(async () => {
              const amountCents = Math.round(Number(emergencyAmount || 0) * 100);
              await submitEmergencyExpenseReason({
                amountCents,
                category: "emergency",
                reason: emergencyReason,
              });
              setMessage("Nooduitgave reden gelogd voor training.");
            })
          }
        >
          Log nooduitgave reden
        </button>
      </div>
      {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}
    </section>
  );
}


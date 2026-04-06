"use client";

import { useEffect, useState, useTransition } from "react";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { setBudgetNoSpendLock, submitEmergencyExpenseReason } from "@/app/actions/budget-intelligence";
import { BudgetLockCountdown } from "@/components/budget/BudgetLockCountdown";
import { formatLockEndDateTime } from "@/lib/budget-lock-display";
import { Modal } from "@/components/Modal";

type Props = {
  lockActive: boolean;
  lockUntil: string | null;
  lockUntilAt: string | null;
  currency: string;
  /** Open the emergency modal on mount (e.g. deep link via BudgetLockHub). */
  initialEmergencyOpen?: boolean;
  /** Omit outer card chrome when embedded in a toast shell. */
  embedded?: boolean;
};

export function BudgetLockControlCard({
  lockActive,
  lockUntil,
  lockUntilAt,
  currency,
  initialEmergencyOpen = false,
  embedded = false,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState(2);
  const [endTime, setEndTime] = useState("23:59");
  const [reason, setReason] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [emergencyAmount, setEmergencyAmount] = useState("0");
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmergencyOpen) setEmergencyOpen(true);
  }, [initialEmergencyOpen]);

  const normalizedEmergencyAmount = emergencyAmount.replace(",", ".").trim();
  const parsedEmergencyAmount = Number(normalizedEmergencyAmount);
  const hasValidEmergencyAmount = Number.isFinite(parsedEmergencyAmount) && parsedEmergencyAmount > 0;

  return (
    <section
      id="budget-lock-control"
      className={embedded ? "space-y-3" : "card-simple space-y-3"}
    >
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
        <p className="text-xs text-[var(--semantic-accent)]">
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
            try {
              const end = new Date();
              end.setDate(end.getDate() + days);
              const [hh, mm] = endTime.split(":").map((x) => parseInt(x, 10));
              if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
                setMessage("Ongeldig einduur.");
                return;
              }
              end.setHours(hh, mm, 0, 0);
              await setBudgetNoSpendLock({ days, reason: reason.trim(), lockUntilAtIso: end.toISOString() });
              setMessage("Budget lock opgeslagen.");
              neuroToast.success("Budget lock opgeslagen.");
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Opslaan van budget lock mislukt.";
              setMessage(errorMessage);
              neuroToast.error(errorMessage);
            }
          })
        }
      >
        {pending ? "Opslaan..." : "Activeer no-spend lock"}
      </button>

      <div className="border-t border-[var(--card-border)] pt-3">
        <p className="text-xs font-medium text-[var(--text-secondary)]">Nooduitgave reden loggen</p>
        <button
          id="budget-lock-emergency"
          type="button"
          className="mt-2 rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold"
          onClick={() => setEmergencyOpen(true)}
        >
          Nooduitgave toevoegen
        </button>
      </div>
      {message && <p className="text-xs text-[var(--text-muted)]">{message}</p>}

      <Modal
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        title="Nooduitgave toevoegen"
        subtitle="Log bedrag + reden om lock-beslissingen te trainen."
        size="md"
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-[var(--text-muted)]">
              Bedrag ({currency})
              <input
                type="text"
                inputMode="decimal"
                value={emergencyAmount}
                onChange={(e) => setEmergencyAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm"
                placeholder="0.00"
              />
            </label>
            <label className="text-xs text-[var(--text-muted)]">
              Waarom noodzakelijk?
              <input
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-2 text-sm"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-xs font-semibold"
              onClick={() => setEmergencyOpen(false)}
            >
              Sluiten
            </button>
            <button
              type="button"
              disabled={pending || emergencyReason.trim().length < 4 || !hasValidEmergencyAmount}
              className="rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
              onClick={() =>
                startTransition(async () => {
                  if (!hasValidEmergencyAmount) {
                    setMessage("Geef een geldig bedrag groter dan 0.");
                    return;
                  }
                  try {
                    const amountCents = Math.round(parsedEmergencyAmount * 100);
                    await submitEmergencyExpenseReason({
                      amountCents,
                      category: "emergency",
                      reason: emergencyReason.trim(),
                    });
                    setMessage("Nooduitgave opgeslagen.");
                    setEmergencyReason("");
                    setEmergencyAmount("0");
                    setEmergencyOpen(false);
                    neuroToast.success("Nooduitgave opgeslagen.");
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : "Opslaan van nooduitgave mislukt.";
                    setMessage(errorMessage);
                    neuroToast.error(errorMessage);
                  }
                })
              }
            >
              {pending ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}


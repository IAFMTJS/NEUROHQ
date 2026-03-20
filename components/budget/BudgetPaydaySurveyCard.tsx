"use client";

import { useState, useTransition } from "react";

type Props = {
  required: boolean;
};

export function BudgetPaydaySurveyCard({ required }: Props) {
  const [pending, startTransition] = useTransition();
  const [primaryReason, setPrimaryReason] = useState("impulse");
  const [trigger, setTrigger] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <section className="card-simple space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">Pre-payday reflectie (T-4)</h3>
      <p className="text-xs text-[var(--text-muted)]">
        {required
          ? "Verplicht: vul deze survey in om je budgetcyclus af te ronden."
          : "Optioneel: extra reflectie voor betere budget-aanpassingen."}
      </p>
      <label className="text-xs text-[var(--text-muted)]">
        Hoofdreden overschrijding
        <select
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
          value={primaryReason}
          onChange={(e) => setPrimaryReason(e.target.value)}
        >
          <option value="impulse">Impulsaankopen</option>
          <option value="underestimated">Budget onderschat</option>
          <option value="unexpected">Onverwachte kosten</option>
          <option value="social">Sociale druk</option>
        </select>
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Trigger
        <input
          value={trigger}
          onChange={(e) => setTrigger(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
          placeholder="Wat veroorzaakte de overschrijding?"
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Zekerheid (1-5)
        <input
          type="number"
          min={1}
          max={5}
          value={confidence}
          onChange={(e) => setConfidence(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
        />
      </label>
      <label className="text-xs text-[var(--text-muted)]">
        Extra notitie
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 min-h-20 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="button"
        disabled={pending || trigger.trim().length < 3}
        className="rounded-lg bg-[var(--accent-focus)] px-3 py-2 text-xs font-semibold text-black disabled:opacity-60"
        onClick={() =>
          startTransition(async () => {
            const res = await fetch("/api/budget/payday-survey", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ primaryReason, trigger, confidence, note }),
            });
            if (!res.ok) {
              throw new Error("Survey opslaan mislukt");
            }
            setSaved(true);
          })
        }
      >
        {pending ? "Opslaan..." : "Survey opslaan"}
      </button>
      {saved && <p className="text-xs text-[var(--text-muted)]">Survey opgeslagen voor modeltraining.</p>}
    </section>
  );
}


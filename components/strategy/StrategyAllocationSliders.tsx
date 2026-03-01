"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { updateWeeklyAllocation } from "@/app/actions/strategyFocus";
import { domainLabel, type StrategyDomain, type WeeklyAllocation } from "@/lib/strategyDomains";

const DOMAINS: StrategyDomain[] = ["discipline", "health", "learning", "business"];

type Props = {
  initialAllocation: WeeklyAllocation;
  /** Optional: show opportunity cost when allocation differs from initial */
  showOpportunityCost?: boolean;
};

function normalizeTo100(alloc: WeeklyAllocation): WeeklyAllocation {
  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);
  if (sum === 0) return { discipline: 25, health: 25, learning: 25, business: 25 };
  if (sum === 100) return { ...alloc };
  const scale = 100 / sum;
  const out = { ...alloc };
  for (const d of DOMAINS) out[d] = Math.round(alloc[d] * scale);
  const newSum = Object.values(out).reduce((a, b) => a + b, 0);
  if (newSum !== 100) out[DOMAINS[0]] = (out[DOMAINS[0]] ?? 0) + (100 - newSum);
  return out;
}

export function StrategyAllocationSliders({
  initialAllocation,
  showOpportunityCost = true,
}: Props) {
  const router = useRouter();
  const [alloc, setAlloc] = useState<WeeklyAllocation>(() => normalizeTo100(initialAllocation));
  const [pending, setPending] = useState(false);

  const sum = Object.values(alloc).reduce((a, b) => a + b, 0);

  const gains = DOMAINS.filter((d) => (alloc[d] ?? 0) > (initialAllocation[d] ?? 0));
  const losses = DOMAINS.filter((d) => (alloc[d] ?? 0) < (initialAllocation[d] ?? 0));
  const hasChange =
    showOpportunityCost &&
    (gains.length > 0 || losses.length > 0) &&
    (alloc.discipline !== initialAllocation.discipline ||
      alloc.health !== initialAllocation.health ||
      alloc.learning !== initialAllocation.learning ||
      alloc.business !== initialAllocation.business);

  const handleChange = useCallback(
    (domain: StrategyDomain, value: number) => {
      setAlloc((prev) => {
        const next = { ...prev, [domain]: value };
        return normalizeTo100(next);
      });
    },
    []
  );

  const handleSave = async () => {
    const normalized = normalizeTo100(alloc);
    if (Object.values(normalized).reduce((a, b) => a + b, 0) !== 100) return;
    setPending(true);
    try {
      await updateWeeklyAllocation(normalized);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Weekly focus budget (100 punten)
      </h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Verdeling via sliders (live opportunity cost bij aanpassen). Dit wordt de geplande distributie.
      </p>
      <div className="mt-3 space-y-3">
        {DOMAINS.map((d) => (
          <div key={d} className="flex items-center gap-3">
            <label className="w-24 shrink-0 text-sm text-[var(--text-primary)]">
              {domainLabel(d)}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={alloc[d] ?? 0}
              onChange={(e) => handleChange(d, Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right text-sm tabular-nums text-[var(--text-primary)]">
              {alloc[d] ?? 0}
            </span>
          </div>
        ))}
      </div>
      {hasChange && (
        <div className="mt-3 rounded-lg border border-[var(--accent-cyan)]/30 bg-[var(--accent-cyan)]/5 px-3 py-2 text-xs text-[var(--text-primary)]">
          <span className="font-medium text-[var(--accent-cyan)]">Opportunity cost: </span>
          {gains.length > 0 && (
            <span>
              Meer focus op{" "}
              {gains
                .map((d) => `${domainLabel(d)} (+${(alloc[d] ?? 0) - (initialAllocation[d] ?? 0)}%)`)
                .join(", ")}
            </span>
          )}
          {gains.length > 0 && losses.length > 0 && " ten koste van "}
          {losses.length > 0 && (
            <span>
              {losses
                .map((d) => `${domainLabel(d)} (−${(initialAllocation[d] ?? 0) - (alloc[d] ?? 0)}%)`)
                .join(", ")}
            </span>
          )}
          . Sla op om geplande distributie te wijzigen.
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-[var(--text-muted)]">Totaal: {sum}/100</span>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || sum !== 100}
          className="rounded-lg bg-[var(--accent-focus)]/80 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Opslaan…" : "Opslaan"}
        </button>
      </div>
    </section>
  );
}

"use client";

import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";

type Props = {
  date: string;
  currency?: string;
};

export function BudgetQuickLogCard({ date, currency = "EUR" }: Props) {
  return (
    <section id="budget-quick-log-card" className="card-simple-accent overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Quick Log</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
          Log direct na aankoop om impuls en planning realtime te sturen.
        </p>
      </div>
      <div className="p-4">
        <AddBudgetEntryForm date={date} currency={currency} mode="quick" />
      </div>
    </section>
  );
}


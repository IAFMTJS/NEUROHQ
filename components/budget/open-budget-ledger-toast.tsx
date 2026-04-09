"use client";

import { toast } from "sonner";
import Link from "next/link";
import { AddBudgetEntryForm } from "@/components/AddBudgetEntryForm";
import { BudgetEntryList } from "@/components/BudgetEntryList";
import { BudgetDeckToastChrome, BUDGET_DECK_TOAST_DURATION_MS } from "@/components/budget/budget-deck-toast-chrome";

export type BudgetLedgerToastEntry = {
  id: string;
  amount_cents: number;
  date: string;
  category: string | null;
  note: string | null;
  is_planned: boolean;
  freeze_until: string | null;
  freeze_reminder_sent: boolean;
};

export type BudgetLedgerToastGoal = {
  id: string;
  name: string;
  target_cents: number;
  current_cents: number;
  deadline: string | null;
  status?: string;
};

export function openBudgetLedgerToast(params: {
  date: string;
  currency: string;
  entries: BudgetLedgerToastEntry[];
  goals: BudgetLedgerToastGoal[];
  executeEntriesHref: string;
}) {
  const { date, currency, entries, goals, executeEntriesHref } = params;
  toast.custom(
    (id) => (
      <BudgetDeckToastChrome
        toastId={id}
        title="Boekingen"
        hint="Nieuwe posten en dit overzicht van de periode."
        ariaLabel="Boekingen"
      >
        <div className="space-y-4">
          <AddBudgetEntryForm date={date} currency={currency} readOnly={false} />
          {entries.length > 0 ? (
            <BudgetEntryList entries={entries} currency={currency} goals={goals} readOnly={false} />
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--card-border)] px-3 py-3 text-sm text-[var(--text-muted)]">
              Nog geen boekingen in deze periode.
            </p>
          )}
          <Link
            href={executeEntriesHref}
            className="inline-block text-xs font-semibold text-[var(--accent-focus)] hover:underline"
            onClick={() => toast.dismiss(id)}
          >
            Anker #entries-frozen op deze pagina →
          </Link>
        </div>
      </BudgetDeckToastChrome>
    ),
    { duration: BUDGET_DECK_TOAST_DURATION_MS }
  );
}

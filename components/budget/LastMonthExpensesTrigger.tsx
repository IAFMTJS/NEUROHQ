"use client";

import { useState } from "react";
import { LastMonthExpensesModal } from "./LastMonthExpensesModal";

type Entry = {
  id: string;
  amount_cents: number;
  date: string;
  category: string | null;
  note: string | null;
  is_planned: boolean;
  freeze_until: string | null;
  freeze_reminder_sent: boolean;
};
type Goal = { id: string; name: string; target_cents: number; current_cents: number; status?: string };

type Props = {
  prevMonthEntries: Entry[];
  currency: string;
  goals: Goal[];
};

/** Button + modal voor uitgaven vorige maand. */
export function LastMonthExpensesTrigger({ prevMonthEntries, currency, goals }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] rounded"
      >
        {prevMonthEntries.length > 0
          ? `Uitgaven vorige maand (${prevMonthEntries.length}) →`
          : "Uitgaven vorige maand →"}
      </button>
      <LastMonthExpensesModal
        open={open}
        onClose={() => setOpen(false)}
        entries={prevMonthEntries}
        currency={currency}
        goals={goals}
      />
    </>
  );
}

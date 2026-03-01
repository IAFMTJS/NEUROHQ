"use client";

import { useState } from "react";
import { NextMonthExpensesModal } from "./NextMonthExpensesModal";

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
  nextMonthEntries: Entry[];
  currency: string;
  goals: Goal[];
};

/** Button + modal voor uitgaven volgende maand. Toon altijd (modal toont lege staat als geen entries). */
export function NextMonthExpensesTrigger({ nextMonthEntries, currency, goals }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-[var(--accent-focus)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-focus)] rounded"
      >
        {nextMonthEntries.length > 0
          ? `Uitgaven volgende maand (${nextMonthEntries.length}) →`
          : "Uitgaven volgende maand →"}
      </button>
      <NextMonthExpensesModal
        open={open}
        onClose={() => setOpen(false)}
        entries={nextMonthEntries}
        currency={currency}
        goals={goals}
      />
    </>
  );
}

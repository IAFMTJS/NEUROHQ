"use client";

import { Modal } from "@/components/Modal";
import { BudgetEntryList } from "@/components/BudgetEntryList";

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
  open: boolean;
  onClose: () => void;
  entries: Entry[];
  currency: string;
  goals: Goal[];
};

/** Modal: uitgaven van de vorige maand (archief / overzicht). */
export function LastMonthExpensesModal({ open, onClose, entries, currency, goals }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Uitgaven vorige maand" size="lg" showBranding={false}>
      <p className="text-sm text-[var(--text-muted)]">
        Boekingen van de vorige maand. Voor overzicht en vergelijking; tellen niet mee voor het budget van deze maand.
      </p>
      <div className="mt-4">
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--bg-primary)]/40 px-4 py-6 text-center text-sm text-[var(--text-muted)]">
            Geen uitgaven voor vorige maand.
          </p>
        ) : (
          <BudgetEntryList entries={entries} currency={currency} goals={goals} />
        )}
      </div>
    </Modal>
  );
}

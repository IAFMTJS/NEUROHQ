"use client";

import { useTransition } from "react";
import { deleteBudgetEntry, freezePurchase, confirmFreeze, cancelFreeze } from "@/app/actions/budget";

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

export function BudgetEntryList({ entries }: { entries: Entry[] }) {
  const [pending, startTransition] = useTransition();

  function handleFreeze(id: string) {
    startTransition(() => freezePurchase(id));
  }
  function handleConfirm(id: string) {
    startTransition(() => confirmFreeze(id));
  }
  function handleCancel(id: string) {
    startTransition(() => cancelFreeze(id));
  }
  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(() => deleteBudgetEntry(id));
  }

  const now = new Date().toISOString();
  const frozen = entries.filter((e) => e.freeze_until && e.freeze_until > now);
  const readyReminder = entries.filter((e) => e.freeze_until && e.freeze_until <= now && !e.freeze_reminder_sent);
  const rest = entries.filter((e) => !e.freeze_until || (e.freeze_until <= now && e.freeze_reminder_sent));

  return (
    <ul className="space-y-2">
      {frozen.map((e) => (
        <li key={e.id} className="flex items-center justify-between rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2">
          <span className="text-sm text-neuro-silver">
            {e.amount_cents < 0 ? "-" : ""}{(Math.abs(e.amount_cents) / 100).toFixed(2)} · {e.date}
            {e.note && ` · ${e.note}`}
          </span>
          <span className="text-xs text-amber-200">Frozen until {e.freeze_until ? new Date(e.freeze_until).toLocaleString() : ""}</span>
        </li>
      ))}
      {readyReminder.map((e) => (
        <li key={e.id} className="flex items-center justify-between rounded border border-neutral-700 bg-neuro-surface px-3 py-2">
          <span className="text-sm text-neuro-silver">
            {e.amount_cents < 0 ? "-" : ""}{(Math.abs(e.amount_cents) / 100).toFixed(2)} · {e.date}
            {e.note && ` · ${e.note}`}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleConfirm(e.id)}
              disabled={pending}
              className="text-xs text-green-400 hover:underline"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => handleCancel(e.id)}
              disabled={pending}
              className="text-xs text-red-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </li>
      ))}
      {rest.slice(0, 30).map((e) => (
        <li key={e.id} className="flex items-center justify-between rounded border border-neutral-700 bg-neuro-surface px-3 py-2">
          <span className="text-sm text-neuro-silver">
            {e.amount_cents >= 0 ? "+" : ""}{(e.amount_cents / 100).toFixed(2)} · {e.date}
            {e.category && ` · ${e.category}`}
            {e.note && ` · ${e.note}`}
          </span>
          <div className="flex gap-2">
            {e.amount_cents < 0 && !e.freeze_until && (
              <button
                type="button"
                onClick={() => handleFreeze(e.id)}
                disabled={pending}
                className="text-xs text-neuro-blue hover:underline"
              >
                Freeze 24h
              </button>
            )}
            <button type="button" onClick={() => handleDelete(e.id)} disabled={pending} className="text-xs text-neutral-500 hover:text-red-400">
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

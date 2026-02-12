"use client";

import { useTransition } from "react";
import { confirmFreeze, cancelFreeze } from "@/app/actions/budget";

type Entry = {
  id: string;
  amount_cents: number;
  date: string;
  category: string | null;
  note: string | null;
  freeze_until: string | null;
};

type Props = {
  activeFrozen: Entry[];
  readyForAction: Entry[];
};

function formatCents(cents: number): string {
  const abs = Math.abs(cents);
  return (abs / 100).toFixed(2);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function FrozenPurchaseCard({ activeFrozen, readyForAction }: Props) {
  const [pending, startTransition] = useTransition();

  if (activeFrozen.length === 0 && readyForAction.length === 0) return null;

  return (
    <section className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <h2 className="text-base font-semibold text-neuro-silver">24h freeze</h2>
        <p className="mt-0.5 text-xs text-neuro-muted">Confirm or cancel after 24 hours.</p>
      </div>
      <div className="p-4 space-y-4">
        {activeFrozen.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neuro-muted mb-2">Still frozen</h3>
            <ul className="space-y-2">
              {activeFrozen.map((e) => (
                <li key={e.id} className="flex justify-between items-start rounded-lg border border-neuro-border bg-neuro-dark/50 px-3 py-2.5 text-sm">
                  <div>
                    <span className="text-neuro-silver">€{formatCents(e.amount_cents)}</span>
                    {e.note && <span className="ml-2 text-neuro-muted">— {e.note}</span>}
                    <p className="mt-1 text-xs text-neuro-muted">Until {e.freeze_until ? formatDate(e.freeze_until) : ""}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {readyForAction.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neuro-muted mb-2">Ready to confirm or cancel</h3>
            <ul className="space-y-2">
              {readyForAction.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neuro-border bg-neuro-dark/50 px-3 py-2.5 text-sm">
                  <div>
                    <span className="text-neuro-silver">€{formatCents(e.amount_cents)}</span>
                    {e.note && <span className="ml-2 text-neuro-muted">— {e.note}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startTransition(() => confirmFreeze(e.id))}
                      disabled={pending}
                      className="rounded-lg bg-green-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => startTransition(() => cancelFreeze(e.id))}
                      disabled={pending}
                      className="rounded-lg border border-neuro-border px-3 py-1.5 text-xs font-medium text-neuro-silver hover:bg-neuro-border/50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

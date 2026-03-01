"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveStrategyFocus, type ArchiveReason } from "@/app/actions/strategyFocus";

const REASONS: { value: ArchiveReason; label: string }[] = [
  { value: "target_met", label: "Target gehaald" },
  { value: "alignment_ok", label: "Alignment ok" },
  { value: "alignment_fail", label: "Alignment verloren" },
  { value: "custom", label: "Anders" },
];

type Props = {
  strategyId: string;
};

export function StrategyArchiveCTA({ strategyId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState<ArchiveReason | "">("");
  const [note, setNote] = useState("");
  const [show, setShow] = useState(false);

  function handleArchive() {
    if (!reason) return;
    startTransition(async () => {
      await archiveStrategyFocus(strategyId, reason as ArchiveReason, note.trim() || null);
      router.refresh();
      setShow(false);
      setReason("");
      setNote("");
    });
  }

  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)] px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Strategy afsluiten
      </h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Sluit deze strategie af en bewaar in het archief met een reden.
      </p>
      {!show ? (
        <button
          type="button"
          onClick={() => setShow(true)}
          className="mt-2 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
        >
          Strategy archiveren
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Reden</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ArchiveReason | "")}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="">— Kies —</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Notitie (optioneel)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="bijv. grootste fout of succes"
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleArchive}
              disabled={pending || !reason}
              className="rounded-lg bg-[var(--accent-focus)]/20 px-3 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30 disabled:opacity-50"
            >
              {pending ? "Bezig…" : "Archiveren"}
            </button>
            <button
              type="button"
              onClick={() => { setShow(false); setReason(""); setNote(""); }}
              className="rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/Modal";
import { getEveningNoTaskState, saveNoTaskExplanation, type EveningNoTaskReason } from "@/app/actions/daily-explanations";

const STORAGE_KEY = "neurohq-evening-no-task";
const HOUR_THRESHOLD = 21;

const REASON_OPTIONS: { value: EveningNoTaskReason | ""; label: string }[] = [
  { value: "", label: "— Kies (optioneel)" },
  { value: "no_tasks_added", label: "Geen taken toegevoegd vandaag" },
  { value: "no_tasks_completed", label: "Geen taken afgevinkt vandaag" },
  { value: "both", label: "Beide" },
];

/** After 21:00, if no task added or no task completed today, show once per day and ask for optional explanation (saved to Supabase for ML). */
export function EveningNoTaskModal({ dateStr }: { dateStr: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState<EveningNoTaskReason | "">("");
  const [text, setText] = useState("");
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (now.getHours() < HOUR_THRESHOLD) {
      setChecked(true);
      return;
    }
    const key = `${STORAGE_KEY}-${dateStr}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1") {
        setChecked(true);
        return;
      }
    } catch {
      // ignore
    }
    getEveningNoTaskState(dateStr).then((state) => {
      setChecked(true);
      if (state?.shouldShow) setOpen(true);
    });
  }, [dateStr]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const result = await saveNoTaskExplanation(
      dateStr,
      reason || null,
      text.trim() || null
    );
    setPending(false);
    if (result.ok) {
      try {
        sessionStorage.setItem(`${STORAGE_KEY}-${dateStr}`, "1");
      } catch {
        // ignore
      }
      setOpen(false);
    }
  }

  function handleSkip() {
    try {
      sessionStorage.setItem(`${STORAGE_KEY}-${dateStr}`, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  }

  if (!checked || !open) return null;

  return (
    <Modal
      open={open}
      onClose={handleSkip}
      title="Geen missies vandaag?"
      subtitle={`Het is na ${HOUR_THRESHOLD}:00. Wil je kort aangeven waarom? (optioneel) Dit helpt ons de app beter te maken.`}
      size="sm"
      footer={null}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="evening-reason" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Reden
          </label>
          <select
            id="evening-reason"
            value={reason}
            onChange={(e) => setReason((e.target.value || "") as EveningNoTaskReason | "")}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            {REASON_OPTIONS.map((o) => (
              <option key={o.value || "empty"} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="evening-explanation" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
            Toelichting (optioneel)
          </label>
          <textarea
            id="evening-explanation"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Bijv. drukke dag, vrije dag, vergeten..."
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"
          >
            Overslaan
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--accent-focus)] px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Opslaan…" : "Verstuur"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

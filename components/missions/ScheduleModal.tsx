"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  initialDate: string;
  taskTitle?: string;
  onSchedule: (due_date: string) => void | Promise<void>;
  loading?: boolean;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function nextMonday(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDay();
  const daysToAdd = day === 0 ? 1 : day === 1 ? 7 : 8 - day;
  d.setUTCDate(d.getUTCDate() + daysToAdd);
  return d.toISOString().slice(0, 10);
}

export function ScheduleModal({
  open,
  onClose,
  initialDate,
  taskTitle,
  onSchedule,
  loading = false,
}: Props) {
  const [date, setDate] = useState(initialDate);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSchedule(date);
    onClose();
  }

  const shortcuts = [
    { label: "Today", date: initialDate },
    { label: "Tomorrow", date: addDays(initialDate, 1) },
    { label: "Next Monday", date: nextMonday(initialDate) },
    { label: "Next week", date: addDays(initialDate, 7) },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Schedule" showBranding={false}>
      {taskTitle && <p className="mb-2 text-sm text-[var(--text-muted)]">{taskTitle}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Due date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)]"
          />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Quick</p>
          <div className="flex flex-wrap gap-2">
            {shortcuts.map(({ label, date: d }) => (
              <button
                key={label}
                type="button"
                onClick={() => setDate(d)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  date === d ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">
            {loading ? "…" : "Set date"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

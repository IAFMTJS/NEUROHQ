"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { updateTask } from "@/app/actions/tasks";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type ExtendedTask = {
  id: string;
  title: string;
  due_date: string | null;
  category?: string | null;
  recurrence_rule?: string | null;
  recurrence_weekdays?: string | null;
  impact?: number | null;
  urgency?: number | null;
  energy_required?: number | null;
  priority?: number | null;
  notes?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  task: ExtendedTask;
  onSaved?: () => void;
};

export function EditMissionModal({ open, onClose, task, onSaved }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(task.title);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [category, setCategory] = useState<string>(task.category ?? "");
  const [recurrence, setRecurrence] = useState<string>(task.recurrence_rule ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(
    task.recurrence_weekdays?.trim() ? task.recurrence_weekdays.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= 7) : []
  );
  const [impact, setImpact] = useState<string>(task.impact != null ? String(task.impact) : "");
  const [urgency, setUrgency] = useState<string>(task.urgency != null ? String(task.urgency) : "");
  const [energy, setEnergy] = useState<string>(task.energy_required != null ? String(task.energy_required) : "");
  const [priority, setPriority] = useState<string>(task.priority != null ? String(task.priority) : "");
  const [notes, setNotes] = useState(task.notes ?? "");

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const recurrence_weekdays = recurrence === "weekly" && weekdays.length > 0 ? weekdays.sort((a, b) => a - b).join(",") : null;
    startTransition(async () => {
      try {
        await updateTask(task.id, {
          title: title.trim() || undefined,
          due_date: dueDate || undefined,
          category: category === "work" ? "work" : category === "personal" ? "personal" : null,
          recurrence_rule: recurrence === "daily" ? "daily" : recurrence === "weekly" ? "weekly" : recurrence === "monthly" ? "monthly" : null,
          recurrence_weekdays: recurrence_weekdays ?? null,
          impact: impact ? (parseInt(impact, 10) >= 1 && parseInt(impact, 10) <= 3 ? parseInt(impact, 10) : null) : null,
          urgency: urgency ? (parseInt(urgency, 10) >= 1 && parseInt(urgency, 10) <= 3 ? parseInt(urgency, 10) : null) : null,
          energy_required: energy ? (parseInt(energy, 10) >= 1 && parseInt(energy, 10) <= 10 ? parseInt(energy, 10) : null) : null,
          priority: priority ? (parseInt(priority, 10) >= 1 && parseInt(priority, 10) <= 5 ? parseInt(priority, 10) : null) : null,
          notes: notes.trim() || null,
        });
        onSaved?.();
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit mission" showBranding={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-neuro-muted">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-neuro-muted">Due date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver" />
        </div>
        <div>
          <label className="block text-xs font-medium text-neuro-muted">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver">
            <option value="">—</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-neuro-muted">Recurrence</label>
          <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver">
            <option value="">Once</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        {recurrence === "weekly" && (
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Repeat on (weekdays)</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button key={d} type="button" onClick={() => toggleWeekday(d)} className={`rounded px-2 py-1 text-xs ${weekdays.includes(d) ? "bg-neuro-blue/20 text-neuro-blue" : "bg-neuro-surface text-neuro-muted hover:text-neuro-silver"}`}>
                  {WEEKDAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Impact (1–3)</label>
            <select value={impact} onChange={(e) => setImpact(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              <option value="1">1 Low</option>
              <option value="2">2 Medium</option>
              <option value="3">3 High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Urgency (1–3)</label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              <option value="1">1 Low</option>
              <option value="2">2 Medium</option>
              <option value="3">3 High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Energy (1–10)</label>
            <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Priority (1–5)</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-neuro-muted">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted" placeholder="Optional notes…" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-neuro-border px-4 py-2 text-sm font-medium text-neuro-silver hover:bg-neuro-surface">Cancel</button>
          <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTask } from "@/app/actions/tasks";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  onAdded?: () => void;
};

export function QuickAddModal({ open, onClose, date, onAdded }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(date);
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [impact, setImpact] = useState("");
  const [urgency, setUrgency] = useState("");
  const [energy, setEnergy] = useState("");
  const [mentalLoad, setMentalLoad] = useState("");
  const [socialLoad, setSocialLoad] = useState("");
  const [priority, setPriority] = useState("");
  const [showMore, setShowMore] = useState(false);

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const recurrence_weekdays = recurrence === "weekly" && weekdays.length > 0 ? weekdays.sort((a, b) => a - b).join(",") : null;
    startTransition(async () => {
      try {
        await createTask({
          title: title.trim(),
          due_date: dueDate || date,
          category: category === "work" ? "work" : category === "personal" ? "personal" : null,
          recurrence_rule: recurrence === "daily" ? "daily" : recurrence === "weekly" ? "weekly" : recurrence === "monthly" ? "monthly" : null,
          recurrence_weekdays: recurrence_weekdays ?? null,
          impact: impact ? (parseInt(impact, 10) >= 1 && parseInt(impact, 10) <= 3 ? parseInt(impact, 10) : null) : null,
          urgency: urgency ? (parseInt(urgency, 10) >= 1 && parseInt(urgency, 10) <= 3 ? parseInt(urgency, 10) : null) : null,
          energy_required: energy ? (parseInt(energy, 10) >= 1 && parseInt(energy, 10) <= 10 ? parseInt(energy, 10) : null) : null,
          mental_load: mentalLoad ? (parseInt(mentalLoad, 10) >= 1 && parseInt(mentalLoad, 10) <= 10 ? parseInt(mentalLoad, 10) : null) : null,
          social_load: socialLoad ? (parseInt(socialLoad, 10) >= 1 && parseInt(socialLoad, 10) <= 10 ? parseInt(socialLoad, 10) : null) : null,
          priority: priority ? (parseInt(priority, 10) >= 1 && parseInt(priority, 10) <= 5 ? parseInt(priority, 10) : null) : null,
        });
        setTitle("");
        setDueDate(date);
        setCategory("");
        setRecurrence("");
        setWeekdays([]);
        setImpact("");
        setUrgency("");
        setEnergy("");
        setMentalLoad("");
        setSocialLoad("");
        setPriority("");
        onAdded?.();
        router.refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add");
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Add mission" showBranding={false}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-neuro-muted">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the mission?" className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted" required />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-neuro-muted">Due</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-2.5 py-2 text-sm text-neuro-silver" />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-neuro-muted">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-2.5 py-2 text-sm text-neuro-silver">
              <option value="">—</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-neuro-muted">Recurrence</label>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="mt-1 w-full rounded-lg border border-neuro-border bg-neuro-dark px-2.5 py-2 text-sm text-neuro-silver">
              <option value="">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
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
        <div className="grid grid-cols-1 gap-2 rounded-lg border border-neuro-border/50 bg-neuro-dark/50 p-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Energy (1–10)</label>
            <p className="mt-0.5 text-[10px] text-neuro-muted">Energy cost</p>
            <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Mental load (1–10)</label>
            <p className="mt-0.5 text-[10px] text-neuro-muted">How draining</p>
            <select value={mentalLoad} onChange={(e) => setMentalLoad(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neuro-muted">Social load (1–10)</label>
            <p className="mt-0.5 text-[10px] text-neuro-muted">People/social</p>
            <select value={socialLoad} onChange={(e) => setSocialLoad(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={() => setShowMore((v) => !v)} className="text-xs font-medium text-neuro-muted hover:text-neuro-silver">
          {showMore ? "− Less options" : "+ Impact, urgency, priority"}
        </button>
        {showMore && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-neuro-border/50 bg-neuro-dark/50 p-3">
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
              <label className="block text-xs font-medium text-neuro-muted">Priority (1–5)</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-neuro-border px-4 py-2 text-sm font-medium text-neuro-silver hover:bg-neuro-surface">Cancel</button>
          <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">{pending ? "Adding…" : "Add"}</button>
        </div>
      </form>
    </Modal>
  );
}

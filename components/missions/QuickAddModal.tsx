"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { createTask } from "@/app/actions/tasks";
import type { HeadroomTier } from "@/lib/brain-mode";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type Props = {
  open: boolean;
  onClose: () => void;
  date: string;
  onAdded?: () => void;
  headroomTierToday?: HeadroomTier;
  activeCountToday?: number;
  maxSlotsToday?: number;
  addBlockedToday?: boolean;
};

export function QuickAddModal({ open, onClose, date, onAdded, activeCountToday, maxSlotsToday, addBlockedToday }: Props) {
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
  const [focusRequired, setFocusRequired] = useState("");
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
    const effectiveDate = dueDate || date;
    const slotsFilled =
      typeof maxSlotsToday === "number" && typeof activeCountToday === "number"
        ? activeCountToday >= maxSlotsToday
        : false;
    const limitMessage =
      addBlockedToday && effectiveDate === date
        ? "Mentale belasting te hoog. Vandaag geen nieuwe missies toevoegen; afronden of uit je agenda halen."
        : slotsFilled && effectiveDate === date
          ? "Je hebt je focus slots gevuld. Kies één missie om eerst af te maken of te verplaatsen; dan mag er weer één bij."
          : null;
    if (limitMessage) {
      setError(limitMessage);
      return;
    }
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
          focus_required: focusRequired ? (parseInt(focusRequired, 10) >= 1 && parseInt(focusRequired, 10) <= 10 ? parseInt(focusRequired, 10) : null) : null,
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
        setFocusRequired("");
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
          <label className="block text-xs font-medium text-[var(--text-muted)]">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the mission?" className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]" required />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-[var(--text-muted)]">Due</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm text-[var(--text-primary)]" />
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-[var(--text-muted)]">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm text-[var(--text-primary)]">
              <option value="">—</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
            </select>
          </div>
          <div className="flex-1 min-w-[100px]">
            <label className="block text-xs font-medium text-[var(--text-muted)]">Recurrence</label>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-2.5 py-2 text-sm text-[var(--text-primary)]">
              <option value="">Once</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        {recurrence === "weekly" && (
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Repeat on (weekdays)</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <button key={d} type="button" onClick={() => toggleWeekday(d)} className={`rounded px-2 py-1 text-xs ${weekdays.includes(d) ? "bg-[var(--accent-focus)]/20 text-[var(--accent-focus)]" : "bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                  {WEEKDAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-[10px] text-[var(--text-muted)]">Brain circles: energy, focus en mentale belasting bepalen hoeveel taken vandaag passen.</p>
        <div className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-primary)]/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Energy (1–10)</label>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Energy cost</p>
            <select value={energy} onChange={(e) => setEnergy(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Focus (1–10)</label>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Focus needed</p>
            <select value={focusRequired} onChange={(e) => setFocusRequired(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Mentale belasting (1–10)</label>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Mentale/cognitieve belasting</p>
            <select value={mentalLoad} onChange={(e) => setMentalLoad(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)]">Social load (1–10)</label>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">People/social</p>
            <select value={socialLoad} onChange={(e) => setSocialLoad(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" onClick={() => setShowMore((v) => !v)} className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          {showMore ? "− Less options" : "+ Impact, urgency, priority"}
        </button>
        {showMore && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-primary)]/50 p-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Impact (1–3)</label>
              <select value={impact} onChange={(e) => setImpact(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                <option value="">—</option>
                <option value="1">1 Low</option>
                <option value="2">2 Medium</option>
                <option value="3">3 High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Urgency (1–3)</label>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                <option value="">—</option>
                <option value="1">1 Low</option>
                <option value="2">2 Medium</option>
                <option value="3">3 High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)]">Priority (1–5)</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded border border-[var(--card-border)] bg-[var(--bg-primary)] px-2 py-1.5 text-sm text-[var(--text-primary)]">
                <option value="">—</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium">Cancel</button>
          <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50">{pending ? "Adding…" : "Add"}</button>
        </div>
      </form>
    </Modal>
  );
}

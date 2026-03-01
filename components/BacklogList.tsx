"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTask, deleteTask } from "@/app/actions/tasks";
import { ScheduleModal, EditMissionModal } from "@/components/missions";
import { Modal } from "@/components/Modal";

type BacklogTask = {
  id: string;
  title: string | null;
  due_date: string | null;
  category?: string | null;
  recurrence_rule?: string | null;
  recurrence_weekdays?: string | null;
  impact?: number | null;
  urgency?: number | null;
  energy_required?: number | null;
  focus_required?: number | null;
  mental_load?: number | null;
  social_load?: number | null;
  priority?: number | null;
  notes?: string | null;
};

type SortKey = "date-asc" | "date-desc" | "title" | "category";
type ScopeFilter = "all" | "backlog" | "future";

type Props = { backlog: BacklogTask[]; todayDate: string };

export function BacklogList({ backlog, todayDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scheduleTask, setScheduleTask] = useState<BacklogTask | null>(null);
  const [editTask, setEditTask] = useState<BacklogTask | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortKey>("date-asc");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

  const categories = Array.from(new Set(backlog.map((t) => t.category ?? "").filter(Boolean))).sort();
  let filtered = backlog
    .filter((t) => !search.trim() || (t.title ?? "").toLowerCase().includes(search.trim().toLowerCase()))
    .filter((t) => !categoryFilter || (t.category ?? "") === categoryFilter)
    .filter((t) => {
      if (scopeFilter === "backlog") return !t.due_date;
      if (scopeFilter === "future") return t.due_date != null && t.due_date > todayDate;
      return true;
    });
  if (sortBy === "date-asc") filtered = [...filtered].sort((a, b) => (a.due_date ?? "9999-99-99").localeCompare(b.due_date ?? "9999-99-99"));
  else if (sortBy === "date-desc") filtered = [...filtered].sort((a, b) => (b.due_date ?? "").localeCompare(a.due_date ?? "9999-99-99"));
  else if (sortBy === "title") filtered = [...filtered].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  else if (sortBy === "category") filtered = [...filtered].sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
  const displayLimit = showAll ? filtered.length : 25;
  const displayList = filtered.slice(0, displayLimit);
  const hasMore = filtered.length > displayLimit;

  function handleMoveToToday(id: string) {
    startTransition(async () => {
      await rescheduleTask(id, todayDate);
      router.refresh();
    });
  }

  function handleSchedule(date: string) {
    if (!scheduleTask) return;
    startTransition(async () => {
      await rescheduleTask(scheduleTask.id, date);
      setScheduleTask(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTask(id);
      setDeleteConfirmId(null);
      router.refresh();
    });
  }

  return (
    <section className="card-simple overflow-hidden p-0">
      <div className="border-b border-[var(--card-border)] px-4 py-3">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Backlog & toekomst</h2>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Taken zonder datum of na vandaag. Verplaats naar vandaag, plan in, bewerk of verwijder.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Zoeken…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[120px] flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            aria-label="Zoek in backlog"
          />
          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            aria-label="Backlog of toekomst"
          >
            <option value="all">Alles</option>
            <option value="backlog">Alleen backlog (geen datum)</option>
            <option value="future">Alleen toekomst</option>
          </select>
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
              aria-label="Filter op categorie"
            >
              <option value="">Alle categorieën</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)]/30"
            aria-label="Sorteren"
          >
            <option value="date-asc">Datum (oudste eerst)</option>
            <option value="date-desc">Datum (nieuwste eerst)</option>
            <option value="title">Titel A–Z</option>
            <option value="category">Categorie</option>
          </select>
        </div>
      </div>
      <ul className="divide-y divide-[var(--card-border)]">
        {backlog.length > 0 && displayList.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium text-[var(--text-primary)]">{t.title}</span>
              {t.due_date && <span className="ml-2 text-xs text-[var(--text-muted)]">— {t.due_date}</span>}
              {t.category && (
                <span className="ml-2 rounded bg-[var(--bg-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                  {t.category}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setEditTask(t)}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                Bewerken
              </button>
              <button
                type="button"
                onClick={() => handleMoveToToday(t.id)}
                disabled={pending}
                className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/10 disabled:opacity-50"
              >
                Naar vandaag
              </button>
              <button
                type="button"
                onClick={() => setScheduleTask(t)}
                className="rounded-lg px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
              >
                Inplannen
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmId(t.id)}
                className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
              >
                Verwijderen
              </button>
            </div>
          </li>
        ))}
      </ul>
      {backlog.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[var(--text-muted)]">Geen backlog.</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Alle taken zijn gepland. Voeg taken toe op Missions en laat de datum leeg voor de backlog.</p>
        </div>
      )}
      {backlog.length > 0 && filtered.length === 0 && (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">Geen taken voor deze zoek- of categorie-filter.</p>
        </div>
      )}
      {hasMore && (
        <div className="border-t border-[var(--card-border)] px-4 py-3">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-sm font-medium text-[var(--accent-focus)] hover:underline"
          >
            Toon alle {filtered.length} taken
          </button>
        </div>
      )}
      {showAll && filtered.length > 25 && (
        <p className="px-4 py-2 text-xs text-[var(--text-muted)]">{filtered.length} taken getoond</p>
      )}
      {scheduleTask && (
        <ScheduleModal
          open={!!scheduleTask}
          onClose={() => setScheduleTask(null)}
          initialDate={scheduleTask.due_date ?? todayDate}
          taskTitle={scheduleTask.title ?? undefined}
          onSchedule={handleSchedule}
          loading={pending}
        />
      )}
      {editTask && (
        <EditMissionModal
          open={!!editTask}
          onClose={() => setEditTask(null)}
          task={editTask}
          onSaved={() => { setEditTask(null); router.refresh(); }}
        />
      )}
      {deleteConfirmId && (
        <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Taak verwijderen?" size="sm">
          <p className="text-sm text-[var(--text-muted)]">Deze taak wordt definitief verwijderd.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => setDeleteConfirmId(null)} className="flex-1 rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm font-medium">Annuleren</button>
            <button type="button" onClick={() => handleDelete(deleteConfirmId)} disabled={pending} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50">Verwijderen</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

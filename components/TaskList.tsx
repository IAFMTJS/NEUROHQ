"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeTask, createTask, deleteTask, duplicateTask, snoozeTask, uncompleteTask } from "@/app/actions/tasks";
import type { Task } from "@/types/database.types";
import type { SubtaskRow } from "@/app/actions/tasks";
import { nextRecurrenceDates, formatShortDate } from "@/lib/utils/recurrence";
import {
  ConfirmModal,
  ScheduleModal,
  EditMissionModal,
  TaskDetailsModal,
  FocusModal,
  QuickAddModal,
} from "@/components/missions";

const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat", 7: "Sun" };

type ExtendedTask = Task & {
  category?: string | null;
  recurrence_rule?: string | null;
  recurrence_weekdays?: string | null;
  impact?: number | null;
  urgency?: number | null;
  notes?: string | null;
};

type Props = {
  date: string;
  tasks: Task[];
  completedToday: Task[];
  mode: "normal" | "low_energy" | "stabilize" | "driven";
  carryOverCount: number;
  subtasksByParent?: Record<string, SubtaskRow[]>;
};

function recurrenceLabel(task: ExtendedTask): string {
  if (!task.recurrence_rule) return "";
  if (task.recurrence_rule === "daily") return "daily";
  if (task.recurrence_rule === "monthly") return "monthly";
  if (task.recurrence_rule === "weekly" && task.recurrence_weekdays?.trim()) {
    const days = task.recurrence_weekdays.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => n >= 1 && n <= 7);
    if (days.length) return "weekly (" + days.map((d) => WEEKDAY_LABELS[d] ?? d).join(", ") + ")";
  }
  return "weekly";
}

function groupByCategory(tasks: ExtendedTask[]): { work: ExtendedTask[]; personal: ExtendedTask[]; other: ExtendedTask[] } {
  const work: ExtendedTask[] = [];
  const personal: ExtendedTask[] = [];
  const other: ExtendedTask[] = [];
  for (const t of tasks) {
    if (t.category === "work") work.push(t);
    else if (t.category === "personal") personal.push(t);
    else other.push(t);
  }
  return { work, personal, other };
}

export function TaskList({ date, tasks: initialTasks, completedToday, mode, carryOverCount, subtasksByParent = {} }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addDueDate, setAddDueDate] = useState(date);
  const [addError, setAddError] = useState<string | null>(null);
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [showRoutine, setShowRoutine] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [filter, setFilter] = useState<"all" | "work" | "personal" | "recurring">("all");
  const [detailsTask, setDetailsTask] = useState<ExtendedTask | null>(null);
  const [editTask, setEditTask] = useState<ExtendedTask | null>(null);
  const [focusTask, setFocusTask] = useState<ExtendedTask | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const extendedTasks = initialTasks as ExtendedTask[];
  const filteredTasks =
    filter === "all"
      ? extendedTasks
      : filter === "work"
        ? extendedTasks.filter((t) => t.category === "work")
        : filter === "personal"
          ? extendedTasks.filter((t) => t.category === "personal")
          : extendedTasks.filter((t) => !!t.recurrence_rule);
  const { work, personal, other } = groupByCategory(filteredTasks);
  const sections = [
    { label: "Work", tasks: work },
    { label: "Personal", tasks: personal },
    { label: "Other", tasks: other },
  ];
  const sectionsToShow = sections.some((s) => s.tasks.length > 0) ? sections : [{ label: "Today", tasks: extendedTasks }];
  const flatIncompleteOrder: string[] = [];
  for (const s of sectionsToShow) {
    for (const t of s.tasks) {
      if (!t.completed) flatIncompleteOrder.push(t.id);
    }
  }
  const firstIncompleteId = flatIncompleteOrder[0] ?? null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "n" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setQuickAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleComplete(id: string) {
    startTransition(async () => {
      try {
        await completeTask(id);
        router.refresh();
      } catch {
        // error surfaced by action throw
      }
    });
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id);
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    await deleteTask(confirmDeleteId);
    setConfirmDeleteId(null);
    router.refresh();
  }

  function handleDuplicate(task: ExtendedTask) {
    startTransition(async () => {
      await duplicateTask(task.id, date);
      router.refresh();
    });
  }

  function handleSnooze(id: string) {
    startTransition(async () => {
      await snoozeTask(id);
      router.refresh();
    });
  }

  function handleUncomplete(id: string) {
    startTransition(async () => {
      await uncompleteTask(id);
      router.refresh();
    });
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement)?.value?.trim();
    const category = (form.elements.namedItem("category") as HTMLSelectElement)?.value as "" | "work" | "personal";
    const recurrence = (form.elements.namedItem("recurrence") as HTMLSelectElement)?.value as "" | "daily" | "weekly" | "monthly";
    const dueDateInput = (form.elements.namedItem("due_date") as HTMLInputElement)?.value;
    const dueDate = dueDateInput?.trim() || date;
    const impactRaw = (form.elements.namedItem("impact") as HTMLSelectElement)?.value;
    const urgencyRaw = (form.elements.namedItem("urgency") as HTMLSelectElement)?.value;
    const energyRaw = (form.elements.namedItem("energy") as HTMLSelectElement)?.value;
    const priorityRaw = (form.elements.namedItem("priority") as HTMLSelectElement)?.value;
    const impact = impactRaw ? parseInt(impactRaw, 10) : null;
    const urgency = urgencyRaw ? parseInt(urgencyRaw, 10) : null;
    const energy = energyRaw ? parseInt(energyRaw, 10) : null;
    const priority = priorityRaw ? parseInt(priorityRaw, 10) : null;
    const recurrence_weekdays = recurrence === "weekly" && weekdays.length > 0 ? weekdays.sort((a, b) => a - b).join(",") : null;
    if (!title) return;
    startTransition(async () => {
      try {
        await createTask({
          title,
          due_date: dueDate,
          category: category === "work" ? "work" : category === "personal" ? "personal" : null,
          recurrence_rule: recurrence === "daily" ? "daily" : recurrence === "weekly" ? "weekly" : recurrence === "monthly" ? "monthly" : null,
          recurrence_weekdays: recurrence_weekdays ?? null,
          impact: impact && impact >= 1 && impact <= 3 ? impact : null,
          urgency: urgency && urgency >= 1 && urgency <= 3 ? urgency : null,
          energy_required: energy && energy >= 1 && energy <= 10 ? energy : null,
          priority: priority && priority >= 1 && priority <= 5 ? priority : null,
        });
        form.reset();
        setAddDueDate(date);
        setWeekdays([]);
        setShowRoutine(false);
        router.refresh();
      } catch (err) {
        setAddError(err instanceof Error ? err.message : "Failed to add task");
      }
    });
  }

  function handleAddSubtask(parentId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubtaskError(null);
    const form = e.currentTarget;
    const title = (form.elements.namedItem("subtask-title") as HTMLInputElement)?.value?.trim();
    if (!title) return;
    startTransition(async () => {
      try {
        await createTask({ title, due_date: date, parent_task_id: parentId });
        form.reset();
        router.refresh();
      } catch (err) {
        setSubtaskError(err instanceof Error ? err.message : "Failed to add subtask");
      }
    });
  }

  function toggleWeekday(d: number) {
    setWeekdays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)));
  }

  const canAdd = mode !== "stabilize";
  const showAvoidance = carryOverCount >= 3 && carryOverCount < 5;

  function recurrencePreview(task: ExtendedTask): string {
    if (!task.recurrence_rule || !task.due_date) return "";
    const next = nextRecurrenceDates(task.due_date, task.recurrence_rule, task.recurrence_weekdays, 3);
    if (next.length === 0) return "";
    return "Next: " + next.map(formatShortDate).join(", ");
  }

  function renderTask(task: ExtendedTask, isFirstIncomplete: boolean) {
    const subtasks = subtasksByParent[task.id] ?? [];
    const preview = recurrencePreview(task);
    return (
      <li key={task.id} className="space-y-1">
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; setDetailsTask(task); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDetailsTask(task); } }}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
            task.completed
              ? "border-neuro-border bg-neuro-surface/50 opacity-70"
              : task.carry_over_count > 0
                ? "border-amber-500/50 bg-amber-500/10"
                : isFirstIncomplete
                  ? "border-neuro-blue/50 bg-neuro-blue/5"
                  : "border-neuro-border bg-neuro-surface/50"
          }`}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); if (!task.completed) handleComplete(task.id); }}
            disabled={pending || task.completed}
            className={`h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${
              task.completed ? "border-green-500 bg-green-500/20 text-green-400" : "border-neutral-500 bg-transparent hover:border-neuro-blue hover:bg-neuro-blue/20 text-transparent"
            } disabled:opacity-50`}
            aria-label={task.completed ? "Completed" : "Complete task"}
          >
            {task.completed && <span className="text-sm">✓</span>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isFirstIncomplete && !task.completed && (
                <span className="rounded bg-neuro-blue/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neuro-blue">Today&apos;s mission</span>
              )}
              {task.carry_over_count > 0 && !task.completed && (
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Carried over</span>
              )}
              {task.category && (
                <span className="rounded bg-neuro-surface px-1.5 py-0.5 text-[10px] font-medium text-neuro-muted">{task.category}</span>
              )}
              {task.energy_required != null && (
                <span className="rounded bg-[var(--accent-energy)]/20 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent-energy)]" title="Energy cost">⚡{task.energy_required}</span>
              )}
              <span className={`text-sm text-neuro-silver ${task.completed ? "line-through text-neuro-muted" : ""}`}>{task.title}</span>
            </div>
            {recurrenceLabel(task) && <p className="mt-0.5 text-xs text-neuro-muted">{recurrenceLabel(task)}</p>}
            {preview && <p className="mt-0.5 text-[10px] text-neuro-muted">{preview}</p>}
          </div>
          {isFirstIncomplete && !task.completed && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setFocusTask(task); }} className="rounded-lg px-2 py-1 text-xs font-medium text-neuro-blue hover:bg-neuro-blue/10">
              Focus
            </button>
          )}
          {!task.completed && (
            <button type="button" onClick={(e) => { e.stopPropagation(); handleSnooze(task.id); }} disabled={pending} className="rounded-lg px-2 py-1 text-xs text-neuro-muted hover:bg-neuro-blue/10 hover:text-neuro-blue">
              Snooze
            </button>
          )}
          <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} disabled={pending} className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-red-500/10 hover:text-red-400">
            Delete
          </button>
        </div>
        {subtasks.length > 0 && (
          <ul className="ml-9 space-y-1 border-l-2 border-white/10 pl-3">
            {subtasks.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm">
                <button type="button" onClick={() => !s.completed && startTransition(() => completeTask(s.id))} disabled={pending || s.completed} className="h-4 w-4 shrink-0 rounded border border-neutral-500" aria-label={s.completed ? "Completed" : "Complete subtask"}>
                  {s.completed && <span className="text-xs">✓</span>}
                </button>
                <span className={s.completed ? "line-through text-neutral-500" : "text-neutral-400"}>{s.title}</span>
              </li>
            ))}
          </ul>
        )}
        {subtaskError && <p className="ml-9 mt-1 text-xs text-red-400" role="alert">{subtaskError}</p>}
        {canAdd && (
          <form onSubmit={(e) => handleAddSubtask(task.id, e)} className="ml-9 flex gap-2">
            <input name="subtask-title" type="text" placeholder="Add subtask…" className="flex-1 rounded-lg border border-white/10 bg-neuro-dark px-2 py-1 text-xs text-white placeholder-neutral-500" />
            <button type="submit" disabled={pending} className="rounded-lg px-2 py-1 text-xs text-neuro-blue">Add</button>
          </form>
        )}
      </li>
    );
  }

  return (
    <div className="card-modern overflow-hidden p-0">
      <div className="border-b border-neuro-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neuro-silver">Today&apos;s missions</h2>
          {mode === "stabilize" && <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">Stabilize mode</span>}
        </div>
      </div>
      <div className="p-4">
        {showAvoidance && (
          <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{carryOverCount} tasks carried over. Pick one to focus on.</p>
        )}

        {filteredTasks.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {(["all", "work", "personal", "recurring"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  filter === f ? "bg-neuro-blue/20 text-neuro-blue" : "border border-neuro-border text-neuro-muted hover:bg-neuro-surface hover:text-neuro-silver"
                }`}
              >
                {f === "all" ? "All" : f === "work" ? "Work" : f === "personal" ? "Personal" : "Recurring"}
              </button>
            ))}
          </div>
        )}

        {initialTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neuro-border bg-neuro-surface/50 px-3 py-5 text-center text-sm text-neuro-muted">No missions for today. Add one below, move from backlog, or enjoy the space.</p>
        ) : (
          sectionsToShow.map((section) => (
            <div key={section.label} className={section.label !== "Today" ? "mb-4" : ""}>
              {section.label !== "Today" && <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neuro-muted">{section.label}</h3>}
              {section.tasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-neuro-border/50 bg-neuro-surface/30 px-3 py-4 text-center text-xs text-neuro-muted">
                  No {section.label.toLowerCase()} missions today. Add one or move from backlog.
                </p>
              ) : (
                <ul className="space-y-2">
                  {section.tasks.map((t) => {
                    const isFirstIncomplete = !t.completed && firstIncompleteId === t.id;
                    return renderTask(t, isFirstIncomplete);
                  })}
                </ul>
              )}
            </div>
          ))
        )}

        {addError && <p className="mt-2 text-sm text-red-400" role="alert">{addError}</p>}

        {canAdd && (
          <div className="mt-4 rounded-xl border border-neuro-border bg-neuro-surface/30 p-4">
            <button type="button" onClick={() => setShowRoutine((v) => !v)} className="mb-2 text-xs font-medium text-neuro-muted hover:text-neuro-silver">
              {showRoutine ? "− Simple form" : "+ Routine & options (category, weekly days, impact)"}
            </button>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <input name="title" type="text" placeholder="Add a mission…" className="flex-1 min-w-[140px] rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-2 focus:ring-neuro-blue/30" required />
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neuro-muted">Due</span>
                  <input name="due_date" type="date" value={addDueDate} onChange={(e) => setAddDueDate(e.target.value)} className="rounded-lg border border-neuro-border bg-neuro-dark px-2.5 py-2 text-sm text-neuro-silver" aria-label="Due date" />
                </label>
                <select name="category" className="rounded-lg border border-neuro-border bg-neuro-dark px-2 py-2.5 text-sm text-neuro-silver" aria-label="Category">
                  <option value="">Category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                </select>
                <select name="recurrence" className="rounded-lg border border-neuro-border bg-neuro-dark px-2 py-2.5 text-sm text-neuro-silver" aria-label="Recurrence">
                  <option value="">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-neuro-muted">Energy</span>
                  <select name="energy" className="rounded-lg border border-neuro-border bg-neuro-dark px-2 py-2.5 text-sm text-neuro-silver" aria-label="Energy (1-10)">
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <button type="submit" disabled={pending} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">Add</button>
              </div>
              {showRoutine && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border border-neuro-border/50 bg-neuro-dark/50 p-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-neuro-muted">Repeat on (weekly)</label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                        <button key={d} type="button" onClick={() => toggleWeekday(d)} className={`rounded px-2 py-1 text-xs ${weekdays.includes(d) ? "bg-neuro-blue/20 text-neuro-blue" : "bg-neuro-surface text-neuro-muted hover:text-neuro-silver"}`}>
                          {WEEKDAY_LABELS[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neuro-muted">Impact (1–3)</span>
                    <select name="impact" className="rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
                      <option value="">—</option>
                      <option value="1">1 Low</option>
                      <option value="2">2 Medium</option>
                      <option value="3">3 High</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-neuro-muted">Urgency (1–3)</span>
                    <select name="urgency" className="rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
                      <option value="">—</option>
                      <option value="1">1 Low</option>
                      <option value="2">2 Medium</option>
                      <option value="3">3 High</option>
                    </select>
                  </label>
                  <div className="flex gap-2">
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-xs font-medium text-neuro-muted">Energy (1–10)</span>
                      <select name="energy" className="rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-1 flex-col gap-1">
                      <span className="text-xs font-medium text-neuro-muted">Priority (1–5)</span>
                      <select name="priority" className="rounded border border-neuro-border bg-neuro-dark px-2 py-1.5 text-sm text-neuro-silver">
                        <option value="">—</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
        {!canAdd && <p className="mt-2 text-xs text-neuro-muted">Finish or reschedule the 2 tasks above before adding more.</p>}

        {canAdd && (
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => setQuickAddOpen(true)} className="rounded-full bg-neuro-blue px-4 py-2 text-sm font-medium text-white hover:bg-neuro-blue/90">
              + Add mission (N)
            </button>
          </div>
        )}

        {detailsTask && (
          <TaskDetailsModal
            open={!!detailsTask}
            onClose={() => setDetailsTask(null)}
            task={detailsTask}
            subtasks={subtasksByParent[detailsTask.id]}
            onEdit={() => { setDetailsTask(null); setEditTask(detailsTask); }}
            onDuplicate={() => { handleDuplicate(detailsTask); setDetailsTask(null); }}
            onDelete={() => { setDetailsTask(null); setConfirmDeleteId(detailsTask.id); }}
          />
        )}
        {editTask && (
          <EditMissionModal open={!!editTask} onClose={() => setEditTask(null)} task={editTask} onSaved={() => setEditTask(null)} />
        )}
        {focusTask && (
          <FocusModal open={!!focusTask} onClose={() => setFocusTask(null)} taskId={focusTask.id} taskTitle={focusTask.title} onComplete={() => setFocusTask(null)} onSnooze={() => setFocusTask(null)} />
        )}
        <ConfirmModal
          open={!!confirmDeleteId}
          onClose={() => setConfirmDeleteId(null)}
          title="Delete mission?"
          message="This cannot be undone."
          confirmLabel="Delete"
          danger
          onConfirm={handleConfirmDelete}
        />
        <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} date={date} onAdded={() => setQuickAddOpen(false)} />

        {completedToday.length > 0 && (
          <div className="mt-6 border-t border-neuro-border pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neuro-muted">Done today</h3>
            <ul className="space-y-1">
              {(completedToday as ExtendedTask[]).map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-lg border border-neuro-border/50 bg-neuro-surface/30 px-3 py-2 text-sm text-neuro-muted line-through">
                  <button
                    type="button"
                    onClick={() => handleUncomplete(t.id)}
                    disabled={pending}
                    className="h-6 w-6 shrink-0 rounded-lg border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-green-400 hover:bg-green-500/30 hover:border-green-400 disabled:opacity-50"
                    aria-label="Mark incomplete"
                    title="Mark incomplete (e.g. if done by accident)"
                  >
                    <span className="text-sm">✓</span>
                  </button>
                  {t.title}
                  {t.category && <span className="rounded bg-neuro-surface px-1.5 py-0.5 text-[10px]">{t.category}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

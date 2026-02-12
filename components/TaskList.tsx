"use client";

import { useTransition } from "react";
import { completeTask, createTask, deleteTask, snoozeTask } from "@/app/actions/tasks";
import type { Task } from "@/types/database.types";
import type { SubtaskRow } from "@/app/actions/tasks";

type Props = {
  date: string;
  tasks: Task[];
  mode: "normal" | "low_energy" | "stabilize" | "driven";
  carryOverCount: number;
  subtasksByParent?: Record<string, SubtaskRow[]>;
};

export function TaskList({ date, tasks: initialTasks, mode, carryOverCount, subtasksByParent = {} }: Props) {
  const [pending, startTransition] = useTransition();

  function handleComplete(id: string) {
    startTransition(() => completeTask(id));
  }

  function handleDelete(id: string) {
    if (confirm("Delete this task?")) startTransition(() => deleteTask(id));
  }

  function handleSnooze(id: string) {
    startTransition(() => snoozeTask(id));
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement)?.value?.trim();
    const recurrence = (form.elements.namedItem("recurrence") as HTMLSelectElement)?.value as "" | "daily" | "weekly";
    if (!title) return;
    startTransition(async () => {
      await createTask({
        title,
        due_date: date,
        recurrence_rule: recurrence === "daily" ? "daily" : recurrence === "weekly" ? "weekly" : null,
      });
      form.reset();
    });
  }

  function handleAddSubtask(parentId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("subtask-title") as HTMLInputElement)?.value?.trim();
    if (!title) return;
    startTransition(async () => {
      await createTask({ title, due_date: date, parent_task_id: parentId });
      form.reset();
    });
  }

  const canAdd = mode !== "stabilize";
  const showAvoidance = carryOverCount >= 3 && carryOverCount < 5;

  return (
    <div className="card-modern p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neuro-silver">Today&apos;s tasks</h2>
        {mode === "stabilize" && (
          <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-200">
            Stabilize mode
          </span>
        )}
      </div>

      {showAvoidance && (
        <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {carryOverCount} tasks carried over. Pick one to focus on.
        </p>
      )}

      <ul className="space-y-2">
        {initialTasks.length === 0 ? (
          <li className="rounded-lg border border-dashed border-neuro-border bg-neuro-surface/50 px-3 py-5 text-center text-sm text-neuro-muted">
            No tasks for today. Add one below to get started.
          </li>
        ) : (
          initialTasks.map((t) => {
            const task = t as Task & { recurrence_rule?: string | null };
            const subtasks = subtasksByParent[task.id] ?? [];
            return (
              <li key={task.id} className="space-y-1">
                <div
                  className={`flex items-center gap-3 rounded-lg border border-neuro-border bg-neuro-surface/50 px-3 py-2.5 ${task.completed ? "opacity-70" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => !task.completed && handleComplete(task.id)}
                    disabled={pending || task.completed}
                    className={`h-6 w-6 shrink-0 rounded-lg border-2 flex items-center justify-center ${
                      task.completed ? "border-green-500 bg-green-500/20 text-green-400" : "border-neutral-500 bg-transparent hover:border-neuro-blue hover:bg-neuro-blue/20 text-transparent"
                    } disabled:opacity-50`}
                    aria-label={task.completed ? "Completed" : "Complete task"}
                  >
                    {task.completed && <span className="text-sm">✓</span>}
                  </button>
                  <span className={`flex-1 text-sm text-neuro-silver ${task.completed ? "line-through text-neuro-muted" : ""}`}>
                    {task.title}
                    {task.recurrence_rule && (
                      <span className="ml-2 text-xs text-neuro-muted">({task.recurrence_rule})</span>
                    )}
                  </span>
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={() => handleSnooze(task.id)}
                      disabled={pending}
                      className="rounded-lg px-2 py-1 text-xs text-neuro-muted hover:bg-neuro-blue/10 hover:text-neuro-blue"
                    >
                      Snooze
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    disabled={pending}
                    className="rounded-lg px-2 py-1 text-xs text-neutral-500 hover:bg-red-500/10 hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                {subtasks.length > 0 && (
                  <ul className="ml-9 space-y-1 border-l-2 border-white/10 pl-3">
                    {subtasks.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => !s.completed && startTransition(() => completeTask(s.id))}
                          disabled={pending || s.completed}
                          className="h-4 w-4 shrink-0 rounded border border-neutral-500"
                          aria-label={s.completed ? "Completed" : "Complete subtask"}
                        >
                          {s.completed && <span className="text-xs">✓</span>}
                        </button>
                        <span className={s.completed ? "line-through text-neutral-500" : "text-neutral-400"}>{s.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {canAdd && (
                  <form onSubmit={(e) => handleAddSubtask(task.id, e)} className="ml-9 flex gap-2">
                    <input
                      name="subtask-title"
                      type="text"
                      placeholder="Add subtask…"
                      className="flex-1 rounded-lg border border-white/10 bg-neuro-dark px-2 py-1 text-xs text-white placeholder-neutral-500"
                    />
                    <button type="submit" disabled={pending} className="rounded-lg px-2 py-1 text-xs text-neuro-blue">
                      Add
                    </button>
                  </form>
                )}
              </li>
            );
          })
        )}
      </ul>

      {canAdd && (
        <form onSubmit={handleAdd} className="mt-3 flex flex-wrap gap-2">
          <input
            name="title"
            type="text"
            placeholder="Add a task…"
            className="flex-1 min-w-[120px] rounded-lg border border-neuro-border bg-neuro-dark px-3 py-2.5 text-sm text-neuro-silver placeholder-neuro-muted focus:border-neuro-blue focus:outline-none focus:ring-1 focus:ring-neuro-blue"
            required
          />
          <select
            name="recurrence"
            className="rounded-lg border border-neuro-border bg-neuro-dark px-2 py-2.5 text-sm text-neuro-silver"
            aria-label="Recurrence"
          >
            <option value="">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className="btn-primary rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:transform-none"
          >
            Add
          </button>
        </form>
      )}
      {!canAdd && (
        <p className="mt-2 text-xs text-neutral-500">
          Finish or reschedule the 2 tasks above before adding more.
        </p>
      )}
    </div>
  );
}

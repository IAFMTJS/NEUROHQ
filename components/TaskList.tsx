"use client";

import { useTransition } from "react";
import { completeTask, createTask, deleteTask } from "@/app/actions/tasks";
import type { Task } from "@/types/database.types";

type Props = {
  date: string;
  tasks: Task[];
  mode: "normal" | "low_energy" | "stabilize";
  carryOverCount: number;
};

export function TaskList({ date, tasks: initialTasks, mode, carryOverCount }: Props) {
  const [pending, startTransition] = useTransition();

  function handleComplete(id: string) {
    startTransition(() => completeTask(id));
  }

  function handleDelete(id: string) {
    if (confirm("Delete this task?")) startTransition(() => deleteTask(id));
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement)?.value?.trim();
    if (!title) return;
    startTransition(async () => {
      await createTask({ title, due_date: date });
      form.reset();
    });
  }

  const canAdd = mode !== "stabilize";
  const showAvoidance = carryOverCount >= 3 && carryOverCount < 5;

  return (
    <div className="rounded-lg border border-neutral-700 bg-neuro-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-neuro-silver">Today&apos;s tasks</h2>
        {mode === "stabilize" && (
          <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs text-amber-200">
            Stabilize mode
          </span>
        )}
      </div>

      {showAvoidance && (
        <p className="mb-3 rounded border border-amber-700/50 bg-amber-900/20 px-3 py-2 text-sm text-amber-200">
          {carryOverCount} tasks carried over. Pick one to focus on.
        </p>
      )}

      <ul className="space-y-2">
        {initialTasks.length === 0 ? (
          <li className="text-sm text-neutral-500">No tasks for today.</li>
        ) : (
          initialTasks.map((t) => (
            <li
              key={t.id}
              className={`flex items-center gap-3 rounded border border-neutral-700 bg-neuro-dark px-3 py-2 ${t.completed ? "opacity-70" : ""}`}
            >
              <button
                type="button"
                onClick={() => !t.completed && handleComplete(t.id)}
                disabled={pending || t.completed}
                className={`h-5 w-5 shrink-0 rounded border ${
                  t.completed ? "border-green-600 bg-green-600" : "border-neutral-500 bg-transparent hover:border-neuro-blue hover:bg-neuro-blue/20"
                } disabled:opacity-50`}
                aria-label={t.completed ? "Completed" : "Complete task"}
              >
                {t.completed && <span className="block text-center text-xs text-white">✓</span>}
              </button>
              <span className={`flex-1 text-sm text-neuro-silver ${t.completed ? "line-through text-neutral-500" : ""}`}>
                {t.title}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(t.id)}
                disabled={pending}
                className="text-xs text-neutral-500 hover:text-red-400"
              >
                Delete
              </button>
            </li>
          ))
        )}
      </ul>

      {canAdd && (
        <form onSubmit={handleAdd} className="mt-3 flex gap-2">
          <input
            name="title"
            type="text"
            placeholder="Add a task…"
            className="flex-1 rounded border border-neutral-600 bg-neuro-dark px-3 py-2 text-sm text-white placeholder-neutral-500 focus:border-neuro-blue focus:outline-none"
            required
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-neuro-blue px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
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

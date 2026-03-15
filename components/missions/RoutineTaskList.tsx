"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { rescheduleTask } from "@/app/actions/tasks";
import type { Task } from "@/types/database.types";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type Props = {
  routineTasks: Task[];
  suggestedDays: Record<string, string[]>;
  dateStr: string;
};

export function RoutineTaskList({ routineTasks, suggestedDays, dateStr }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (routineTasks.length === 0) {
    return (
      <div className="card-simple p-4">
        <p className="text-sm text-[var(--text-muted)]">
          Geen routine-taken. Voeg een taak toe met herhaling &quot;wekelijks&quot; of &quot;maandelijks&quot; om die hier te zien. De app stelt dan de beste dagen voor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)]">
        Taken die je minstens 1x per week of per maand wilt doen. Plan ze op een voorgestelde dag.
      </p>
      <ul className="space-y-3">
        {routineTasks.map((task) => {
          const suggested = suggestedDays[task.id] ?? [];
          const recurrence = (task as { recurrence_rule?: string | null }).recurrence_rule ?? "monthly";
          return (
            <li key={task.id} className="card-simple p-4">
              <div className="flex flex-col gap-2">
                <span className="font-medium text-[var(--text-primary)]">{task.title ?? "Taak"}</span>
                <span className="text-xs text-[var(--text-muted)]">
                  {recurrence === "weekly" ? "Wekelijks" : "Maandelijks"}
                  {suggested.length > 0 && ` · Beste dagen: ${suggested.map((d) => format(new Date(d + "T12:00:00Z"), "EEE d MMM", { locale: nl })).join(", ")}`}
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {suggested.slice(0, 3).map((day) => (
                    <PlanForDateButton
                      key={day}
                      taskId={task.id}
                      date={day}
                      label={format(new Date(day + "T12:00:00Z"), "EEE d MMM", { locale: nl })}
                      pending={pending}
                      onPlan={() => {
                        startTransition(async () => {
                          await rescheduleTask(task.id, day);
                          router.refresh();
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlanForDateButton({
  taskId,
  date,
  label,
  pending,
  onPlan,
}: {
  taskId: string;
  date: string;
  label: string;
  pending: boolean;
  onPlan: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlan}
      disabled={pending}
      className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
    >
      Plan voor {label}
    </button>
  );
}

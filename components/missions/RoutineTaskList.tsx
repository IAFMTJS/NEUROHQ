"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { rescheduleTask, skipNextOccurrence } from "@/app/actions/tasks";
import type { Task } from "@/types/database.types";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { QuickAddModal } from "./QuickAddModal";
import { EditMissionModal } from "@/components/missions";

type Props = {
  routineTasks: Task[];
  suggestedDays: Record<string, string[]>;
  suggestedPlans?: Record<string, Array<{ date: string; reason: string; priority: "high" | "medium" | "low" }>>;
  dateStr: string;
  /** Simplified tasks page: slightly tighter stack inside full-height card. */
  simplifiedLayout?: boolean;
  /** Standard /tasks command deck: visual-lab routine rows + cards. */
  commandDeckVisuals?: boolean;
};

export function RoutineTaskList({
  routineTasks,
  suggestedDays,
  suggestedPlans = {},
  dateStr,
  simplifiedLayout = false,
  commandDeckVisuals = false,
}: Props) {
  const stackGap = simplifiedLayout ? "space-y-2" : commandDeckVisuals ? "space-y-4" : "space-y-3";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [customDateByTask, setCustomDateByTask] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [addRoutineOpen, setAddRoutineOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  /** Routine tab: rows start collapsed; user expands for full planning UI. */
  const [expandedByTaskId, setExpandedByTaskId] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedByTaskId((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (routineTasks.length === 0) {
    const emptyHub = commandDeckVisuals
      ? "card-simple flex flex-wrap items-center justify-between gap-2 !rounded-xl px-2.5 py-2 sm:px-3"
      : "card-simple flex flex-wrap items-center justify-between gap-2 p-3";
    return (
      <div className={stackGap}>
        <div className={emptyHub}>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Routine hub</p>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Nog geen routines — voeg wekelijks/maandelijks taken toe</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            onClick={() => setAddRoutineOpen(true)}
          >
            + Toevoegen
          </button>
        </div>
        <div className={commandDeckVisuals ? "card-simple !rounded-xl px-2.5 py-2 sm:px-3" : "card-simple p-3"}>
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
            Herhaling &quot;wekelijks&quot; of &quot;maandelijks&quot; — de app stelt de beste dagen voor.
          </p>
        </div>
        <QuickAddModal
          open={addRoutineOpen}
          onClose={() => setAddRoutineOpen(false)}
          date={dateStr}
          defaultRecurrence="weekly"
          onAdded={() => {
            setFeedback("Routine toegevoegd. Je ziet hem direct in dit overzicht.");
            router.refresh();
          }}
        />
      </div>
    );
  }

  const hubRowClass = commandDeckVisuals
    ? "card-simple flex flex-wrap items-center justify-between gap-2 !rounded-xl px-2.5 py-2 sm:px-3"
    : "card-simple flex flex-wrap items-center justify-between gap-2 p-3";

  return (
    <div className={stackGap}>
      <div className={hubRowClass}>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Routine hub</p>
          <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
            {routineTasks.length} routine-ta{routineTasks.length !== 1 ? "ken" : "k"} · uitklappen voor plannen
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          onClick={() => setAddRoutineOpen(true)}
        >
          + Toevoegen
        </button>
      </div>
      <ul className={commandDeckVisuals ? "space-y-2" : "space-y-3"}>
        {routineTasks.map((task) => {
          const suggested = suggestedDays[task.id] ?? [];
          const plans = suggestedPlans[task.id] ?? suggested.map((d) => ({
            date: d,
            reason: "Voorgesteld routinemoment.",
            priority: "medium" as const,
          }));
          const recurrence = (task as { recurrence_rule?: string | null }).recurrence_rule ?? "monthly";
          const recurrenceWeekdays = (task as { recurrence_weekdays?: string | null }).recurrence_weekdays ?? "";
          const isBiWeekly = recurrence === "weekly" && recurrenceWeekdays.includes("interval=2");
          const dueDate = (task as { due_date?: string | null }).due_date ?? null;
          const monthlyDay = dueDate ? Number(dueDate.slice(8, 10)) : null;
          const quickLabel = recurrence === "daily" ? "Vandaag plannen" : "Volgende high-priority plannen";
          const nextBest = plans[0]?.date ?? suggested[0] ?? dateStr;
          const nextBestLabel = format(new Date(nextBest + "T12:00:00Z"), "EEE d MMM", { locale: nl });
          const priorityColor = (priority: "high" | "medium" | "low") =>
            priority === "high" ? "text-emerald-300" : priority === "medium" ? "text-[var(--semantic-accent)]" : "text-[var(--text-muted)]";
          const customDateValue = customDateByTask[task.id] ?? "";
          const dueIsToday = dueDate === dateStr;
          const expanded = expandedByTaskId[task.id] === true;
          const recurrenceLabel =
            recurrence === "daily" ? "Dagelijks" : recurrence === "weekly" ? (isBiWeekly ? "2-wekelijks" : "Wekelijks") : "Maandelijks";
          const rowShell = commandDeckVisuals
            ? [
                "rounded-xl border px-2.5 py-2 transition-colors sm:px-3",
                dueIsToday
                  ? "border-[rgba(var(--semantic-accent),0.35)] bg-[rgba(var(--semantic-accent),0.08)]"
                  : "border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.35)]",
              ].join(" ")
            : "card-simple p-3";
          return (
            <li key={task.id} className={rowShell}>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {commandDeckVisuals ? (
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Routine</p>
                        <span className="mt-0.5 block truncate text-sm font-medium text-[var(--text-primary)]">{task.title ?? "Taak"}</span>
                        {!expanded ? (
                          <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                            {recurrenceLabel}
                            {recurrence === "monthly" && monthlyDay != null ? ` · dag ${monthlyDay}` : ""}
                            {plans.length > 0 ? ` · eerstvolgende: ${nextBestLabel}` : ""}
                          </span>
                        ) : null}
                      </div>
                      <span
                        className={[
                          "shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                          dueIsToday ? "bg-[rgba(var(--semantic-accent),0.2)] text-[var(--semantic-accent)]" : "bg-black/25 text-[var(--text-muted)]",
                        ].join(" ")}
                      >
                        {dueIsToday ? "Today" : "Scheduled"}
                      </span>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--text-primary)]">{task.title ?? "Taak"}</span>
                      {!expanded ? (
                        <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                          {recurrenceLabel} · {plans.length > 0 ? nextBestLabel : "—"}
                        </span>
                      ) : null}
                    </div>
                  )}
                  <button
                    type="button"
                    aria-expanded={expanded}
                    className="ml-auto shrink-0 rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(6,18,30,0.45)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-focus)] transition hover:border-[rgba(var(--mode-rgb),0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                    onClick={() => toggleExpanded(task.id)}
                  >
                    {expanded ? "Inklappen" : "Uitklappen"}
                  </button>
                </div>
                {!expanded ? null : (
                  <>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {dueDate && <span className="rounded bg-white/10 px-2 py-0.5 text-[var(--text-secondary)]">Due {dueDate}</span>}
                  {task.energy_required != null && <span className="rounded bg-[var(--accent-energy)]/20 px-2 py-0.5 text-[var(--accent-energy)]">Energy {task.energy_required}</span>}
                  {task.focus_required != null && <span className="rounded bg-[var(--accent-focus)]/20 px-2 py-0.5 text-[var(--accent-focus)]">Focus {task.focus_required}</span>}
                  {task.mental_load != null && <span className="rounded bg-purple-500/20 px-2 py-0.5 text-purple-300">Load {task.mental_load}</span>}
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {recurrence === "daily" ? "Dagelijks" : recurrence === "weekly" ? (isBiWeekly ? "2-wekelijks" : "Wekelijks") : "Maandelijks"}
                  {recurrence === "monthly" && monthlyDay != null ? ` (dag ${monthlyDay})` : ""}
                  {plans.length > 0 &&
                    ` · Aanbevolen: ${plans
                      .map((p) => format(new Date(p.date + "T12:00:00Z"), "EEE d MMM", { locale: nl }))
                      .join(", ")}`}
                </span>
                <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/35 p-3 space-y-2">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Voorgestelde momenten</p>
                  {plans.slice(0, 3).map((plan) => (
                    <div key={plan.date} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={`font-semibold ${priorityColor(plan.priority)}`}>
                        {plan.priority === "high" ? "High" : plan.priority === "medium" ? "Medium" : "Low"}
                      </span>
                      <span className="text-[var(--text-primary)]">
                        {format(new Date(plan.date + "T12:00:00Z"), "EEE d MMM", { locale: nl })}
                      </span>
                      <span className="text-[var(--text-muted)]">- {plan.reason}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <PlanForDateButton
                    taskId={task.id}
                    date={nextBest}
                    label={quickLabel + ` (${nextBestLabel})`}
                    pending={pending}
                    onPlan={() => {
                      startTransition(async () => {
                        await rescheduleTask(task.id, nextBest);
                        setFeedback(`${task.title ?? "Routine"} gepland op ${nextBestLabel}.`);
                        router.refresh();
                      });
                    }}
                  />
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    onClick={() =>
                      startTransition(async () => {
                        await skipNextOccurrence(task.id);
                        setFeedback(`${task.title ?? "Routine"} heeft 1 cyclus overgeslagen.`);
                        router.refresh();
                      })
                    }
                  >
                    Sla 1 cyclus over
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    onClick={() => setEditTask(task)}
                  >
                    Bewerk details
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <label className="text-xs text-[var(--text-muted)]">
                    Plan op eigen datum
                    <input
                      type="date"
                      value={customDateValue}
                      onChange={(e) =>
                        setCustomDateByTask((prev) => ({
                          ...prev,
                          [task.id]: e.target.value,
                        }))
                      }
                      className="mt-1 block rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending || !customDateValue}
                    className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
                    onClick={() =>
                      startTransition(async () => {
                        await rescheduleTask(task.id, customDateValue);
                        setFeedback(`${task.title ?? "Routine"} gepland op ${format(new Date(customDateValue + "T12:00:00Z"), "EEE d MMM", { locale: nl })}.`);
                        router.refresh();
                      })
                    }
                  >
                    Plan datum
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {suggested.slice(0, 3).map((day) => (
                    <PlanForDateButton
                      key={day}
                      taskId={task.id}
                      date={day}
                      label={`Snel: ${format(new Date(day + "T12:00:00Z"), "EEE d MMM", { locale: nl })}`}
                      pending={pending}
                      onPlan={() => {
                        startTransition(async () => {
                          await rescheduleTask(task.id, day);
                          setFeedback(`${task.title ?? "Routine"} gepland op ${format(new Date(day + "T12:00:00Z"), "EEE d MMM", { locale: nl })}.`);
                          router.refresh();
                        });
                      }}
                    />
                  ))}
                </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {feedback && <p className="text-xs text-[var(--text-muted)]">{feedback}</p>}
      <QuickAddModal
        open={addRoutineOpen}
        onClose={() => setAddRoutineOpen(false)}
        date={dateStr}
        defaultRecurrence="weekly"
        onAdded={() => {
          setFeedback("Routine toegevoegd. Je ziet hem direct in dit overzicht.");
          router.refresh();
        }}
      />
      {editTask && (
        <EditMissionModal
          open
          onClose={() => setEditTask(null)}
          task={editTask}
          onSaved={() => {
            setFeedback(`${editTask.title ?? "Routine"} bijgewerkt.`);
            setEditTask(null);
            router.refresh();
          }}
        />
      )}
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

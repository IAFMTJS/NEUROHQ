"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTask, deleteTask } from "@/app/actions/tasks";
import type { Task } from "@/types/database.types";
import { useHQStore } from "@/lib/hq-store";
import { addToQueue } from "@/lib/offline-queue";
import { BacklogModal } from "./BacklogModal";
import { ToekomstModal } from "./ToekomstModal";
import { ScheduleModal, EditMissionModal } from "@/components/missions";
import { Modal } from "@/components/Modal";
import { GlassButton } from "@/components/hud-test/GlassButton";

type TaskRow = { id: string; title: string | null; due_date: string | null; category?: string | null; [key: string]: unknown };

type Props = {
  backlog: TaskRow[];
  futureTasks: TaskRow[];
  todayDate: string;
};

export function BacklogAndToekomstTriggers({ backlog, futureTasks, todayDate }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [toekomstOpen, setToekomstOpen] = useState(false);
  const [scheduleTask, setScheduleTask] = useState<TaskRow | null>(null);
  const [editTask, setEditTask] = useState<TaskRow | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const upsertTask = useHQStore((s) => s.upsertTask);
  const removeTask = useHQStore((s) => s.removeTask);

  function handleSchedule(date: string) {
    if (!scheduleTask) return;
    startTransition(async () => {
      // Optimistically move in device store so tasks for affected days stay aligned with Backlog/Toekomst changes.
      const previousDate = scheduleTask.due_date;
      if (previousDate) {
        removeTask(scheduleTask.id, previousDate);
      }
      upsertTask({
        id: scheduleTask.id,
        title: (scheduleTask.title ?? "") as string,
        due_date: date,
      } as Task);

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await addToQueue("rescheduleTask", { id: scheduleTask.id, due_date: date });
      } else {
        await rescheduleTask(scheduleTask.id, date);
        router.refresh();
      }
      setScheduleTask(null);
    });
  }
  function handleDelete(id: string) {
    startTransition(async () => {
      // Remove from any known date bucket in the device store so UI stays in sync.
      const all = [...backlog, ...futureTasks];
      const row = all.find((t) => t.id === id);
      if (row?.due_date) {
        removeTask(id, row.due_date);
      }

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await addToQueue("deleteTask", { id });
      } else {
        await deleteTask(id);
        router.refresh();
      }
      setDeleteConfirmId(null);
    });
  }

  const backlogCount = backlog.length;
  const futureCount = futureTasks.length;

  const smartHint =
    backlogCount > 0 && futureCount > 0
      ? `${backlogCount} achterstallig · ${futureCount} gepland`
      : backlogCount > 0
        ? `${backlogCount} achterstallig · geen toekomst`
        : futureCount > 0
          ? `Niets achterstallig · ${futureCount} gepland`
          : "Geen achterstallige of toekomstige taken";

  const triggerClass = (hasItems: boolean) =>
    [
      "inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-0",
      hasItems
        ? "border-[rgba(var(--mode-rgb),0.38)] bg-[rgba(var(--mode-rgb),0.12)] text-[var(--accent-focus)] shadow-[0_0_12px_rgba(var(--mode-rgb),0.12)] hover:border-[rgba(var(--mode-rgb),0.48)]"
        : "border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] text-[var(--text-muted)] hover:border-[rgba(var(--mode-rgb),0.22)] hover:bg-[rgba(6,18,30,0.5)] hover:text-[var(--text-secondary)]",
    ].join(" ");

  return (
    <section aria-label="Backlog en toekomst">
      <div className="card-simple flex flex-wrap items-center justify-between gap-2 !rounded-xl border border-[rgba(var(--mode-rgb),0.12)] px-2.5 py-2 sm:gap-3 sm:px-3">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Backlog / toekomst</p>
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[var(--text-muted)]">{smartHint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" className={triggerClass(backlogCount > 0)} onClick={() => setBacklogOpen(true)}>
            Backlog
            <span
              className={[
                "rounded-md px-1 py-px tabular-nums text-[11px] font-bold",
                backlogCount > 0 ? "bg-[rgba(var(--mode-rgb),0.18)] text-[var(--text-primary)]" : "bg-black/25 text-[var(--text-muted)]",
              ].join(" ")}
            >
              {backlogCount}
            </span>
          </button>
          <button type="button" className={triggerClass(futureCount > 0)} onClick={() => setToekomstOpen(true)}>
            Toekomst
            <span
              className={[
                "rounded-md px-1 py-px tabular-nums text-[11px] font-bold",
                futureCount > 0 ? "bg-[rgba(var(--mode-rgb),0.18)] text-[var(--text-primary)]" : "bg-black/25 text-[var(--text-muted)]",
              ].join(" ")}
            >
              {futureCount}
            </span>
          </button>
        </div>
      </div>
      <BacklogModal
        open={backlogOpen}
        onClose={() => setBacklogOpen(false)}
        backlog={backlog}
        todayDate={todayDate}
        onScheduleClick={(task) => {
          setBacklogOpen(false);
          setScheduleTask(task);
        }}
        onEditClick={(task) => {
          setBacklogOpen(false);
          setEditTask(task);
        }}
        onDeleteClick={(id) => {
          setBacklogOpen(false);
          setDeleteConfirmId(id);
        }}
      />
      <ToekomstModal
        open={toekomstOpen}
        onClose={() => setToekomstOpen(false)}
        futureTasks={futureTasks}
        todayDate={todayDate}
        onScheduleClick={(task) => {
          setToekomstOpen(false);
          setScheduleTask(task);
        }}
        onEditClick={(task) => {
          setToekomstOpen(false);
          setEditTask(task);
        }}
        onDeleteClick={(id) => {
          setToekomstOpen(false);
          setDeleteConfirmId(id);
        }}
      />
      {scheduleTask && (
        <ScheduleModal
          open
          onClose={() => setScheduleTask(null)}
          initialDate={scheduleTask.due_date ?? todayDate}
          todayDate={todayDate}
          taskTitle={scheduleTask.title ?? undefined}
          onSchedule={handleSchedule}
          loading={pending}
        />
      )}
      {editTask && (
        <EditMissionModal
          open
          onClose={() => setEditTask(null)}
          task={editTask}
          onSaved={() => {
            setEditTask(null);
            router.refresh();
          }}
        />
      )}
      {deleteConfirmId && (
        <Modal open onClose={() => setDeleteConfirmId(null)} title="Taak verwijderen?" size="sm">
          <p className="text-sm text-[var(--text-muted)]">Deze taak wordt definitief verwijderd.</p>
          <div className="mt-4 flex gap-2">
            <GlassButton type="button" onClick={() => setDeleteConfirmId(null)} className="flex-1 text-sm font-medium">
              Annuleren
            </GlassButton>
            <GlassButton
              type="button"
              onClick={() => handleDelete(deleteConfirmId)}
              disabled={pending}
              variant="alert"
              className="flex-1 text-sm font-medium"
            >
              Verwijderen
            </GlassButton>
          </div>
        </Modal>
      )}
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTask, deleteTask } from "@/app/actions/tasks";
import { BacklogModal } from "./BacklogModal";
import { ToekomstModal } from "./ToekomstModal";
import { ScheduleModal, EditMissionModal } from "@/components/missions";
import { Modal } from "@/components/Modal";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { Divider1px } from "@/components/hud-test/Divider1px";
import { GlassButton } from "@/components/hud-test/GlassButton";
import hudStyles from "@/components/hud-test/hud.module.css";

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
    <section>
      <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-0">
        <CornerNode corner="top-left" />
        <CornerNode corner="top-right" />
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-wide text-[var(--text-primary)]">Backlog & Toekomst</h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Backlog: onafgevinkte taken van voorgaande dagen. Toekomst: geplande taken per datum.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <GlassButton
                type="button"
                onClick={() => setBacklogOpen(true)}
                shape="capsule"
                className="min-w-[118px] px-3 py-1.5 text-xs font-semibold tracking-[0.08em]"
              >
                BACKLOG {backlog.length > 0 && `(${backlog.length})`}
              </GlassButton>
              <GlassButton
                type="button"
                onClick={() => setToekomstOpen(true)}
                shape="capsule"
                className="min-w-[118px] px-3 py-1.5 text-xs font-semibold tracking-[0.08em]"
              >
                TOEKOMST {futureTasks.length > 0 && `(${futureTasks.length})`}
              </GlassButton>
            </div>
          </div>
        </div>
        <Divider1px />
      </SciFiPanel>
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

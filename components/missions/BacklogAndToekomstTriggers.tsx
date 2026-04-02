"use client";

import { useState } from "react";
import { BacklogModal } from "./BacklogModal";
import { ToekomstModal } from "./ToekomstModal";

type TaskRow = { id: string; title: string | null; due_date: string | null; category?: string | null; [key: string]: unknown };

type Props = {
  backlog: TaskRow[];
  futureTasks: TaskRow[];
  todayDate: string;
  onScheduleMission: (task: TaskRow) => void;
  onEditMission: (task: TaskRow) => void;
  onDeleteMission: (id: string, bucketDate: string | null) => void;
};

export function BacklogAndToekomstTriggers({
  backlog,
  futureTasks,
  todayDate,
  onScheduleMission,
  onEditMission,
  onDeleteMission,
}: Props) {
  const [backlogOpen, setBacklogOpen] = useState(false);
  const [toekomstOpen, setToekomstOpen] = useState(false);

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
          onScheduleMission(task as TaskRow);
        }}
        onEditClick={(task) => {
          setBacklogOpen(false);
          onEditMission(task as TaskRow);
        }}
        onDeleteClick={(id) => {
          setBacklogOpen(false);
          const row = backlog.find((t) => t.id === id);
          onDeleteMission(id, (row?.due_date as string | null) ?? null);
        }}
      />
      <ToekomstModal
        open={toekomstOpen}
        onClose={() => setToekomstOpen(false)}
        futureTasks={futureTasks}
        todayDate={todayDate}
        onScheduleClick={(task) => {
          setToekomstOpen(false);
          onScheduleMission(task as TaskRow);
        }}
        onEditClick={(task) => {
          setToekomstOpen(false);
          onEditMission(task as TaskRow);
        }}
        onDeleteClick={(id) => {
          setToekomstOpen(false);
          const row = futureTasks.find((t) => t.id === id);
          onDeleteMission(id, (row?.due_date as string | null) ?? null);
        }}
      />
    </section>
  );
}

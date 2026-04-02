"use client";

import { useState } from "react";
import { BacklogModal } from "./BacklogModal";
import { ToekomstModal } from "./ToekomstModal";

type TaskRow = { id: string; title: string | null; due_date: string | null; category?: string | null; [key: string]: unknown };

function formatUpcomingDayLabel(dateStr: string, todayDate: string) {
  if (dateStr === todayDate) return "Vandaag";
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date(todayDate + "T12:00:00");
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Morgen";
  if (diffDays === 2) return "Overmorgen";
  if (diffDays > 2 && diffDays <= 7) return `Over ${diffDays} dagen`;
  return dateStr;
}

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

      <div className="mt-2 rounded-xl border border-[rgba(var(--mode-rgb),0.1)] bg-[rgba(6,18,30,0.28)] px-2.5 py-2 sm:px-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Komende dagen</p>
          <button
            type="button"
            className="rounded-lg border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(var(--mode-rgb),0.08)] px-2 py-1 text-[10px] font-semibold text-[var(--accent-focus)] transition hover:border-[rgba(var(--mode-rgb),0.35)]"
            onClick={() => setToekomstOpen(true)}
          >
            Volledige lijst
          </button>
        </div>
        {futureTasks.length > 0 ? (
          <ul className="mt-2 space-y-1.5" aria-label="Geplande taken binnenkort">
            {futureTasks.slice(0, 7).map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-2 text-[11px] leading-snug">
                <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">{t.title ?? "Zonder titel"}</span>
                <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
                  {t.due_date ? formatUpcomingDayLabel(t.due_date, todayDate) : "—"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
            Nog niets gepland na vandaag. Voeg een missie toe en kies een datum in de toekomst, of gebruik <span className="font-medium text-[var(--text-secondary)]">Toekomst</span> hierboven om alles te beheren.
          </p>
        )}
        {futureTasks.length > 7 ? (
          <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">+{futureTasks.length - 7} extra — open volledige lijst.</p>
        ) : null}
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
>
  );
}
ection>
  );
}

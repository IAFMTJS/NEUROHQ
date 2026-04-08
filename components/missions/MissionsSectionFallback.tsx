"use client";

import { useMemo } from "react";
import { useHQStore } from "@/lib/hq-store";
import { Skeleton } from "@/components/Skeleton";

type CachedMission = { id: string; title?: string | null; completed?: boolean };

type SnapshotData = {
  dateKey: string;
  tasks: CachedMission[];
  completedToday: CachedMission[];
};

function DeckishRow({ muted }: { muted?: boolean }) {
  return (
    <li
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
        muted
          ? "border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(6,18,30,0.2)] opacity-80"
          : "border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)]"
      }`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--semantic-accent)]/40" aria-hidden />
      <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
      <Skeleton className={`h-4 flex-1 max-w-[220px] ${muted ? "opacity-60" : ""}`} />
    </li>
  );
}

function SkeletonLayout() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.28)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <Skeleton className="mb-3 h-3 w-32" />
        <Skeleton className="mb-4 h-16 w-full rounded-xl" />
        <ul className="space-y-2">
          {[1, 2, 3].map((i) => (
            <DeckishRow key={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function CachedLayout({ snapshot, dateStr }: { snapshot: SnapshotData; dateStr: string }) {
  if (snapshot.dateKey !== dateStr) return <SkeletonLayout />;
  const incomplete = (snapshot.tasks ?? []).filter((t) => !t.completed);
  const completed = (snapshot.completedToday ?? []).slice(0, 8);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[rgba(var(--mode-rgb),0.2)] bg-[rgba(4,12,22,0.45)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Laden…
        </span>
      </div>
      <div className="rounded-xl border border-[rgba(var(--mode-rgb),0.14)] bg-[rgba(6,18,30,0.28)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Missies</p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          <span className="mr-2 inline-flex items-center rounded-full bg-[var(--semantic-accent)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--semantic-accent)]">
            Bijwerken
          </span>
          Serverdata wordt geladen…
        </p>
        <ul className="mt-4 space-y-2">
          {incomplete.slice(0, 8).map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(6,18,30,0.35)] px-3 py-3"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--semantic-accent)]/50" aria-hidden />
              <div className="h-5 w-5 shrink-0 rounded-md border-2 border-[rgba(var(--mode-rgb),0.35)]" />
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{t.title ?? "Missie"}</span>
            </li>
          ))}
          {completed.length > 0 ? (
            <>
              <p className="mb-1 mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">Voltooid vandaag</p>
              {completed.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(var(--mode-rgb),0.08)] bg-[rgba(6,18,30,0.2)] px-3 py-2.5 text-sm text-[var(--text-muted)] line-through opacity-80"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-emerald-500/50 bg-emerald-500/15 text-[10px] text-emerald-400">
                    ✓
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t.title ?? "Missie"}</span>
                </li>
              ))}
            </>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

type Props = { dateStr: string };

/** Loading / streamed shell: matches command-deck missions list (no legacy SciFi double chrome). */
export function MissionsSectionFallback({ dateStr }: Props) {
  const tasksRaw = useHQStore((s) => s.tasksByDate[dateStr]);
  const snapshot = useMemo(() => {
    const tasks = (tasksRaw ?? []) as CachedMission[];
    if (tasks.length === 0) return null;
    const completedToday = tasks.filter((task) => task.completed);
    const incomplete = tasks.filter((task) => !task.completed);
    return {
      dateKey: dateStr,
      data: {
        dateKey: dateStr,
        tasks: incomplete,
        completedToday,
      },
    };
  }, [dateStr, tasksRaw]);
  if (snapshot?.data && snapshot.dateKey === dateStr && (snapshot.data.tasks?.length > 0 || (snapshot.data.completedToday?.length ?? 0) > 0)) {
    return <CachedLayout snapshot={snapshot.data} dateStr={dateStr} />;
  }
  return <SkeletonLayout />;
}

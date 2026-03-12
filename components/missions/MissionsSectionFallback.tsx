"use client";

import { useMemo } from "react";
import { loadDailySnapshot } from "@/lib/client-cache";
import { SciFiPanel } from "@/components/hud-test/SciFiPanel";
import { CornerNode } from "@/components/hud-test/CornerNode";
import { Skeleton } from "@/components/Skeleton";
import hudStyles from "@/components/hud-test/hud.module.css";

type CachedMission = { id: string; title?: string | null; completed?: boolean };

type SnapshotData = {
  dateKey: string;
  tasks: CachedMission[];
  completedToday: CachedMission[];
};

function SkeletonLayout() {
  return (
    <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      <div className="min-h-[44px]" aria-hidden />
      <div className="h-10 animate-pulse rounded-lg bg-white/5" aria-hidden />
      <div className="min-h-[24px]" aria-hidden />
      <div className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Today&apos;s missions <span className="font-medium text-[var(--accent-focus)]">· Commander</span>
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Volledige taakformulier · XP per missie</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/60 p-4">
            <Skeleton className="mb-3 h-4 w-24" />
            <ul className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2.5">
                  <Skeleton className="h-6 w-6 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 flex-1 max-w-[200px]" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SciFiPanel>
  );
}

function CachedLayout({ snapshot, dateStr }: { snapshot: SnapshotData; dateStr: string }) {
  if (snapshot.dateKey !== dateStr) return <SkeletonLayout />;
  const incomplete = (snapshot.tasks ?? []).filter((t) => !t.completed);
  const completed = (snapshot.completedToday ?? []).slice(0, 8);
  return (
    <SciFiPanel variant="glass" className={hudStyles.focusSecondary} bodyClassName="p-4 md:p-5">
      <CornerNode corner="top-left" />
      <CornerNode corner="top-right" />
      <div className="min-h-[44px]" aria-hidden />
      <div className="h-10 animate-pulse rounded-lg bg-white/5" aria-hidden />
      <div className="min-h-[24px]" aria-hidden />
      <div className="card-simple overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Today&apos;s missions <span className="font-medium text-[var(--accent-focus)]">· Commander</span>
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)] flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-focus)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-focus)]">
                  Updating…
                </span>
                Volledige taakformulier · XP per missie
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-10 w-32 rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-surface)]/60 p-4">
            <ul className="space-y-2">
              {incomplete.slice(0, 8).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2.5"
                >
                  <div className="h-6 w-6 shrink-0 rounded-lg border-2 border-neutral-500 bg-transparent" />
                  <span className="text-sm text-[var(--text-primary)] truncate flex-1">{t.title ?? "Task"}</span>
                </li>
              ))}
              {completed.length > 0 && (
                <>
                  <p className="mt-3 mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Done today</p>
                  {completed.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 rounded-lg border border-[var(--card-border)]/50 bg-[var(--bg-surface)]/30 px-3 py-2 text-sm text-[var(--text-muted)] line-through"
                    >
                      <span className="h-6 w-6 shrink-0 rounded-lg border-2 border-green-500 bg-green-500/20 flex items-center justify-center text-green-400 text-xs">✓</span>
                      <span className="truncate flex-1">{t.title ?? "Task"}</span>
                    </li>
                  ))}
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </SciFiPanel>
  );
}

type Props = { dateStr: string };

/** Renders mission layout instantly from cached snapshot when available; otherwise skeleton matching final layout. */
export function MissionsSectionFallback({ dateStr }: Props) {
  const snapshot = useMemo(() => loadDailySnapshot<SnapshotData>("missions"), []);
  if (snapshot?.data && snapshot.dateKey === dateStr && (snapshot.data.tasks?.length > 0 || (snapshot.data.completedToday?.length ?? 0) > 0)) {
    return <CachedLayout snapshot={snapshot.data} dateStr={dateStr} />;
  }
  return <SkeletonLayout />;
}

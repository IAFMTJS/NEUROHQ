"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getTodayKey } from "@/lib/daily-date";
import { getHubBundle, setHubBundle } from "@/lib/hub-bundles/db";

type TasksBundleResponse = {
  dateStr: string;
  prefs?: any;
  backlog?: any[];
  routine?: any;
  calendar?: any;
  tasksForDate?: { tasks?: any[] } | any;
};

function TaskRow({ t }: { t: any }) {
  const title = (t?.title as string | undefined) ?? "Untitled";
  const done = Boolean((t as { completed?: boolean }).completed);
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(var(--mode-rgb),0.12)] bg-[rgba(var(--mode-rgb-deep),0.08)] px-3 py-2">
      <span className={`text-sm ${done ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)]"}`}>
        {title}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {done ? "Done" : "Open"}
      </span>
    </li>
  );
}

export function TasksLocalFirstPage() {
  const todayStr = useMemo(() => getTodayKey(), []);
  const [bundle, setBundleState] = useState<TasksBundleResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const userId = session?.user?.id ?? null;
        if (userId) {
          const cached = (await getHubBundle("tasks", userId, todayStr).catch(() => null)) as any;
          const cachedPayload = cached?.payload ?? null;
          if (cachedPayload && !cancelled) {
            setBundleState(cachedPayload as TasksBundleResponse);
            setLoading(false);
          }
        }

        const res = await fetch("/api/tasks/bundle", {
          credentials: "include",
          cache: "no-store",
          headers: { "x-neurohq-refresh": "1" },
        });
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const fresh = (await res.json()) as TasksBundleResponse;
        if (cancelled) return;
        setBundleState(fresh);
        setLoading(false);
        if (userId) {
          void setHubBundle("tasks", userId, todayStr, { dateStr: todayStr, payload: fresh } as any).catch(() => {});
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [todayStr]);

  const tasks = (bundle?.tasksForDate?.tasks ?? bundle?.tasksForDate ?? []) as any[];
  const backlogCount = Array.isArray(bundle?.backlog) ? bundle!.backlog!.length : 0;

  return (
    <main className="tasks-page-root container page page-wide dashboard-cinematic relative z-10 pb-10 pt-4 sm:pt-5">
      <div className="hq-frosted-main-shell">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">Missions (Local-first)</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {bundle?.dateStr ?? todayStr} · {tasks.length} today · {backlogCount} backlog
              </p>
            </div>
            <Link className="text-xs font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline" href="/tasks">
              Open full Tasks
            </Link>
          </div>

          {loading && !bundle ? (
            <div className="min-h-[220px] animate-pulse rounded-2xl bg-[var(--bg-elevated)]/30" aria-hidden />
          ) : (
            <ul className="space-y-2">
              {tasks.slice(0, 12).map((t, idx) => (
                <TaskRow key={t?.id ?? idx} t={t} />
              ))}
              {tasks.length > 12 ? (
                <li className="text-xs text-[var(--text-muted)]">…and {tasks.length - 12} more</li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}


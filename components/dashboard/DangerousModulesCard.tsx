"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IDENTITY_DRIFT_LABELS } from "@/lib/identity-drift";
import { WEEKLY_MODE_LABELS } from "@/lib/weekly-tactical-mode";
import type { DangerousModulesContext } from "@/app/actions/dangerous-modules-context";
import type { WeeklyTacticalMode } from "@/lib/weekly-tactical-mode";
import { enqueueMutation, flushMutationQueue, loadDailySnapshot, saveDailySnapshot } from "@/lib/client-cache";

type Props = {
  /** When true, render without outer card/section and h2 (e.g. inside Systeem modus card). */
  embedded?: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);
const SNAPSHOT_KEY = "dangerous-modules";
const MUTATION_TYPE_OVERRIDE = "dangerous-modules:mode-override";

async function fetchContext(dateStr: string): Promise<DangerousModulesContext | null> {
  const res = await fetch(`/api/dashboard/dangerous-modules?date=${encodeURIComponent(dateStr)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as DangerousModulesContext;
  saveDailySnapshot<DangerousModulesContext>(SNAPSHOT_KEY, json);
  return json;
}

export function DangerousModulesCard({ embedded }: Props) {
  const [ctxOverride, setCtxOverride] = useState<DangerousModulesContext | null>(null);
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [queueFlushed, setQueueFlushed] = useState(false);
  const todayStr = today();

  const snapshot = loadDailySnapshot<DangerousModulesContext | null>(SNAPSHOT_KEY);

  const { data: ctxBase } = useQuery({
    queryKey: ["dangerous-modules", todayStr],
    queryFn: () => fetchContext(todayStr),
    staleTime: 24 * 60 * 60 * 1000,
    initialData: snapshot?.data ?? null,
  });

  useEffect(() => {
    if (queueFlushed) return;
    if (typeof window === "undefined") return;
    if (!navigator.onLine) return;

    flushMutationQueue(async (mutation) => {
      if (mutation.type !== MUTATION_TYPE_OVERRIDE) return;
      const { mode, date } = (mutation.payload ?? {}) as { mode?: WeeklyTacticalMode; date?: string };
      if (!mode || !date) return;
      await fetch("/api/dashboard/dangerous-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, mode }),
        credentials: "include",
      });
    }).finally(() => {
      setQueueFlushed(true);
    });
  }, [queueFlushed]);

  // Conflict resolution: when merging server data, prefer local if isLocalSnapshotNewerThan(snapshot, serverUpdatedAt).
  const ctx = ctxOverride ?? ctxBase;

  const handleModeOverride = async (mode: WeeklyTacticalMode) => {
    setOverrideLoading(true);
    try {
      const res = await fetch("/api/dashboard/dangerous-modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: todayStr, mode }),
        credentials: "include",
      });
      if (!res.ok) {
        enqueueMutation(MUTATION_TYPE_OVERRIDE, { mode, date: todayStr });
      }
      const updated = (await fetchContext(todayStr)) ?? ctxBase ?? null;
      setCtxOverride(updated);
      if (updated) {
        saveDailySnapshot<DangerousModulesContext>(SNAPSHOT_KEY, updated, {
          lastMutationAt: new Date().toISOString(),
        });
      }
    } catch {
      enqueueMutation(MUTATION_TYPE_OVERRIDE, { mode, date: todayStr });
      const optimistic =
        ctxBase ?? snapshot?.data ?? ctxOverride;
      if (optimistic) {
        const next: DangerousModulesContext = {
          ...optimistic,
          weeklyMode: optimistic.weeklyMode
            ? { ...optimistic.weeklyMode, mode, userOverrideUsed: true }
            : { mode, userOverrideUsed: true },
        };
        setCtxOverride(next);
        saveDailySnapshot<DangerousModulesContext>(SNAPSHOT_KEY, next, {
          lastMutationAt: new Date().toISOString(),
        });
      }
    } finally {
      setOverrideLoading(false);
    }
  };

  if (!ctx) return null;

  const content = (
    <div className="space-y-4">
        {ctx.identityDrift && (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)]">Identiteit (data-driven)</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {IDENTITY_DRIFT_LABELS[ctx.identityDrift.type]}
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Gebaseerd op laatste 30 dagen. Beïnvloedt XP en load subtiel.
            </p>
          </div>
        )}
        {ctx.weeklyMode && (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)]">Weekmodus</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {WEEKLY_MODE_LABELS[ctx.weeklyMode.mode]}
            </p>
            {!ctx.weeklyMode.userOverrideUsed && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(["stability", "push", "recovery", "expansion"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={overrideLoading}
                    onClick={() => handleModeOverride(mode)}
                    className="rounded border border-[var(--card-border)] bg-white/5 px-2 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-50"
                  >
                    {WEEKLY_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            )}
            {ctx.weeklyMode.userOverrideUsed && (
              <p className="mt-1 text-xs text-[var(--text-muted)]">Override deze week gebruikt (1×/week).</p>
            )}
          </div>
        )}
        {ctx.loadForecast && ctx.loadForecast.overloadRisk > 0.4 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <p className="text-xs font-medium text-amber-300">Cognitive load</p>
            <p className="text-sm text-[var(--text-primary)]">
              {ctx.loadForecast.message ?? `Risico ${Math.round(ctx.loadForecast.overloadRisk * 100)}%.`}
            </p>
          </div>
        )}
        {ctx.autopilot?.suggested && (
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 px-3 py-2">
            <p className="text-xs font-medium text-[var(--text-muted)]">Dag stabilisatie</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Autopilot beschikbaar — systeem stelt een vaste dagindeling voor.
            </p>
          </div>
        )}
      </div>
  );

  if (embedded) return content;
  return (
    <section
      className="card-simple hq-card-enter rounded-[var(--hq-card-radius-sharp)] p-5"
      aria-label="Systeemmodus"
    >
      <h2 className="hq-h2 mb-4">Systeemmodus</h2>
      {content}
    </section>
  );
}

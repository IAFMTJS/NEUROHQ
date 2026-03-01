"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modal";
import { getCalendarWeekData, getAutoScheduleSuggestions } from "@/app/actions/missions-performance";
import { updateTask } from "@/app/actions/tasks";
import { domainLabel } from "@/lib/strategyDomains";

function weekStart(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const day = d.getUTCDay();
  const monday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + monday);
  return d.toISOString().slice(0, 10);
}

function dayLabel(iso: string, todayStr: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const days = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
  const name = days[d.getUTCDay()];
  const date = iso.slice(8);
  return todayStr === iso ? `${name} ${date} (vandaag)` : `${name} ${date}`;
}

const ENERGY_CAP = 10;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Reference date (e.g. today) to show the week containing it. */
  initialDate: string;
  onAddMicroMission?: (date: string) => void;
};

export function CalendarModal3({ open, onClose, initialDate, onAddMicroMission }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getCalendarWeekData>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSuggestions, setAutoSuggestions] = useState<Awaited<ReturnType<typeof getAutoScheduleSuggestions>> | null>(null);
  const [autoPending, setAutoPending] = useState(false);

  const start = weekStart(initialDate);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getCalendarWeekData(start)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Kon week niet laden"))
      .finally(() => setLoading(false));
  }, [open, start]);

  const days = data?.days ?? [];
  const threeHeavyInRow =
    days.length >= 3 &&
    days.some((_, i) => i <= days.length - 3 && days[i].totalEnergy >= 7 && days[i + 1].totalEnergy >= 7 && days[i + 2].totalEnergy >= 7);
  const emptyDays = days.filter((d) => d.taskCount === 0);

  return (
    <Modal open={open} onClose={onClose} title="Kalender 3.0 — Strategische weekplanner" size="lg" showBranding={false}>
      {loading && <p className="text-sm text-[var(--text-muted)]">Laden…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!loading && data && (
        <div className="space-y-5">
          {/* Pressure overlay + gradient hint */}
          {data.pressure.daysRemaining > 0 && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                data.pressure.zone === "risk"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : data.pressure.zone === "healthy"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                    : "border-[var(--card-border)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
              }`}
            >
              <strong>Strategic pressure:</strong> {data.pressure.zone} — nog {data.pressure.daysRemaining} dagen tot deadline.
              {data.pressure.zone === "risk" && " Intensiteit stijgt richting deadline."}
            </div>
          )}

          {/* 1. Time Budget Visualizer + totale tijd (min) + pressure gradient + distribution waarschuwing */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">1. Time budget per dag</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Totale geplande energy load en minuten; cap {ENERGY_CAP}/dag. Overload = rood. Afwijking = waarschuwing. Spreid zware dagen over de week voor betere recovery.</p>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {days.map((d, i) => {
                const pressureIntensity = data.pressure.daysRemaining > 0 && data.pressure.zone !== "comfort"
                  ? (7 - i) / 7
                  : 0;
                const gradientClass = data.pressure.zone === "risk" && pressureIntensity > 0.5
                  ? "ring-1 ring-red-500/30"
                  : data.pressure.zone === "healthy" && pressureIntensity > 0.5
                    ? "ring-1 ring-amber-500/20"
                    : "";
                const distWarning = (d as { distributionWarning?: boolean }).distributionWarning;
                const minutes = d.totalPlannedMinutes ?? d.totalEnergy * 8;
                return (
                  <div
                    key={d.date}
                    className={`rounded-lg border p-2 text-center ${gradientClass} ${
                      d.isOverload ? "border-red-500/50 bg-red-500/20" : distWarning ? "border-amber-500/40 bg-amber-500/5" : "border-[var(--card-border)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    <p className="text-[10px] font-medium text-[var(--text-muted)]">{dayLabel(d.date, data.todayStr)}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{d.totalEnergy}/{ENERGY_CAP}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{minutes} min · {d.taskCount} taken</p>
                    {distWarning && <p className="mt-0.5 text-[10px] text-amber-400">Afwijking</p>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Strategic distribution */}
          {data.strategy && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">2. Strategische verdeling (focus)</h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Weekly allocation: primary = {domainLabel(data.strategy.primaryDomain)}. Verdeel focus over de week volgens je strategy.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(data.strategy.weeklyAllocation).map(([domain, pct]) => (
                  <span key={domain} className="rounded-lg bg-[var(--accent-focus)]/15 px-2.5 py-1 text-xs font-medium text-[var(--accent-focus)]">
                    {domainLabel(domain)} {pct}%
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 5. Burnout detectie */}
          {threeHeavyInRow && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              ⚠ 3 of meer zware dagen achter elkaar — overweeg een recovery-dag of lichtere missies.
            </div>
          )}

          {/* 6. Streak protection — lege dag */}
          {emptyDays.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">6. Streak protection</h3>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Lege dagen: voeg een micro-missie toe om momentum te behouden.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {emptyDays.slice(0, 5).map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => { onAddMicroMission?.(d.date); onClose(); }}
                    className="rounded-lg border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20"
                  >
                    {dayLabel(d.date, data.todayStr)} — Voeg 5-min missie toe
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 4. Auto-scheduler */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">4. Auto-scheduler</h3>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Verspreidt taken op basis van energy en druk. Klik om voorstellen te zien; je kunt ze toepassen of negeren.</p>
            <button
              type="button"
              disabled={autoPending}
              onClick={() => {
                setAutoPending(true);
                getAutoScheduleSuggestions(start)
                  .then(setAutoSuggestions)
                  .finally(() => setAutoPending(false));
              }}
              className="mt-2 rounded-lg border border-[var(--accent-focus)]/40 bg-[var(--accent-focus)]/10 px-3 py-2 text-sm font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/20 disabled:opacity-50"
            >
              {autoPending ? "Bezig…" : "Optimaliseer mijn week"}
            </button>
            {autoSuggestions && (
              <div className="mt-3 space-y-2 rounded-lg border border-[var(--card-border)] bg-[var(--bg-surface)]/50 p-3 text-sm">
                <p className="text-[var(--text-muted)]">{autoSuggestions.message}</p>
                {autoSuggestions.suggestions.length > 0 && (
                  <>
                    <ul className="space-y-1 text-[var(--text-primary)]">
                      {autoSuggestions.suggestions.map((s) => (
                        <li key={s.taskId}>
                          {s.taskTitle}: {s.currentDue} → {s.suggestedDue}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="mt-2 rounded-lg bg-[var(--accent-focus)]/20 px-3 py-1.5 text-xs font-medium text-[var(--accent-focus)] hover:bg-[var(--accent-focus)]/30"
                      onClick={async () => {
                        for (const s of autoSuggestions.suggestions) {
                          await updateTask(s.taskId, { due_date: s.suggestedDue });
                        }
                        setAutoSuggestions(null);
                        router.refresh();
                      }}
                    >
                      Toepassen
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

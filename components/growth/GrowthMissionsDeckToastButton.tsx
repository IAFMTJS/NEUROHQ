"use client";

import { toast } from "sonner";

type DeckTask = {
  id: string;
  title: string;
  dueDate: string | null;
  completed: boolean;
};

type Props = {
  tasks: DeckTask[];
  weekLabel: string;
};

function dueLabel(dateKey: string | null): string {
  if (!dateKey) return "Geen datum";
  const d = new Date(`${dateKey}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return dateKey;
  return d.toLocaleDateString("nl-NL", { weekday: "short", day: "2-digit", month: "2-digit" });
}

export function GrowthMissionsDeckToastButton({ tasks, weekLabel }: Props) {
  return (
    <button
      type="button"
      className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
      onClick={() => {
        toast.custom((id) => (
          <div className="w-[min(100vw-2rem,34rem)] rounded-2xl border border-cyan-300/25 bg-[rgba(6,14,24,0.96)] p-4 shadow-2xl backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/90">Growth Missions Deck</p>
            <p className="mt-1 text-sm font-semibold text-white">Protocol taken · week {weekLabel}</p>

            {tasks.length === 0 ? (
              <p className="mt-3 text-xs text-slate-300">Geen growth protocol taken gevonden voor deze week.</p>
            ) : (
              <div className="mt-3 max-h-64 space-y-1.5 overflow-auto pr-1">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-white">{task.title}</p>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${
                          task.completed
                            ? "border-emerald-300/35 bg-emerald-500/12 text-emerald-100"
                            : "border-white/15 bg-black/30 text-slate-200"
                        }`}
                      >
                        {task.completed ? "Done" : "Open"}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">{dueLabel(task.dueDate)}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                onClick={() => {
                  toast.dismiss(id);
                  window.location.assign("/tasks?growth=1");
                }}
              >
                Open Missions
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-black/40"
                onClick={() => toast.dismiss(id)}
              >
                Sluiten
              </button>
            </div>
          </div>
        ));
      }}
    >
      Missions deck
    </button>
  );
}

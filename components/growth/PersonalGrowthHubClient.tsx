"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { neuroToast } from "@/lib/ui/neuro-toast";
import { Modal } from "@/components/Modal";
import { deleteTask } from "@/app/actions/tasks";
import { commitTasksFromPersonalGrowth } from "@/app/actions/user-goal-tasks";
import {
  buildPersonalGrowthMissionPreview,
  getPersonalGrowthAreaPresets,
  type PersonalGrowthIntensity,
} from "@/lib/user-goal-mission-preview";
import {
  setPersonalGrowthFocus,
  type PersonalGrowthFocusState,
  type PersonalGrowthWeekStats,
  type PersonalGrowthWeeklyHighlights,
} from "@/app/actions/personal-growth";

const UNDO_MS = 25_000;
const TAG_OPTIONS = ["discipline", "confidence", "stress", "social", "health", "career"] as const;

type Props = {
  initialFocus: PersonalGrowthFocusState;
  weekStats: PersonalGrowthWeekStats;
  highlights: PersonalGrowthWeeklyHighlights;
};

function intensityLabel(intensity: PersonalGrowthIntensity): string {
  if (intensity === "light") return "Light";
  if (intensity === "intense") return "Intense";
  return "Normal";
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function startOfWeekDates(weekStart: string): string[] {
  // weekStart is YYYY-MM-DD. We keep it timezone-agnostic for UI.
  const d0 = new Date(`${weekStart}T00:00:00.000Z`);
  if (!Number.isFinite(d0.getTime())) return [];
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(d0);
    d.setUTCDate(d0.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function weekdayShort(d: string): string {
  // nl-ish short labels matching the mock.
  const dt = new Date(`${d}T00:00:00.000Z`);
  const idx = dt.getUTCDay(); // 0..6 (Sun..Sat)
  const map = ["ZO", "MA", "DI", "WO", "DO", "VR", "ZA"];
  return map[idx] ?? "—";
}

function timeShort(ts: string): string | null {
  const d = new Date(ts);
  if (!Number.isFinite(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function dateLabelNL(tsOrDate: string): string | null {
  // Accept ISO date (YYYY-MM-DD) or ISO timestamp.
  const d = tsOrDate.length === 10 ? new Date(`${tsOrDate}T00:00:00.000Z`) : new Date(tsOrDate);
  if (!Number.isFinite(d.getTime())) return null;
  const wd = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"][d.getDay()] ?? null;
  if (!wd) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${wd} ${dd}/${mm}`;
}

function deriveMockWeeklyFeedback(params: {
  focus: string | null;
  tags: string[];
  intensity: PersonalGrowthIntensity;
  horizonDays: number;
  weekStats: PersonalGrowthWeekStats;
}) {
  const { weekStats, horizonDays, intensity, focus } = params;
  const assigned = weekStats.total;
  const done = weekStats.done;
  const open = weekStats.open;
  const completionRate = assigned > 0 ? done / assigned : 0;

  // “Avoided moments / pushed through” are placeholders but tied to real completion.
  const avoidedMoments = assigned === 0 ? 0 : clamp(open, 0, 9);
  const successMoments = assigned === 0 ? 0 : clamp(done, 0, 9);

  // Outcomes: mocked but deterministic to week completion so it “moves”.
  const growthScore = assigned === 0 ? 0 : Math.round(clamp((completionRate - 0.35) * 40, -18, 22));
  const confidence = assigned === 0 ? 60 : clamp(Math.round(64 + completionRate * 18), 42, 92);
  const confidenceDelta = assigned === 0 ? 0 : clamp(Math.round(growthScore * 0.6), -12, 14);
  const stress = assigned === 0 ? 45 : clamp(Math.round(44 - completionRate * 10), 18, 72);
  const stressDelta = assigned === 0 ? 0 : clamp(Math.round(-confidenceDelta * 0.8), -12, 12);

  const expectedFailRate = intensity === "intense" ? 0.45 : intensity === "light" ? 0.25 : 0.4;
  const avgEveryDays = assigned > 0 ? Math.round((horizonDays / assigned) * 10) / 10 : null;

  return {
    focus: focus ?? "—",
    avoidedMoments,
    successMoments,
    growthScore,
    growthScoreDelta: assigned === 0 ? 0 : clamp(growthScore, -18, 22),
    confidence,
    confidenceDelta,
    stress,
    stressDelta,
    completedMissions: done,
    totalMissions: assigned,
    avgEveryDays,
    expectedFailRatePct: Math.round(expectedFailRate * 100),
    weeklyTrend: {
      comfort: clamp(Math.round(completionRate * 22), 0, 26),
      avoidance: -clamp(Math.round(open * 7), 0, 30),
      consistency: clamp(Math.round((1 - Math.min(1, open / Math.max(1, assigned))) * 18), 0, 22),
    },
  };
}

export function PersonalGrowthHubClient({ initialFocus, weekStats, highlights }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const presets = useMemo(() => getPersonalGrowthAreaPresets(), []);

  const [areaMode, setAreaMode] = useState<"preset" | "custom">("preset");
  const [presetArea, setPresetArea] = useState<string>(initialFocus.area ?? presets[0] ?? "Discipline");
  const [customArea, setCustomArea] = useState<string>("");

  const [goal, setGoal] = useState<string>(initialFocus.goal ?? "");
  const [tags, setTags] = useState<string[]>(initialFocus.tags ?? []);
  const [intensity, setIntensity] = useState<PersonalGrowthIntensity>(initialFocus.intensity ?? "normal");
  const [horizonDays, setHorizonDays] = useState<number>(initialFocus.horizonDays ?? 14);

  const needsSetup = !(initialFocus.area || initialFocus.goal);
  const [editMode, setEditMode] = useState<boolean>(needsSetup);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<{ title: string; due_date: string }[]>([]);
  const [commitArmed, setCommitArmed] = useState(false);

  const effectiveArea = (areaMode === "custom" ? customArea.trim() : presetArea.trim()) || null;

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function saveFocus() {
    startTransition(async () => {
      try {
        await setPersonalGrowthFocus({
          area: effectiveArea,
          goal: goal.trim() || null,
          tags,
          intensity,
          horizonDays,
        });
        neuroToast.success("Focus opgeslagen.");
        router.refresh();
        setEditMode(false);
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Opslaan mislukt.");
      }
    });
  }

  function openPreview() {
    try {
      const rows = buildPersonalGrowthMissionPreview({
        area: effectiveArea,
        goal: goal.trim(),
        tags,
        intensity,
        horizonDays,
      });
      setPreviewRows(rows.map((r) => ({ title: r.title, due_date: r.due_date })));
      setPreviewOpen(true);
      setCommitArmed(false);
    } catch (e) {
      neuroToast.error(e instanceof Error ? e.message : "Check je invoer.");
    }
  }

  function confirmCreate() {
    startTransition(async () => {
      try {
        const { created, taskIds } = await commitTasksFromPersonalGrowth({
          area: effectiveArea,
          goal: goal.trim(),
          tags,
          intensity,
          horizonDays,
        });
        setPreviewOpen(false);
        neuroToast.success(`${created} growth missies gedeployed.`, {
          duration: UNDO_MS,
          action: {
            label: "Ongedaan maken",
            onClick: () => {
              startTransition(async () => {
                try {
                  for (const id of taskIds) await deleteTask(id);
                  neuroToast.message("Taken verwijderd.");
                  router.refresh();
                } catch {
                  neuroToast.error("Ongedaan maken mislukt.");
                }
              });
            },
          },
        });
        router.refresh();
      } catch (e) {
        neuroToast.error(e instanceof Error ? e.message : "Aanmaken mislukt.");
      }
    });
  }

  const goalValid = goal.trim().length >= 8;
  const weekPct = weekStats.total > 0 ? Math.round((weekStats.done / weekStats.total) * 100) : 0;
  const weekDates = useMemo(() => startOfWeekDates(weekStats.weekStart), [weekStats.weekStart]);
  const mock = useMemo(
    () =>
      deriveMockWeeklyFeedback({
        focus: effectiveArea,
        tags,
        intensity,
        horizonDays,
        weekStats,
      }),
    [effectiveArea, tags, intensity, horizonDays, weekStats],
  );

  const winLine = highlights.biggestWin?.title ?? null;
  const failLine = highlights.biggestFailure?.title ?? null;
  const realityHeadline =
    mock.avoidedMoments >= 3
      ? "Niet mooi. Wel eerlijk."
      : mock.avoidedMoments >= 1
        ? "Goed bezig. Maar niet klaar."
        : "Goed bezig.";
  const winTime = highlights.biggestWin?.occurredAt ? timeShort(highlights.biggestWin.occurredAt) : null;
  const winDay = highlights.biggestWin?.occurredAt ? dateLabelNL(highlights.biggestWin.occurredAt) : null;
  const evalDay = dateLabelNL(weekStats.weekEnd);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.26)] bg-[linear-gradient(135deg,rgba(6,18,35,0.92)_0%,rgba(12,32,58,0.86)_50%,rgba(3,10,20,0.95)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_rgba(var(--mode-rgb),0.08)] md:p-7"
        style={{ ["--mode-rgb" as any]: "0, 212, 255", ["--mode-rgb-deep" as any]: "0, 136, 255" }}
        aria-label="Personal growth hub"
      >
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.34)_0%,rgba(var(--mode-rgb),0.14)_40%,transparent_70%)] blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(var(--mode-rgb),0.26)_0%,rgba(var(--mode-rgb-deep),0.10)_42%,transparent_72%)] blur-2xl"
          aria-hidden
        />

        <div className="relative z-[1] grid gap-4 border-b border-[rgba(var(--mode-rgb),0.12)] pb-5 md:grid-cols-[1fr_auto] md:items-end">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">
              Personal Growth
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] md:text-3xl">{realityHeadline}</h1>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">
                Je focus deze week: <span className="text-sky-200">{mock.focus}</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Je hebt <span className="font-semibold text-rose-200 tabular-nums">{mock.avoidedMoments}</span> momenten genegeerd,
              maar <span className="font-semibold text-emerald-200 tabular-nums">{mock.successMoments}</span> keer alsnog doorgezet.
            </p>
          </div>

          <div className="flex items-start justify-between gap-3 md:flex-col md:items-end md:justify-end">
            <button
              type="button"
              disabled={pending}
              onClick={() => neuroToast.message("Reflectie komt eraan.")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.55)]" aria-hidden />
              Reflectie
            </button>
            <div
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.22)] bg-[radial-gradient(circle_at_50%_40%,rgba(var(--mode-rgb),0.22),rgba(0,0,0,0.28)_58%,rgba(0,0,0,0.65)_100%)] shadow-[0_0_30px_rgba(var(--mode-rgb),0.12),inset_0_1px_0_rgba(255,255,255,0.06)] md:h-28 md:w-28"
              aria-hidden
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_30%,rgba(255,255,255,0.10),transparent_55%)]" />
              <div className="absolute -bottom-6 left-1/2 h-24 w-20 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_25%,rgba(56,189,248,0.35),rgba(56,189,248,0.08)_55%,transparent_72%)] blur-[0.5px]" />
              <div className="absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_50%_35%,black_55%,transparent_78%)]">
                <div className="absolute left-1/2 top-[18%] h-10 w-10 -translate-x-1/2 rounded-full bg-white/10" />
                <div className="absolute left-1/2 top-[44%] h-16 w-12 -translate-x-1/2 rounded-[999px] bg-white/10" />
              </div>
            </div>
            <div className="hidden md:block" />
          </div>
        </div>

        <div className="relative z-[1] mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Week progress</p>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className="relative h-14 w-14 shrink-0 rounded-full border border-white/10 bg-black/20"
                  style={{
                    background: `conic-gradient(rgba(103,232,249,0.95) ${weekPct}%, rgba(255,255,255,0.08) 0)`,
                  }}
                  aria-hidden
                >
                  <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-[rgba(6,18,30,0.88)]">
                    <div className="text-center">
                      <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{weekPct}%</p>
                      <p className="text-[10px] font-semibold text-[var(--text-muted)]">Voltooid</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {weekStats.done}/{weekStats.total}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">missies</p>
                </div>
              </div>
            </div>
            <div className="border-l border-white/10 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Growth score</p>
              <p className="mt-2 text-lg font-bold text-emerald-200 tabular-nums">
                {mock.growthScore >= 0 ? `+${mock.growthScore}` : String(mock.growthScore)}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)] tabular-nums">
                {mock.growthScoreDelta >= 0 ? `+${mock.growthScoreDelta}` : String(mock.growthScoreDelta)} vs vorige week
              </p>
            </div>
            <div className="border-t border-white/10 p-4 sm:border-t-0 sm:border-l">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Confidence</p>
              <p className="mt-2 text-lg font-bold text-[var(--text-primary)] tabular-nums">{mock.confidence}</p>
              <p className="mt-1 text-[11px] text-emerald-200 tabular-nums">
                {mock.confidenceDelta >= 0 ? `+${mock.confidenceDelta}` : String(mock.confidenceDelta)} deze week
              </p>
            </div>
            <div className="border-l border-t border-white/10 p-4 sm:border-t-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Stress level</p>
              <p className="mt-2 text-lg font-bold text-[var(--text-primary)] tabular-nums">{mock.stress}</p>
              <p className="mt-1 text-[11px] text-rose-200 tabular-nums">
                {mock.stressDelta >= 0 ? `+${mock.stressDelta}` : String(mock.stressDelta)} deze week
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Missies deze week</p>
            <p className="text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
              {weekStats.done}/{weekStats.total} voltooid
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            {weekDates.map((d, i) => {
              const isDone = weekStats.total > 0 ? i < clamp(weekStats.done, 0, 7) : false;
              return (
                <div key={d} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${
                      isDone
                        ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.25)]"
                        : "border-white/10 bg-black/30 text-white/35"
                    }`}
                    aria-hidden
                  >
                    {isDone ? "✓" : ""}
                  </div>
                  <p className="text-[10px] font-semibold text-[var(--text-muted)]">{weekdayShort(d)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]/80 tabular-nums">
                    {d.slice(8, 10)}/{d.slice(5, 7)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Jouw groei deze week</p>
            <button
              type="button"
              className="text-xs font-semibold text-sky-200/90 hover:text-sky-100"
              onClick={() => neuroToast.message("Trends komen eraan.")}
            >
              Bekijk trends →
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {[
              { label: "Social Comfort", v: mock.weeklyTrend.comfort, color: "from-sky-400/35 via-cyan-300/50 to-blue-500/45" },
              { label: "Vermijding", v: mock.weeklyTrend.avoidance, color: "from-rose-500/35 via-orange-400/40 to-amber-300/45" },
              { label: "Consistentie", v: mock.weeklyTrend.consistency, color: "from-emerald-400/35 via-teal-300/45 to-sky-400/35" },
            ].map((r) => {
              const pct = clamp(Math.abs(r.v), 0, 100);
              const up = r.v >= 0;
              return (
                <div key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">{r.label}</p>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-white/10 bg-black/25">
                      <div className={`h-full rounded-full bg-gradient-to-r ${r.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <p className={`text-xs font-semibold tabular-nums ${up ? "text-emerald-200" : "text-rose-200"}`}>
                    {up ? "↑" : "↓"} {pct}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Grootste win</p>
            <div className="mt-2 flex gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M8 4h8v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4Z"
                    stroke="rgba(56,189,248,0.95)"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M10 11v2.2c0 1.7-1.2 3.1-2.9 3.4L6 17h12l-1.1-.4A3.7 3.7 0 0 1 14 13.2V11"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 20h6"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M6 6H4.5A2.5 2.5 0 0 0 7 8.5"
                    stroke="rgba(56,189,248,0.6)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M18 6h1.5A2.5 2.5 0 0 1 17 8.5"
                    stroke="rgba(56,189,248,0.6)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                  {winLine ?? "Geen win. Dan heb je ook niks bewezen."}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">{winDay ? `${winDay}${winTime ? ` · ${winTime}` : ""}` : "—"}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Uitdaging</p>
            <div className="mt-2 flex gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/25">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 3 2.6 20h18.8L12 3Z"
                    stroke="rgba(251,113,133,0.9)"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M12 9v5" stroke="rgba(255,255,255,0.72)" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M12 17.2h.01" stroke="rgba(255,255,255,0.72)" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-rose-200">{failLine ?? "Geen misses. Houd het strak."}</p>
                <button
                  type="button"
                  className="mt-1 text-left text-[11px] font-semibold text-sky-200/90 hover:text-sky-100"
                  onClick={() => neuroToast.message("Details komen eraan.")}
                >
                  Bekijk details →
                </button>
              </div>
            </div>
          </div>
        </div>

        {!editMode ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Jouw huidige focus</p>
                <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{effectiveArea ?? "Geen focus"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(tags.length > 0 ? tags.slice(0, 4) : ["confidence", "social", "health", "career"]).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => setEditMode(true)}
                className="btn-secondary rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Aanpassen
              </button>
            </div>
            <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-3">
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Intensiteit</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{intensityLabel(intensity)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Horizon</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">{horizonDays} dagen</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Volgende evaluatie</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{evalDay ?? "—"}</p>
              </div>
            </div>
          </div>
        ) : null}

        {!editMode ? (
          <div className="mt-3">
            <button
              type="button"
              disabled={pending || !goalValid}
              onClick={openPreview}
              className="primary-btn flex w-full items-center justify-center px-4 py-3 text-center text-sm font-semibold disabled:opacity-50"
            >
              Lock focus & start volgende week
            </button>
            <p className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              Je commit voor 7 dagen. Geen reset zonder <span className="text-rose-200 font-semibold">penalty</span>.
            </p>
          </div>
        ) : null}

        {editMode ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.18)] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Growth area</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAreaMode("preset")}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    areaMode === "preset"
                      ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                      : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                  }`}
                >
                  Preset
                </button>
                <button
                  type="button"
                  onClick={() => setAreaMode("custom")}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    areaMode === "custom"
                      ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                      : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                  }`}
                >
                  Custom
                </button>
              </div>
              {areaMode === "preset" ? (
                <select
                  disabled={pending}
                  value={presetArea}
                  onChange={(e) => setPresetArea(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] [color-scheme:dark] focus:border-[var(--accent-focus)]/60 focus:outline-none"
                >
                  {presets.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  disabled={pending}
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  placeholder="Bv. Assertiviteit, Emotionele regulatie…"
                />
              )}
            </div>

            <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.18)] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Focus goal</p>
              <textarea
                disabled={pending}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]"
                placeholder="Bv. meer initiatief nemen op het werk…"
              />
              <div className="mt-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        tags.includes(t)
                          ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                          : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-[var(--text-muted)] tabular-nums">
                  Confidence: {mock.confidenceDelta >= 0 ? `+${mock.confidenceDelta}` : mock.confidenceDelta} · Stress:{" "}
                  {mock.stressDelta >= 0 ? `+${mock.stressDelta}` : mock.stressDelta} · Social: {mock.successMoments}× doorgezet
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.18)] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Influence · intensity</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["light", "normal", "intense"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={pending}
                  onClick={() => setIntensity(id)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    intensity === id
                      ? "border-[var(--accent-focus)] bg-[var(--accent-focus)]/15 text-[var(--text-primary)]"
                      : "border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent-focus)]/50"
                  }`}
                >
                  {intensityLabel(id)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[var(--text-muted)] tabular-nums">
              Je krijgt <strong>{previewRows.length || "?"}</strong> missies · gemiddeld{" "}
              <strong>{mock.avgEveryDays ?? "—"}</strong> dagen per missie · fail rate verwacht{" "}
              <strong>{mock.expectedFailRatePct}%</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-[rgba(var(--mode-rgb),0.18)] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Influence · horizon</p>
            <select
              disabled={pending}
              value={String(horizonDays)}
              onChange={(e) => setHorizonDays(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] [color-scheme:dark] focus:border-[var(--accent-focus)]/60 focus:outline-none"
            >
              {[7, 14, 21, 28].map((d) => (
                <option key={d} value={String(d)}>
                  {d} dagen
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">Spreiding van je personal growth taken.</p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={() => {
              setGoal("");
              setTags([]);
              setCustomArea("");
              neuroToast.message("Reset.");
            }}
          >
            Reset
          </button>
          {editMode ? (
            <button
              type="button"
              disabled={pending}
              onClick={saveFocus}
              className="btn-secondary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {pending ? "Opslaan…" : "Save focus"}
            </button>
          ) : null}
        </div>
      </section>

      <Modal
        open={previewOpen}
        onClose={() => !pending && setPreviewOpen(false)}
        title="Deploy week"
        size="lg"
      >
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">
            Je deployt <strong>{previewRows.length}</strong> missies over {horizonDays} dagen.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Je commit voor <strong>7 dagen</strong>. Geen reset zonder penalty.
          </p>
          <label className="mt-2 flex items-start gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={commitArmed}
              onChange={(e) => setCommitArmed(e.target.checked)}
              disabled={pending}
            />
            <span>Ik snap het. Ik ga niet “even” resetten omdat het niet lekker voelt.</span>
          </label>
        </div>
        <ul className="mt-3 max-h-[min(360px,55dvh)] space-y-1.5 overflow-y-auto rounded-lg border border-[var(--card-border)] bg-[var(--bg-primary)]/40 p-3 text-xs text-[var(--text-secondary)]">
          {previewRows.map((r, i) => (
            <li key={i} className="flex justify-between gap-2 border-b border-[var(--card-border)]/50 pb-1.5 last:border-0">
              <span className="min-w-0 flex-1">{r.title}</span>
              <span className="shrink-0 tabular-nums text-[var(--text-muted)]">{r.due_date}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || !commitArmed}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
            onClick={confirmCreate}
          >
            {pending ? "Bezig…" : "Start run"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setPreviewOpen(false)}
            className="btn-secondary rounded-lg px-4 py-2 text-sm"
          >
            Annuleren
          </button>
        </div>
      </Modal>
    </div>
  );
}


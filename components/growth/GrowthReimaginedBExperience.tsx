import Link from "next/link";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { syncGrowthFocusProtocolToCalendarWeek } from "@/app/actions/growth-protocol-calendar-sync";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getTasksForDateRange, getTodaysTasks } from "@/app/actions/tasks";
import { GrowthMissionsRibbon } from "@/components/growth/GrowthMissionsRibbon";
import { GrowthProtocolCommandCard } from "@/components/growth/GrowthProtocolCommandCard";
import { GrowthCommanderSummaryCard } from "@/components/growth/GrowthCommanderSummaryCard";
import { GrowthMissionsDeckToastButton } from "@/components/growth/GrowthMissionsDeckToastButton";
import { GrowthCatchupRoundButton } from "@/components/growth/GrowthCatchupRoundButton";
import { GrowthWorkspaceInfoToastButtons } from "@/components/growth/GrowthWorkspaceInfoToastButtons";
import { GrowthReimaginedBTabShell } from "@/components/growth/GrowthReimaginedBTabShell";
import { parseProtocolDefinition } from "@/lib/growth/protocol-definition";
import { progressKey } from "@/lib/growth/resolve-focus-protocol";
import { formatDayShort } from "@/lib/utils/date-locale";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";
import { strategyPaceHintLines } from "@/lib/strategy/format-strategy-pace-hints";

type DeckParityStatus = "covered" | "bridge";
type DeckParityItem = {
  label: string;
  status: DeckParityStatus;
  note: string;
};

type Props = {
  showLearningLink?: boolean;
};

const deckParity: DeckParityItem[] = [
  {
    label: "Protocol selectie + weekprogressie",
    status: "covered",
    note: "Zelfde command center en protocol-progress als productie.",
  },
  {
    label: "Missions sync inclusief feedback",
    status: "covered",
    note: "Zelfde commit/sync actions met result-feedback.",
  },
  {
    label: "Tier alignment signal",
    status: "covered",
    note: "Live engine/protocol tieralignment via growth snapshot.",
  },
  {
    label: "Vooruitzicht volgende week",
    status: "covered",
    note: "Zelfde outlookkaart uit de Growth bottom hub.",
  },
  {
    label: "Learning momentum",
    status: "covered",
    note: "Live momentum uit learning state i.p.v. statische pulse.",
  },
  {
    label: "Decision-block uitvoering",
    status: "bridge",
    note: "Uitvoering blijft centraal in Missions op /tasks?growth=1.",
  },
];

function deckParityStyle(status: DeckParityStatus): string {
  if (status === "covered") return "border-emerald-300/35 bg-emerald-500/12 text-emerald-100";
  return "border-cyan-300/35 bg-cyan-500/12 text-cyan-100";
}

function weekDateKeysFromStart(startDateKey: string): string[] {
  const start = new Date(`${startDateKey}T12:00:00Z`);
  const dates: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

function isProtocolMission(task: unknown): boolean {
  const tagsRaw = (task as { task_tags?: unknown }).task_tags;
  const tags = Array.isArray(tagsRaw) ? tagsRaw.filter((tag): tag is string => typeof tag === "string") : [];
  return tags.includes("protocol") || tags.some((tag) => tag.startsWith("protocol_"));
}

export async function GrowthReimaginedBExperience({ showLearningLink = true }: Props) {
  await syncGrowthFocusProtocolToCalendarWeek();

  const today = todayDateString();
  const { start: budgetWeekStart, end: budgetWeekEnd } = getBudgetWeekBounds(today);
  const budgetWeekLabel = `${formatDayShort(budgetWeekStart)} – ${formatDayShort(budgetWeekEnd)}`;

  const [protocols, progressMap, growthFocus, strategyPacingHints, growthSnap, todaysTasksResult, weekTasksByDate] = await Promise.all([
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
    getStrategyPacingHints(),
    getGrowthEngineSnapshot(),
    getTodaysTasks(today, "normal", { growthOnly: true }),
    getTasksForDateRange(budgetWeekStart, budgetWeekEnd, { growthOnly: true }),
  ]);

  const todayTasks = (todaysTasksResult.tasks ?? []).filter((task) => isProtocolMission(task));
  const todayDoneCount = todayTasks.filter((task) => (task as { completed?: boolean }).completed === true).length;
  const todayTotalCount = todayTasks.length;
  const todayOpenCount = Math.max(0, todayTotalCount - todayDoneCount);
  const weekDayKeys = Object.keys(weekTasksByDate ?? {});
  const weekRows = weekDayKeys.flatMap((date) =>
    ((weekTasksByDate[date] ?? []) as Array<{ completed?: boolean; task_tags?: unknown }>).filter((row) => isProtocolMission(row))
  );
  const weekTotalCount = weekRows.length;
  const weekDoneCount = weekRows.filter((task) => task.completed === true).length;
  const weeklyProgressPct = weekTotalCount > 0 ? Math.round((weekDoneCount / weekTotalCount) * 100) : 0;
  const daysDoneCount = weekDayKeys.filter((date) => {
    const rows = ((weekTasksByDate[date] ?? []) as Array<{ completed?: boolean; task_tags?: unknown }>).filter((row) =>
      isProtocolMission(row)
    );
    if (rows.length === 0) return false;
    const done = rows.filter((row) => row.completed === true).length;
    return done > 0;
  }).length;
  const daysTotalCount = 7;
  const activeProtocolTitle = growthSnap?.activeProtocol?.title ?? "Geen actief focusprotocol";
  const engineTier = growthSnap?.engineTier ?? "medium";
  const tierAligned = growthSnap?.tierAligned ?? true;
  const activeProtocolSlug = growthSnap?.activeProtocol?.slug ?? null;
  const activeProtocolLocale = growthSnap?.activeProtocol?.locale ?? "nl";
  const activeProtocolRow =
    activeProtocolSlug == null
      ? null
      : protocols.find((row) => row.slug === activeProtocolSlug && row.locale === activeProtocolLocale) ??
        protocols.find((row) => row.slug === activeProtocolSlug) ??
        null;
  const activeDefinition = parseProtocolDefinition(activeProtocolRow?.definition_json ?? null);
  const activeProgress = activeProtocolSlug ? progressMap[progressKey(activeProtocolSlug, activeProtocolLocale)] ?? null : null;
  const protocolCompletedIds = new Set(activeProgress?.completed_task_ids ?? []);
  const protocolTotalCount =
    activeDefinition?.weeks.reduce((sum, week) => sum + week.tasks.length, 0) ?? 0;
  const protocolDoneCount =
    activeDefinition?.weeks.reduce(
      (sum, week) => sum + week.tasks.filter((task) => protocolCompletedIds.has(task.id)).length,
      0
    ) ?? 0;
  const protocolProgressPct =
    protocolTotalCount > 0 ? Math.round((protocolDoneCount / protocolTotalCount) * 100) : 0;
  const trajectoryWeeks = (activeDefinition?.weeks ?? []).slice().sort((a, b) => a.week_index - b.week_index);
  const paceLines = strategyPacingHints ? strategyPaceHintLines("learning", strategyPacingHints).slice(0, 2) : [];
  const orderedWeekDates = weekDateKeysFromStart(budgetWeekStart);
  const weekDayStats = orderedWeekDates.map((date) => {
    const rows = ((weekTasksByDate?.[date] ?? []) as Array<{ completed?: boolean; task_tags?: unknown }>).filter((row) =>
      isProtocolMission(row)
    );
    const total = rows.length;
    const done = rows.filter((row) => row.completed === true).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { date, total, done, pct };
  });
  const priorityToday = (todayTasks as Array<{ id: string; title?: string; completed?: boolean; due_date?: string }>)
    .filter((task) => task.completed !== true)
    .slice(0, 5);
  const protocolDeckTasks = orderedWeekDates
    .flatMap((date) => (weekTasksByDate?.[date] ?? []) as Array<{ id?: string; title?: string; completed?: boolean; due_date?: string | null; task_tags?: unknown }>)
    .filter((task) => isProtocolMission(task))
    .map((task) => ({
      id: task.id ?? `${task.title ?? "task"}-${task.due_date ?? "no-date"}`,
      title: task.title ?? "Untitled task",
      completed: task.completed === true,
      dueDate: task.due_date ?? null,
    }));

  const commandPanel = (
    <>
      <section className="space-y-3">
        <GrowthCommanderSummaryCard
          weekLabel={budgetWeekLabel}
          activeProtocolTitle={activeProtocolTitle}
          protocolProgressPct={protocolProgressPct}
          protocolDoneCount={protocolDoneCount}
          protocolTotalCount={protocolTotalCount}
          weeklyProgressPct={weeklyProgressPct}
          todayDoneCount={todayDoneCount}
          todayTotalCount={todayTotalCount}
          daysDoneCount={daysDoneCount}
          daysTotalCount={daysTotalCount}
        />
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <GrowthMissionsDeckToastButton tasks={protocolDeckTasks} weekLabel={budgetWeekLabel} />
          {showLearningLink ? (
            <Link
              href="/learning"
              className="rounded-lg border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:text-white"
            >
              Echte Growth
            </Link>
          ) : null}
        </div>
      </section>
      <GrowthProtocolCommandCard protocols={protocols} progressMap={progressMap} growthFocus={growthFocus} />
    </>
  );

  const signalsPanel = (
    <>
      <section className="rounded-2xl border border-cyan-300/20 bg-[linear-gradient(145deg,rgba(5,14,28,0.92)_0%,rgba(4,10,22,0.95)_100%)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Command intel</h2>
          <p className="text-xs text-slate-300">Live week diagnostics</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Open vandaag</p>
            <p className="mt-1 text-base font-semibold text-white">{todayOpenCount}</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Week done</p>
            <p className="mt-1 text-base font-semibold text-white">
              {weekDoneCount}/{weekTotalCount}
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Engine tier</p>
            <p className="mt-1 text-base font-semibold text-white">{engineTier}</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Tier alignment</p>
            <p className={`mt-1 text-base font-semibold ${tierAligned ? "text-emerald-200" : "text-amber-200"}`}>
              {tierAligned ? "Aligned" : "Mismatch"}
            </p>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <h2 className="text-lg font-semibold text-white">Parity matrix</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {deckParity.map((item) => (
            <article key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{item.label}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${deckParityStyle(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      {growthSnap ? <GrowthMissionsRibbon snap={growthSnap} className="!rounded-2xl" /> : null}

    </>
  );

  const workspacePanel = (
    <>
      <section className="rounded-2xl border border-cyan-300/20 bg-[linear-gradient(155deg,rgba(3,11,24,0.94)_0%,rgba(5,14,30,0.9)_100%)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200/90">Workspace brief</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Execution workspace · week {budgetWeekLabel}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <GrowthWorkspaceInfoToastButtons
              missions={{ weekLabel: budgetWeekLabel, tasks: protocolDeckTasks }}
              analytics={{
                weekLabel: budgetWeekLabel,
                weeklyProgressPct,
                weekDoneCount,
                weekTotalCount,
                daysDoneCount,
                daysTotalCount,
                todayOpenCount,
                engineTier,
                tierAligned,
                priorityTitles: priorityToday.map((task) => task.title ?? "Untitled task").slice(0, 3),
              }}
            />
            <GrowthCatchupRoundButton
              protocolSlug={growthSnap?.activeProtocol?.slug ?? null}
              locale={growthSnap?.activeProtocol?.locale ?? "nl"}
            />
          </div>
        </div>
        {paceLines.length > 0 ? (
          <div className="mt-3 space-y-1.5 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            {paceLines.map((line) => (
              <p key={line} className="text-xs text-slate-200">
                {line}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-base font-semibold text-white">Week execution map</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {weekDayStats.map((day) => (
              <div key={day.date} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-[11px] text-slate-300">{formatDayShort(day.date)}</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {day.done}/{day.total} done
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300" style={{ width: `${day.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <h3 className="text-base font-semibold text-white">Priority lane (today)</h3>
          {priorityToday.length === 0 ? (
            <p className="mt-3 text-sm text-slate-300">Geen open taken vandaag. Klaar voor review of recovery.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {priorityToday.map((task, index) => (
                <li key={task.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[11px] text-slate-400">Slot {index + 1}</p>
                  <p className="mt-1 text-sm font-medium text-white">{task.title ?? "Untitled task"}</p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

    </>
  );

  const trajectoryPanel = (
    <>
      <section className="rounded-2xl border border-cyan-300/20 bg-[linear-gradient(155deg,rgba(3,11,24,0.94)_0%,rgba(5,14,30,0.9)_100%)] p-5">
        <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-200/90">Protocol traject</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Van dag 1 tot 100% voltooiing</h2>
        <p className="mt-2 text-xs text-slate-300">
          Overzicht van alle protocoltaken, inclusief reeds afgeronde items.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Totale progressie</p>
            <p className="mt-1 text-base font-semibold text-cyan-100">{protocolProgressPct}%</p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Taken voltooid</p>
            <p className="mt-1 text-base font-semibold text-white">
              {protocolDoneCount}/{protocolTotalCount}
            </p>
          </article>
          <article className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] text-slate-300">Open taken</p>
            <p className="mt-1 text-base font-semibold text-white">{Math.max(0, protocolTotalCount - protocolDoneCount)}</p>
          </article>
        </div>
      </section>

      {trajectoryWeeks.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-sm text-slate-300">Geen actief protocoltraject gevonden om volledig te tonen.</p>
        </section>
      ) : (
        <section className="space-y-3">
          {trajectoryWeeks.map((week) => {
            const weekDoneCount = week.tasks.filter((task) => protocolCompletedIds.has(task.id)).length;
            const weekTotalCount = week.tasks.length;
            const weekPct = weekTotalCount > 0 ? Math.round((weekDoneCount / weekTotalCount) * 100) : 0;
            const rationale = week.week_intent?.trim() || week.coach_notes?.trim() || "Deze week bouwt voort op de vorige fase om continu progressie te houden.";
            return (
              <article key={week.week_index} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-cyan-200/90">Week {week.week_index}</p>
                    <h3 className="mt-1 text-base font-semibold text-white">{week.title}</h3>
                    <p className="mt-1 text-xs text-slate-300">{week.objective}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200">
                    {weekDoneCount}/{weekTotalCount} done · {weekPct}%
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-500/[0.08] p-3">
                  <p className="text-[10px] uppercase tracking-[0.1em] text-cyan-100/90">Waarom deze week</p>
                  <p className="mt-1 text-xs text-slate-200">{rationale}</p>
                </div>
                <ul className="mt-3 space-y-2">
                  {week.tasks.map((task) => {
                    const done = protocolCompletedIds.has(task.id);
                    return (
                      <li
                        key={task.id}
                        className={`rounded-lg border px-3 py-2 ${
                          done
                            ? "border-emerald-300/25 bg-emerald-500/[0.08]"
                            : "border-white/10 bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                              done ? "bg-emerald-500/25 text-emerald-100" : "bg-white/10 text-slate-300"
                            }`}
                          >
                            {done ? "✓" : "○"}
                          </span>
                          <div>
                            <p className={`text-sm ${done ? "text-emerald-100" : "text-white"}`}>{task.title}</p>
                            {task.concrete ? <p className="mt-0.5 text-xs text-slate-300">{task.concrete}</p> : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </section>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <GrowthReimaginedBTabShell
        commandPanel={commandPanel}
        signalsPanel={signalsPanel}
        workspacePanel={workspacePanel}
        trajectoryPanel={trajectoryPanel}
      />
    </div>
  );
}

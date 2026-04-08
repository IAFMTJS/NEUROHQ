import Link from "next/link";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { syncGrowthFocusProtocolToCalendarWeek } from "@/app/actions/growth-protocol-calendar-sync";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getLearningState } from "@/app/actions/learning-state";
import { getTasksForDateRange, getTodaysTasks } from "@/app/actions/tasks";
import { GrowthMissionsRibbon } from "@/components/growth/GrowthMissionsRibbon";
import { GrowthProtocolCommandCard } from "@/components/growth/GrowthProtocolCommandCard";
import { GrowthCommanderSummaryCard } from "@/components/growth/GrowthCommanderSummaryCard";
import { GrowthReimaginedBTabShell } from "@/components/growth/GrowthReimaginedBTabShell";
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

export async function GrowthReimaginedBExperience({ showLearningLink = true }: Props) {
  await syncGrowthFocusProtocolToCalendarWeek();

  const today = todayDateString();
  const { start: budgetWeekStart, end: budgetWeekEnd } = getBudgetWeekBounds(today);
  const budgetWeekLabel = `${formatDayShort(budgetWeekStart)} – ${formatDayShort(budgetWeekEnd)}`;

  const [protocols, progressMap, growthFocus, strategyPacingHints, growthSnap, learningState, todaysTasksResult, weekTasksByDate] = await Promise.all([
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
    getStrategyPacingHints(),
    getGrowthEngineSnapshot(),
    getLearningState(),
    getTodaysTasks(today, "normal"),
    getTasksForDateRange(budgetWeekStart, budgetWeekEnd),
  ]);

  const topStreams = learningState.streams.slice(0, 3);
  const covered = deckParity.filter((item) => item.status === "covered").length;
  const todayTasks = todaysTasksResult.tasks ?? [];
  const todayDoneCount = todayTasks.filter((task) => (task as { completed?: boolean }).completed === true).length;
  const todayTotalCount = todayTasks.length;
  const todayOpenCount = Math.max(0, todayTotalCount - todayDoneCount);
  const weekDayKeys = Object.keys(weekTasksByDate ?? {});
  const weekRows = weekDayKeys.flatMap((date) => (weekTasksByDate[date] ?? []) as Array<{ completed?: boolean }>);
  const weekTotalCount = weekRows.length;
  const weekDoneCount = weekRows.filter((task) => task.completed === true).length;
  const weeklyProgressPct = weekTotalCount > 0 ? Math.round((weekDoneCount / weekTotalCount) * 100) : 0;
  const daysDoneCount = weekDayKeys.filter((date) => {
    const rows = (weekTasksByDate[date] ?? []) as Array<{ completed?: boolean }>;
    if (rows.length === 0) return false;
    const done = rows.filter((row) => row.completed === true).length;
    return done > 0;
  }).length;
  const daysTotalCount = 7;
  const activeProtocolTitle = growthSnap?.activeProtocol?.title ?? "Geen actief focusprotocol";
  const engineTier = growthSnap?.engineTier ?? "medium";
  const tierAligned = growthSnap?.tierAligned ?? true;
  const paceLines = strategyPacingHints ? strategyPaceHintLines("learning", strategyPacingHints).slice(0, 2) : [];
  const orderedWeekDates = weekDateKeysFromStart(budgetWeekStart);
  const weekDayStats = orderedWeekDates.map((date) => {
    const rows = (weekTasksByDate?.[date] ?? []) as Array<{ completed?: boolean }>;
    const total = rows.length;
    const done = rows.filter((row) => row.completed === true).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { date, total, done, pct };
  });
  const priorityToday = (todayTasks as Array<{ id: string; title?: string; completed?: boolean; due_date?: string }>)
    .filter((task) => task.completed !== true)
    .slice(0, 5);

  const commandPanel = (
    <>
      <GrowthCommanderSummaryCard
        weekLabel={budgetWeekLabel}
        activeProtocolTitle={activeProtocolTitle}
        weeklyProgressPct={weeklyProgressPct}
        todayDoneCount={todayDoneCount}
        todayTotalCount={todayTotalCount}
        daysDoneCount={daysDoneCount}
        daysTotalCount={daysTotalCount}
      />
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

      <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Momentum radar (live)</h2>
          <p className="text-xs text-slate-300">Gebaseerd op learning_state</p>
        </div>
        {topStreams.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">Geen streams actief. Start een stream op Growth om signalen te activeren.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {topStreams.map((stream) => (
              <article key={stream.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-sm font-medium text-white">{stream.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {stream.sessionsThisWeek} sessies · last active {stream.lastActive ?? "n.v.t."}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300"
                    style={{ width: `${Math.round(stream.momentumScore * 100)}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
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
            <Link
              href="/tasks?growth=1"
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Open Missions
            </Link>
            <Link
              href="/learning/analytics"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              Open Analytics
            </Link>
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

      <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <h3 className="text-base font-semibold text-white">Learning streams in execution context</h3>
        {topStreams.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">Nog geen streams actief. Voeg focusstreams toe om momentum te sturen.</p>
        ) : (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {topStreams.map((stream) => (
              <article key={stream.id} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                <p className="text-sm font-medium text-white">{stream.title}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {stream.sessionsThisWeek} sessies · last active {stream.lastActive ?? "n.v.t."}
                </p>
                <p className="mt-2 text-xs text-cyan-100">Momentum {Math.round(stream.momentumScore * 100)}%</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative z-[1]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/90">Growth Command Deck · Live</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            Stuur je protocolweek met een <span className="text-cyan-200">live growth command deck</span>
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200/85">
            Stel focus, zwaarte en periode in, sync direct naar Missions en volg realtime je voortgang, momentum en tier-alignment in een
            centrale execution flow.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 text-xs text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
              Live engine mode
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">
              Parity {covered}/{deckParity.length}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-slate-300">Week {budgetWeekLabel}</span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {showLearningLink ? (
              <Link
                href="/learning"
                className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
              >
                Echte Growth
              </Link>
            ) : null}
            <Link
              href="/tasks?growth=1"
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Missions deck
            </Link>
          </div>
        </div>
      </section>

      <GrowthReimaginedBTabShell
        commandPanel={commandPanel}
        signalsPanel={signalsPanel}
        workspacePanel={workspacePanel}
      />
    </div>
  );
}

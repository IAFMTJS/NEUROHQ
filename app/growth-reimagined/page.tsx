import Link from "next/link";
import { getProtocolLibrary } from "@/app/actions/protocol-library";
import { getProtocolProgressMap } from "@/app/actions/protocol-progress";
import { getGrowthFocus } from "@/app/actions/growth-focus";
import { syncGrowthFocusProtocolToCalendarWeek } from "@/app/actions/growth-protocol-calendar-sync";
import { getStrategyPacingHints } from "@/app/actions/strategy-engine-pacing";
import { getGrowthEngineSnapshot } from "@/app/actions/growth-snapshot";
import { getLearningState } from "@/app/actions/learning-state";
import { LearningContentClient } from "@/components/growth/LearningContentClient";
import { GrowthMissionsRibbon } from "@/components/growth/GrowthMissionsRibbon";
import { GrowthPageCommandShell } from "@/components/growth/GrowthPageCommandShell";
import { formatDayShort } from "@/lib/utils/date-locale";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

type ParityStatus = "covered" | "bridge";
type ParityRow = {
  functionName: string;
  source: string;
  status: ParityStatus;
  note: string;
};

const parityRows: ParityRow[] = [
  {
    functionName: "Actief focus-protocol met weekcontext",
    source: "GrowthCommandCenter",
    status: "covered",
    note: "Zelfde protocol-, week- en tiercontext als de echte Growth-flow.",
  },
  {
    functionName: "Commit/sync naar Missions",
    source: "GrowthCommandCenter actions",
    status: "covered",
    note: "Zelfde server actions met created/skipped feedback via toast.",
  },
  {
    functionName: "Vooruitzicht volgende week",
    source: "GrowthBottomHubCards",
    status: "covered",
    note: "Zelfde week-outlook en resterende weken als productiestroom.",
  },
  {
    functionName: "Tier alignment engine vs protocol",
    source: "GrowthMissionsRibbon snapshot",
    status: "covered",
    note: "Live alignment signaal op basis van growth engine snapshot.",
  },
  {
    functionName: "Learning momentum signalen",
    source: "getLearningState streams",
    status: "covered",
    note: "Live momentum uit actuele sessions/books, geen mock percentages.",
  },
  {
    functionName: "Decision-block uitvoering",
    source: "Missions command deck",
    status: "bridge",
    note: "Execution loopt via /tasks?growth=1 zodat engine-prioritering centraal blijft.",
  },
];

function parityBadge(status: ParityStatus): string {
  if (status === "covered") return "border-emerald-300/35 bg-emerald-500/12 text-emerald-100";
  return "border-cyan-300/35 bg-cyan-500/12 text-cyan-100";
}

export default async function GrowthReimaginedPage() {
  await syncGrowthFocusProtocolToCalendarWeek();

  const today = todayDateString();
  const { start: budgetWeekStart, end: budgetWeekEnd } = getBudgetWeekBounds(today);
  const budgetWeekLabel = `${formatDayShort(budgetWeekStart)} – ${formatDayShort(budgetWeekEnd)}`;

  const [protocols, progressMap, growthFocus, strategyPacingHints, growthSnap, learningState] = await Promise.all([
    getProtocolLibrary("nl"),
    getProtocolProgressMap(),
    getGrowthFocus(),
    getStrategyPacingHints(),
    getGrowthEngineSnapshot(),
    getLearningState(),
  ]);

  const topStreams = learningState.streams.slice(0, 3);
  const coveredCount = parityRows.filter((item) => item.status === "covered").length;

  return (
    <GrowthPageCommandShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.26)] bg-[linear-gradient(135deg,rgba(6,18,35,0.92)_0%,rgba(12,32,58,0.86)_50%,rgba(3,10,20,0.95)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_rgba(var(--mode-rgb),0.08)] md:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">Growth Reimagined · Live</p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                Reimagined interface, <span className="text-cyan-200">zelfde kernfunctionaliteit</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Deze variant gebruikt nu dezelfde production growth-engine componenten als de echte Growth-pagina. Visuals mogen anders
                zijn, maar functies blijven gelijkwaardig.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-[var(--text-secondary)] backdrop-blur">
              <p className="font-semibold text-[var(--text-primary)]">Parity status</p>
              <p className="mt-1">
                {coveredCount}/{parityRows.length} functies covered
              </p>
              <p className="mt-1">Budgetweek: {budgetWeekLabel}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/learning"
              className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Echte Growth
            </Link>
            <Link
              href="/tasks?growth=1"
              className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              Missions execution
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Functional parity matrix</h2>
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {parityRows.map((item) => (
              <article key={item.functionName} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.functionName}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${parityBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Source: {item.source}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        {growthSnap ? <GrowthMissionsRibbon snap={growthSnap} className="!rounded-2xl" /> : null}

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Learning momentum (live)</h2>
            <p className="text-xs text-[var(--text-muted)]">Bron: learning sessions + books</p>
          </div>
          {topStreams.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Nog geen actieve streams. Voeg een stream toe in Growth.</p>
          ) : (
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {topStreams.map((stream) => (
                <article key={stream.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{stream.title}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {stream.sessionsThisWeek} sessies · last active {stream.lastActive ?? "n.v.t."}
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">Momentum {Math.round(stream.momentumScore * 100)}%</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <LearningContentClient
          protocols={protocols}
          progressMap={progressMap}
          growthFocus={growthFocus}
          strategyPacingHints={strategyPacingHints}
          budgetWeekLabel={budgetWeekLabel}
          simplified={false}
          heroSlot={
            <p className="text-center text-xs text-[var(--text-muted)]">
              Deze reimagined view draait op dezelfde growth-kern als productie: geen losse mock flow.
            </p>
          }
        />
      </div>
    </GrowthPageCommandShell>
  );
}

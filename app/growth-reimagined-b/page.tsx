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
import { GrowthProtocolCommandCard } from "@/components/growth/GrowthProtocolCommandCard";
import { formatDayShort } from "@/lib/utils/date-locale";
import { getBudgetWeekBounds } from "@/lib/utils/budget-date";
import { todayDateString } from "@/lib/utils/timezone";

export const dynamic = "force-dynamic";

type DeckParityStatus = "covered" | "bridge";
type DeckParityItem = {
  label: string;
  status: DeckParityStatus;
  note: string;
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

export default async function GrowthReimaginedBPage() {
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
  const covered = deckParity.filter((item) => item.status === "covered").length;

  return (
    <GrowthPageCommandShell>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative z-[1]">
            <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/90">Growth Concept B · Live</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl">
              Command-deck stijl met <span className="text-cyan-200">echte growth-engine functies</span>
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200/85">
              Deze variant blijft visueel agressiever, maar draait nu op dezelfde productiecomponenten en server-data als de kern Growth-pagina.
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
              <Link
                href="/learning"
                className="rounded-lg border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-white"
              >
                Echte Growth
              </Link>
              <Link
                href="/tasks?growth=1"
                className="rounded-lg border border-cyan-300/35 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
              >
                Missions deck
              </Link>
            </div>
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

        <GrowthProtocolCommandCard protocols={protocols} progressMap={progressMap} growthFocus={growthFocus} />

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

        <LearningContentClient
          protocols={protocols}
          progressMap={progressMap}
          growthFocus={growthFocus}
          strategyPacingHints={strategyPacingHints}
          budgetWeekLabel={budgetWeekLabel}
          simplified={false}
          heroSlot={
            <p className="text-center text-xs text-[var(--text-muted)]">
              Concept B gebruikt live growth-data: dezelfde functionele ruggengraat, andere command-deck presentatie.
            </p>
          }
        />
      </div>
    </GrowthPageCommandShell>
  );
}

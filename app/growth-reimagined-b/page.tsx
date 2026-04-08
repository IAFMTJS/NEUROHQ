type PulseMetric = {
  label: string;
  value: string;
  trend: string;
};

type ArcNode = {
  phase: string;
  title: string;
  objective: string;
  completion: number;
};

type CommandItem = {
  stream: string;
  mission: string;
  effort: string;
  expectedReturn: string;
};

const pulseMetrics: PulseMetric[] = [
  { label: "Execution coherence", value: "81%", trend: "+7 this cycle" },
  { label: "Cognitive reserve", value: "68", trend: "+10 recovery points" },
  { label: "Intent fidelity", value: "88%", trend: "+4 adherence" },
  { label: "Overload risk", value: "29%", trend: "-11 risk drift" },
];

const arc: ArcNode[] = [
  {
    phase: "Phase 01",
    title: "Stabilize",
    objective: "Basisritme vastzetten met herhaalbare focusblokken.",
    completion: 100,
  },
  {
    phase: "Phase 02",
    title: "Amplify",
    objective: "Output verhogen zonder extra mentale frictie.",
    completion: 73,
  },
  {
    phase: "Phase 03",
    title: "Integrate",
    objective: "Reflectie, transfer en duurzame gewoonteborging.",
    completion: 34,
  },
];

const commandDeck: CommandItem[] = [
  {
    stream: "Focus Engine",
    mission: "2x 50 min deep block met recovery reset",
    effort: "110 min",
    expectedReturn: "High clarity output",
  },
  {
    stream: "Decision Engine",
    mission: "Daily decision brief (context, options, confidence)",
    effort: "25 min",
    expectedReturn: "Faster high-quality choices",
  },
  {
    stream: "Social Engine",
    mission: "Pre-meeting intent + post-meeting decompression",
    effort: "30 min",
    expectedReturn: "Lower spillover stress",
  },
];

export default function GrowthReimaginedBPage() {
  return (
    <div className="container page page-wide dashboard-cinematic relative z-10 pb-12">
      <div className="hq-frosted-main-shell">
        <div className="space-y-6 rounded-[22px] border border-[rgba(var(--mode-rgb),0.24)] bg-[radial-gradient(circle_at_20%_0%,rgba(0,224,255,0.16),transparent_38%),radial-gradient(circle_at_100%_0%,rgba(153,96,255,0.2),transparent_44%),linear-gradient(160deg,rgba(4,9,19,0.95)_0%,rgba(8,20,38,0.9)_52%,rgba(3,8,18,0.96)_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] md:space-y-8 md:p-7">
          <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="relative z-[1]">
              <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-200/90">Growth Concept B</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Command-center stijl: minder “page”, meer <span className="text-cyan-200">live operating console</span>
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200/85">
                Deze variant leunt zwaarder op premium sci-fi visuals, sterkere gloed, hogere contrastlagen en een command-deck opzet.
                Mock data toont hoe inhoud + stijl samen een duidelijk “growth control room” kunnen maken.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/15 px-3 py-1 text-xs text-cyan-100">
                <span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                Simulation mode · mock telemetry
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {pulseMetrics.map((metric) => (
              <article
                key={metric.label}
                className="rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 backdrop-blur-md"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
                <p className="mt-2 text-xs text-cyan-200">{metric.trend}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Growth Arc Timeline</h2>
                <p className="text-xs text-slate-300">Phase-based progression</p>
              </div>
              <div className="mt-4 space-y-3">
                {arc.map((node) => (
                  <div key={node.phase} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-cyan-200">{node.phase}</p>
                      <p className="text-xs text-slate-300">{node.completion}%</p>
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-white">{node.title}</h3>
                    <p className="mt-2 text-sm text-slate-200/90">{node.objective}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300"
                        style={{ width: `${node.completion}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <h2 className="text-lg font-semibold text-white">Neuro Signals</h2>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Focus stability", value: 82, tone: "from-cyan-300 to-cyan-500" },
                  { label: "Decision confidence", value: 66, tone: "from-violet-300 to-violet-500" },
                  { label: "Recovery quality", value: 74, tone: "from-emerald-300 to-emerald-500" },
                ].map((signal) => (
                  <div key={signal.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>{signal.label}</span>
                      <span>{signal.value}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10">
                      <div className={`h-1.5 rounded-full bg-gradient-to-r ${signal.tone}`} style={{ width: `${signal.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Command Deck</h2>
              <p className="text-xs text-slate-300">Van inzicht naar directe weekly execution</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {commandDeck.map((item) => (
                <article key={item.stream} className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-cyan-100">{item.stream}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item.mission}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-200">
                    <span>Effort: {item.effort}</span>
                    <span className="text-cyan-100">{item.expectedReturn}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

type GrowthStat = {
  label: string;
  value: string;
  delta: string;
  positive?: boolean;
};

type GrowthTrack = {
  name: string;
  intent: string;
  cadence: string;
  completion: number;
  focus: string;
  signal: "on-track" | "watch" | "risk";
};

type GrowthMission = {
  day: string;
  title: string;
  duration: string;
  impact: "high" | "medium";
  tag: string;
};

type GrowthExperiment = {
  title: string;
  hypothesis: string;
  metric: string;
  status: "running" | "planned" | "validated";
};

const growthStats: GrowthStat[] = [
  { label: "Momentum score", value: "78", delta: "+9 vs vorige week", positive: true },
  { label: "Diep werk uren", value: "11.5u", delta: "+2.1u week-op-week", positive: true },
  { label: "Protocol adherence", value: "84%", delta: "+6% consistency" },
  { label: "Stress load", value: "42", delta: "-8 drukpunten", positive: true },
];

const tracks: GrowthTrack[] = [
  {
    name: "Cognitive Endurance",
    intent: "Langere focusblokken zonder mentale drop.",
    cadence: "5x per week",
    completion: 86,
    focus: "2x 60 min deep blocks + recovery ritual",
    signal: "on-track",
  },
  {
    name: "Leadership Voice",
    intent: "Beter communiceren in meetings en 1:1's.",
    cadence: "3x per week",
    completion: 62,
    focus: "Reflectie na meetings + feedback loop",
    signal: "watch",
  },
  {
    name: "Decision Quality",
    intent: "Sneller knopen doorhakken met minder twijfel.",
    cadence: "Dagelijks",
    completion: 41,
    focus: "Decision journal + confidence calibration",
    signal: "risk",
  },
];

const missions: GrowthMission[] = [
  { day: "Ma", title: "Deep Work Sprint + pre-focus priming", duration: "75 min", impact: "high", tag: "Focus" },
  { day: "Di", title: "Decision Journal (3 cases)", duration: "35 min", impact: "high", tag: "Clarity" },
  { day: "Wo", title: "Leadership replay + communication drill", duration: "40 min", impact: "medium", tag: "Communication" },
  { day: "Do", title: "Cognitive load reset + walk protocol", duration: "30 min", impact: "medium", tag: "Recovery" },
  { day: "Vr", title: "Weekly Growth Debrief + scorecard", duration: "45 min", impact: "high", tag: "Review" },
];

const experiments: GrowthExperiment[] = [
  {
    title: "Morning Dopamine Guardrail",
    hypothesis: "Geen social apps voor 90 min verhoogt focuskwaliteit met 15%.",
    metric: "Focus quality avg per block",
    status: "running",
  },
  {
    title: "Pre-Meeting Intent Card",
    hypothesis: "1 minuut intent vooraf verlaagt meeting spillover stress.",
    metric: "Stress load post-meeting",
    status: "planned",
  },
  {
    title: "3-Question Evening Review",
    hypothesis: "Korte avondreflectie verhoogt protocol adherence op weekbasis.",
    metric: "Adherence % per week",
    status: "validated",
  },
];

function signalBadge(signal: GrowthTrack["signal"]) {
  if (signal === "on-track") return "border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
  if (signal === "watch") return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-rose-400/35 bg-rose-500/15 text-rose-100";
}

function signalLabel(signal: GrowthTrack["signal"]) {
  if (signal === "on-track") return "On track";
  if (signal === "watch") return "Watch";
  return "Risk";
}

function experimentBadge(status: GrowthExperiment["status"]) {
  if (status === "running") return "border-cyan-300/30 bg-cyan-500/15 text-cyan-100";
  if (status === "validated") return "border-emerald-300/30 bg-emerald-500/15 text-emerald-100";
  return "border-indigo-300/30 bg-indigo-500/15 text-indigo-100";
}

export default function GrowthReimaginedPage() {
  return (
    <div className="container page page-wide dashboard-cinematic relative z-10 pb-12">
      <div className="hq-frosted-main-shell space-y-6 md:space-y-8">
        <section className="overflow-hidden rounded-2xl border border-[rgba(var(--mode-rgb),0.26)] bg-[linear-gradient(135deg,rgba(6,18,35,0.92)_0%,rgba(12,32,58,0.86)_50%,rgba(3,10,20,0.95)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_rgba(var(--mode-rgb),0.08)] md:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--semantic-accent)]/90">
            Growth Reimagined
          </p>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                Van losse progress naar een <span className="text-cyan-200">strategisch growth operating system</span>
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
                Deze standalone conceptpagina laat zien hoe Growth visueel sterker, inhoudelijk scherper en beter gekoppeld aan je
                weekritme kan werken. Alles hieronder is mock data om richting en UX-flow te valideren.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-[var(--text-secondary)] backdrop-blur">
              <p className="font-semibold text-[var(--text-primary)]">Current cycle</p>
              <p className="mt-1">Week 11 · Q2 Growth Arc</p>
              <p className="mt-1">Primary intent: Sustainable high performance</p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {growthStats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className={`mt-2 text-xs ${stat.positive ? "text-emerald-200" : "text-[var(--text-secondary)]"}`}>{stat.delta}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <article className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Active Growth Tracks</h2>
              <p className="text-xs text-[var(--text-muted)]">Intent-driven in plaats van losse lijstjes</p>
            </div>
            <div className="mt-4 space-y-3">
              {tracks.map((track) => (
                <div key={track.name} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{track.name}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${signalBadge(track.signal)}`}>
                      {signalLabel(track.signal)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{track.intent}</p>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">{track.focus}</p>
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-muted)]">
                      <span>{track.cadence}</span>
                      <span>{track.completion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-400/80 to-blue-300/80"
                        style={{ width: `${track.completion}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Narrative Coach</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Je consistency stijgt, maar besluitkwaliteit daalt op dagen met veel context-switching.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-3">Plan max 2 decision-heavy taken op dezelfde dag.</li>
              <li className="rounded-lg border border-white/10 bg-black/20 p-3">Blokkeer 15 min decompression na meetings.</li>
              <li className="rounded-lg border border-white/10 bg-black/20 p-3">Houd vrijdag als review+integration in plaats van execution.</li>
            </ul>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Weekplan met impact-prioriteit</h2>
            <div className="mt-4 space-y-2">
              {missions.map((mission) => (
                <div key={`${mission.day}-${mission.title}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="w-9 shrink-0 rounded-md border border-white/15 bg-white/5 py-1 text-center text-xs font-semibold text-[var(--text-primary)]">
                    {mission.day}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{mission.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {mission.duration} · {mission.tag}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      mission.impact === "high" ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-[var(--text-secondary)]"
                    }`}
                  >
                    {mission.impact}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Friction Radar</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">Top 3 blockers op basis van patroonherkenning in mock telemetry.</p>
            <div className="mt-4 space-y-2">
              {[
                { label: "Meeting spillover", value: 71 },
                { label: "Late-start mornings", value: 58 },
                { label: "Task switching", value: 64 },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{item.label}</span>
                    <span>{item.value}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-fuchsia-300/80 to-rose-300/80" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--bg-elevated)]/55 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Experiment Pipeline</h2>
            <p className="text-xs text-[var(--text-muted)]">Growth als iteratief systeem: hypothese → interventie → resultaat</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {experiments.map((experiment) => (
              <article key={experiment.title} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{experiment.title}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${experimentBadge(experiment.status)}`}>
                    {experiment.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">{experiment.hypothesis}</p>
                <p className="mt-3 text-[11px] text-[var(--text-muted)]">Metric: {experiment.metric}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { HQPageHeader } from "@/components/hq";
import { getWeekBounds } from "@/lib/utils/learning";
import { getWeekSummary, getAnalyticsRange } from "@/app/actions/analytics";
import { getAnalyticsFunnel } from "@/app/actions/analytics-funnel";
import { getWeeklyLearningTarget } from "@/app/actions/learning";

function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min ? `${h}h ${min}m` : `${h}h`;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = ((userRow as { role?: string | null } | null)?.role ?? "user") === "admin";

  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const learningTarget = await getWeeklyLearningTarget();
  const [summary, thisWeekDays, lastWeekSummary, funnel] = await Promise.all([
    getWeekSummary(weekStart, weekEnd, learningTarget),
    getAnalyticsRange(weekStart, weekEnd),
    (async () => {
      const lastMonday = new Date(today);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const { start: s, end: e } = getWeekBounds(lastMonday);
      return getWeekSummary(s, e, learningTarget);
    })(),
    getAnalyticsFunnel(8),
  ]);

  const taskPct = summary && summary.totalTasksPlanned > 0
    ? Math.round((summary.totalTasksCompleted / summary.totalTasksPlanned) * 100)
    : 0;
  const learningHit = summary ? summary.totalLearningMinutes >= summary.learningTargetMinutes : false;

  return (
    <div className="container page page-wide space-y-6">
      <div className="flex items-center justify-between gap-3">
        <HQPageHeader
          title="Analytics"
          subtitle="Time used, consistency, and mood over time."
          backHref="/dashboard"
        />
        {isAdmin && (
          <Link
            href="/analytics/maker"
            className="text-[11px] font-semibold text-[var(--accent-focus)] underline-offset-2 hover:underline"
          >
            Maker dashboard
          </Link>
        )}
      </div>
      <section className="mascot-hero mascot-hero-top mascot-hero-sharp" data-mascot-page="analytics" aria-hidden>
        <div className="mascot-hero-inner mx-auto">
          <HeroMascotImage page="analytics" className="mascot-img" />
        </div>
      </section>
      {summary && (
        <section className="glass-card overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">This week</h2>
            <p className="text-xs text-[var(--text-muted)]">{weekStart} – {weekEnd}</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Check-ins</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{summary.daysWithCheckIn} days</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Tasks done</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{summary.totalTasksCompleted} / {summary.totalTasksPlanned} ({taskPct}%)</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Learning</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{formatMinutes(summary.totalLearningMinutes)} / {summary.learningTargetMinutes} min {learningHit ? "✓" : ""}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Focus time</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{formatMinutes(Math.floor(summary.activeSeconds / 60))}</p>
              </div>
            </div>
            {(summary.avgEnergy != null || summary.avgFocus != null || summary.avgLoad != null) && (
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Mood (avg this week)</p>
                <div className="flex gap-4 text-sm">
                  {summary.avgEnergy != null && <span className="text-[var(--text-primary)]">Energy {summary.avgEnergy.toFixed(1)}/10</span>}
                  {summary.avgFocus != null && <span className="text-[var(--text-primary)]">Focus {summary.avgFocus.toFixed(1)}/10</span>}
                  {summary.avgLoad != null && <span className="text-[var(--text-primary)]">Load {summary.avgLoad.toFixed(1)}/10</span>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {lastWeekSummary && summary && (
        <section className="glass-card p-4">
          <h2 className="text-base font-semibold text-[var(--text-primary)] mb-3">Vs last week</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-[var(--text-muted)]">Tasks completed</span>
              <span className="text-[var(--text-primary)]">{summary.totalTasksCompleted} vs {lastWeekSummary.totalTasksCompleted}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[var(--text-muted)]">Learning</span>
              <span className="text-[var(--text-primary)]">{formatMinutes(summary.totalLearningMinutes)} vs {formatMinutes(lastWeekSummary.totalLearningMinutes)}</span>
            </li>
            {summary.avgEnergy != null && lastWeekSummary.avgEnergy != null && (
              <li className="flex justify-between">
                <span className="text-[var(--text-muted)]">Avg energy</span>
                <span className="text-[var(--text-primary)]">{summary.avgEnergy.toFixed(1)} vs {lastWeekSummary.avgEnergy.toFixed(1)}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {thisWeekDays.length > 0 && (
        <section className="glass-card overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Day by day</h2>
          </div>
          <ul className="divide-y divide-[var(--card-border)]">
            {thisWeekDays.map((d) => (
              <li key={d.date} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[var(--text-muted)]">{d.date}</span>
                <span className="text-[var(--text-primary)]">
                  {d.tasks_completed} tasks · {d.learning_minutes} min learning{d.brain_status_logged ? " · check-in" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!summary && thisWeekDays.length === 0 && (
        <p className="text-sm text-[var(--text-muted)]">Complete tasks and log brain status to see analytics.</p>
      )}

      {funnel.length > 0 && (
        <>
          <section className="glass-card p-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              Onboarding funnel (signup → eerste completion)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Unieke users per stap; conversie tussen stappen (laatste weken).
            </p>
            <div className="mt-3 space-y-4">
              {funnel.slice(-4).map((week) => (
                <div
                  key={week.weekStart}
                  className="rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-surface)]/60 p-3"
                >
                  <div className="flex items-baseline justify-between text-xs text-[var(--text-muted)]">
                    <span>
                      Week {week.weekStart} – {week.weekEnd}
                    </span>
                    <span>
                      Sign‑ups:{" "}
                      <strong className="text-[var(--text-primary)]">
                        {week.onboarding[0]?.users ?? 0}
                      </strong>
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {week.onboarding.map((step, index) => (
                      <div key={step.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-secondary)]">
                            {step.label}
                          </span>
                          <span className="text-[var(--text-primary)]">
                            {step.users}
                            {index > 0 &&
                              step.conversionFromPrevious != null && (
                                <span className="ml-1 text-[var(--text-muted)]">
                                  (
                                  {Math.round(
                                    step.conversionFromPrevious * 100
                                  )}
                                  %)
                                </span>
                              )}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-[var(--accent-focus)]"
                            style={{
                              width: `${
                                week.onboarding[0]?.users
                                  ? Math.min(
                                      100,
                                      (step.users /
                                        Math.max(
                                          1,
                                          week.onboarding[0].users
                                        )) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card p-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              Missions funnel (Add → Start → Complete)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Hoeveel users doorlopen de missions‑stappen per week.
            </p>
            <div className="mt-3 space-y-4">
              {funnel.slice(-4).map((week) => (
                <div
                  key={week.weekStart}
                  className="rounded-lg border border-[var(--card-border)]/60 bg-[var(--bg-surface)]/60 p-3"
                >
                  <div className="flex items-baseline justify-between text-xs text-[var(--text-muted)]">
                    <span>
                      Week {week.weekStart} – {week.weekEnd}
                    </span>
                    <span>
                      Add → Complete:{" "}
                      <strong className="text-[var(--text-primary)]">
                        {week.missions[0]?.users ?? 0} →{" "}
                        {week.missions[week.missions.length - 1]?.users ?? 0}
                      </strong>
                    </span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {week.missions.map((step, index) => (
                      <div key={step.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--text-secondary)]">
                            {step.label}
                          </span>
                          <span className="text-[var(--text-primary)]">
                            {step.users}
                            {index > 0 &&
                              step.conversionFromPrevious != null && (
                                <span className="ml-1 text-[var(--text-muted)]">
                                  (
                                  {Math.round(
                                    step.conversionFromPrevious * 100
                                  )}
                                  %)
                                </span>
                              )}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-[var(--accent-focus)]"
                            style={{
                              width: `${
                                week.missions[0]?.users
                                  ? Math.min(
                                      100,
                                      (step.users /
                                        Math.max(
                                          1,
                                          week.missions[0].users
                                        )) * 100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

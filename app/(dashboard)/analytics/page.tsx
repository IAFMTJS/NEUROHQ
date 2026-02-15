import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeekBounds } from "@/lib/utils/learning";
import { getWeekSummary, getAnalyticsRange } from "@/app/actions/analytics";
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

  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const learningTarget = await getWeeklyLearningTarget();
  const [summary, thisWeekDays, lastWeekSummary] = await Promise.all([
    getWeekSummary(weekStart, weekEnd, learningTarget),
    getAnalyticsRange(weekStart, weekEnd),
    (async () => {
      const lastMonday = new Date(today);
      lastMonday.setDate(lastMonday.getDate() - 7);
      const { start: s, end: e } = getWeekBounds(lastMonday);
      return getWeekSummary(s, e, learningTarget);
    })(),
  ]);

  const taskPct = summary && summary.totalTasksPlanned > 0
    ? Math.round((summary.totalTasksCompleted / summary.totalTasksPlanned) * 100)
    : 0;
  const learningHit = summary ? summary.totalLearningMinutes >= summary.learningTargetMinutes : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Analytics</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Time used, consistency, and mood over time.
        </p>
      </div>

      {summary && (
        <section className="card-modern overflow-hidden p-0">
          <div className="border-b border-[var(--neuro-border)] px-4 py-3">
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
        <section className="card-modern p-4">
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
        <section className="card-modern overflow-hidden p-0">
          <div className="border-b border-[var(--neuro-border)] px-4 py-3">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Day by day</h2>
          </div>
          <ul className="divide-y divide-[var(--neuro-border)]">
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
    </div>
  );
}

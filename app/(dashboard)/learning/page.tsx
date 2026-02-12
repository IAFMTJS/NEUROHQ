import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyMinutes, getLearningStreak, getEducationOptions, getLearningSessions, getMonthlyBookForCurrentMonth } from "@/app/actions/learning";
import { LearningProgress } from "@/components/LearningProgress";
import { AddLearningSessionForm } from "@/components/AddLearningSessionForm";
import { AddEducationOptionForm } from "@/components/AddEducationOptionForm";
import { EducationOptionsList } from "@/components/EducationOptionsList";
import { LearningRecentSessions } from "@/components/LearningRecentSessions";
import { LearningTips } from "@/components/LearningTips";
import { MonthlyBookBlock } from "@/components/MonthlyBookBlock";

export default async function LearningPage() {
  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const [minutes, streak, options, sessionsThisWeek, monthlyBook] = await Promise.all([
    getWeeklyMinutes(weekStart, weekEnd),
    getLearningStreak(),
    getEducationOptions(),
    getLearningSessions(weekStart, weekEnd),
    getMonthlyBookForCurrentMonth(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Learning</h1>
        <p className="mt-1 text-sm text-neuro-muted">Weekly minutes, streak, education options, and recent sessions.</p>
      </div>

      <section>
        <LearningProgress
          minutes={minutes}
          target={60}
          streak={streak}
          weekStart={weekStart}
          weekEnd={weekEnd}
        />
      </section>

      <LearningTips />

      <MonthlyBookBlock initial={monthlyBook ? { title: monthlyBook.title, completed_at: monthlyBook.completed_at } : null} />

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Log session</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Record time spent learning.</p>
        </div>
        <div className="p-4">
          <AddLearningSessionForm date={today.toISOString().slice(0, 10)} />
        </div>
      </section>

      <LearningRecentSessions sessions={sessionsThisWeek} weekEnd={weekEnd} />

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Education options</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Clarity score: interest + future value − effort.</p>
        </div>
        <div className="p-4">
          <AddEducationOptionForm />
          <div className="mt-4">
            <EducationOptionsList options={options} />
          </div>
        </div>
      </section>
    </div>
  );
}

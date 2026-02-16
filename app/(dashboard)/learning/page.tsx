import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyMinutes, getWeeklyLearningTarget, getLearningStreak, getEducationOptions, getLearningSessions, getPastTopics, getTopicBreakdown, getMonthlyLearningWeeks, getMonthlyBooksForCurrentMonth, getMonthlyBookForCurrentMonth, getTotalLearningMinutes, getMonthlyBooksHistory } from "@/app/actions/learning";
import { LearningProgress } from "@/components/LearningProgress";
import { AddLearningSessionForm } from "@/components/AddLearningSessionForm";
import { AddEducationOptionForm } from "@/components/AddEducationOptionForm";
import { EducationOptionsList } from "@/components/EducationOptionsList";
import { LearningRecentSessions } from "@/components/LearningRecentSessions";
import { LearningTips } from "@/components/LearningTips";
import { MonthlyBookBlock } from "@/components/MonthlyBookBlock";
import { ClarityExplain } from "@/components/ClarityExplain";
import { LearningTopicBreakdown } from "@/components/LearningTopicBreakdown";
import { LearningMonthlyView } from "@/components/LearningMonthlyView";
import { LearningExportCSV } from "@/components/LearningExportCSV";
import { LearningMilestone } from "@/components/LearningMilestone";
import { LearningNudge } from "@/components/LearningNudge";
import { MonthlyBooksHistory } from "@/components/MonthlyBooksHistory";
import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { GrowthStrategyBanner } from "@/components/GrowthStrategyBanner";

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  const params = await searchParams;
  const towardOptionId = params.toward ?? null;
  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;
  const [minutes, target, streak, options, sessionsThisWeek, pastTopics, topicBreakdown, monthlyWeeks, monthlyBooks, monthlyBookFirst, totalMinutes, booksHistory, strategy] = await Promise.all([
    getWeeklyMinutes(weekStart, weekEnd),
    getWeeklyLearningTarget(),
    getLearningStreak(),
    getEducationOptions(),
    getLearningSessions(weekStart, weekEnd),
    getPastTopics(),
    getTopicBreakdown(weekStart, weekEnd),
    getMonthlyLearningWeeks(thisYear, thisMonth),
    getMonthlyBooksForCurrentMonth(),
    getMonthlyBookForCurrentMonth(),
    getTotalLearningMinutes(),
    getMonthlyBooksHistory(),
    getQuarterlyStrategy(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Growth</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Learning & growth — weekly minutes, streak, education options, and recent sessions.</p>
        <div className="mt-3">
          <GrowthStrategyBanner strategy={strategy} />
        </div>
      </div>

      <section>
        <LearningProgress
          minutes={minutes}
          target={target}
          streak={streak}
          weekStart={weekStart}
          weekEnd={weekEnd}
          totalMinutes={totalMinutes}
        />
      </section>

      <LearningTips />

      <MonthlyBookBlock
        initial={monthlyBookFirst ? { title: monthlyBookFirst.title, completed_at: monthlyBookFirst.completed_at } : null}
        books={monthlyBooks.map((b) => ({ id: b.id, title: b.title, completed_at: b.completed_at, pages_per_day: b.pages_per_day, chapters_per_week: b.chapters_per_week }))}
      />
      {booksHistory.length > 0 && <MonthlyBooksHistory books={booksHistory} />}

      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Log session</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Record time spent learning. Quick-add presets or custom minutes.</p>
        </div>
        <div className="p-4">
          <AddLearningSessionForm
            date={today.toISOString().slice(0, 10)}
            targetMinutes={target}
            educationOptions={options.filter((o) => !(o as { archived_at?: string | null }).archived_at).map((o) => ({ id: o.id, name: o.name }))}
            pastTopics={pastTopics}
            initialEducationOptionId={towardOptionId}
          />
        </div>
      </section>

      {(topicBreakdown.length > 0 || monthlyWeeks.length > 0) && (
        <section className="card-modern overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)] px-4 py-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">This week & month</h2>
            <LearningExportCSV />
          </div>
          <div className="p-4 flex flex-wrap gap-4">
            {topicBreakdown.length > 0 && <LearningTopicBreakdown breakdown={topicBreakdown} />}
            {monthlyWeeks.length > 0 && <LearningMonthlyView weeks={monthlyWeeks} target={target} />}
          </div>
        </section>
      )}

      <LearningRecentSessions
        sessions={sessionsThisWeek}
        weekEnd={weekEnd}
        weekStart={weekStart}
      />

      <section className="card-modern overflow-hidden p-0" id="education-options">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Education options</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Compare paths by clarity. Higher = better fit.</p>
          <ClarityExplain />
        </div>
        <div className="p-4">
          <AddEducationOptionForm />
          <div className="mt-4">
            <EducationOptionsList options={options} logSessionHref="/learning" />
          </div>
        </div>
      </section>
    </div>
  );
}

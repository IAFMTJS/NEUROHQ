import dynamic from "next/dynamic";
import { getMascotSrcForPage } from "@/lib/mascots";
import { HQPageHeader } from "@/components/hq";
import { CommanderXPBar, CommanderSkillTree } from "@/components/commander";
import { getXP } from "@/app/actions/xp";
import { getWeekBounds } from "@/lib/utils/learning";
import { getWeeklyMinutes, getWeeklyLearningTarget, getLearningStreak, getEducationOptions, getLearningSessions, getPastTopics, getTopicBreakdown, getMonthlyLearningWeeks, getMonthlyBooksForCurrentMonth, getMonthlyBookForCurrentMonth, getTotalLearningMinutes, getMonthlyBooksHistory } from "@/app/actions/learning";
import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getBehaviorState, getStudyPlan } from "@/app/actions/behavior";

const GrowthStrategyBanner = dynamic(() => import("@/components/GrowthStrategyBanner").then((m) => ({ default: m.GrowthStrategyBanner })), { loading: () => <div className="min-h-[56px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const BehaviorEngine = dynamic(() => import("@/components/behavior/BehaviorEngine").then((m) => ({ default: m.BehaviorEngine })), { loading: () => <div className="min-h-[100px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const LearningProgress = dynamic(() => import("@/components/LearningProgress").then((m) => ({ default: m.LearningProgress })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const StudyPlanSettings = dynamic(() => import("@/components/behavior/StudyPlanSettings").then((m) => ({ default: m.StudyPlanSettings })), { loading: () => null });
const LearningTips = dynamic(() => import("@/components/LearningTips").then((m) => ({ default: m.LearningTips })), { loading: () => null });
const MonthlyBookBlock = dynamic(() => import("@/components/MonthlyBookBlock").then((m) => ({ default: m.MonthlyBookBlock })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const MonthlyBooksHistory = dynamic(() => import("@/components/MonthlyBooksHistory").then((m) => ({ default: m.MonthlyBooksHistory })), { loading: () => null });
const AddLearningSessionForm = dynamic(() => import("@/components/AddLearningSessionForm").then((m) => ({ default: m.AddLearningSessionForm })), { loading: () => <div className="min-h-[180px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const LearningTopicBreakdown = dynamic(() => import("@/components/LearningTopicBreakdown").then((m) => ({ default: m.LearningTopicBreakdown })), { loading: () => null });
const LearningMonthlyView = dynamic(() => import("@/components/LearningMonthlyView").then((m) => ({ default: m.LearningMonthlyView })), { loading: () => null });
const LearningExportCSV = dynamic(() => import("@/components/LearningExportCSV").then((m) => ({ default: m.LearningExportCSV })), { loading: () => null });
const LearningRecentSessions = dynamic(() => import("@/components/LearningRecentSessions").then((m) => ({ default: m.LearningRecentSessions })), { loading: () => <div className="min-h-[120px] animate-pulse rounded-xl bg-white/5" aria-hidden /> });
const AddEducationOptionForm = dynamic(() => import("@/components/AddEducationOptionForm").then((m) => ({ default: m.AddEducationOptionForm })), { loading: () => null });
const EducationOptionsList = dynamic(() => import("@/components/EducationOptionsList").then((m) => ({ default: m.EducationOptionsList })), { loading: () => <div className="min-h-[80px] animate-pulse rounded-lg bg-white/5" aria-hidden /> });
const ClarityExplain = dynamic(() => import("@/components/ClarityExplain").then((m) => ({ default: m.ClarityExplain })), { loading: () => null });

type Props = { searchParams: Promise<{ toward?: string }> };

export default async function LearningPage({ searchParams }: Props) {
  const params = await searchParams;
  const towardOptionId = params.toward ?? null;
  const today = new Date();
  const { start: weekStart, end: weekEnd } = getWeekBounds(today);
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;
  const [xp, minutes, target, streak, options, sessionsThisWeek, pastTopics, topicBreakdown, monthlyWeeks, monthlyBooks, monthlyBookFirst, totalMinutes, booksHistory, strategy, behaviorState, studyPlan] = await Promise.all([
    getXP(),
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
    getBehaviorState(),
    getStudyPlan(),
  ]);

  const commanderSkills = [
    { id: "focus1", label: "Focus I", unlocked: xp.level >= 1 },
    { id: "focus2", label: "Focus II", unlocked: xp.level >= 3 },
    { id: "deepFocus", label: "Deep Focus", unlocked: xp.level >= 6 },
  ];

  return (
    <div className="container page space-y-6">
      <HQPageHeader
        title="Growth"
        subtitle="Learning & growth — weekly minutes, streak, education options, and recent sessions."
        backHref="/dashboard"
      />
      <section className="mascot-hero mascot-hero-top" data-mascot-page="learning" aria-hidden>
        <img src={getMascotSrcForPage("learning")} alt="" className="mascot-img" />
      </section>
      <div className="-mt-2">
        <GrowthStrategyBanner strategy={strategy} />
      </div>

      <CommanderXPBar totalXP={xp.total_xp} />
      <CommanderSkillTree skills={commanderSkills} />

      <BehaviorEngine 
        hasMonthlyBook={monthlyBooks.length > 0} 
        hasEducationOptions={options.length > 0}
        hasStudyPlan={studyPlan.dailyGoalMinutes > 0}
        currentStreak={streak}
      />

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

      <StudyPlanSettings initialPlan={studyPlan} />

      <LearningTips />

      <MonthlyBookBlock
        initial={monthlyBookFirst ? { title: monthlyBookFirst.title, completed_at: monthlyBookFirst.completed_at } : null}
        books={monthlyBooks.map((b) => ({ id: b.id, title: b.title, completed_at: b.completed_at, pages_per_day: b.pages_per_day, chapters_per_week: b.chapters_per_week }))}
      />
      {booksHistory.length > 0 && <MonthlyBooksHistory books={booksHistory} />}

      <section className="card-simple overflow-hidden p-0">
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
        <section className="card-simple overflow-hidden p-0">
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

      <section className="card-simple overflow-hidden p-0" id="education-options">
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

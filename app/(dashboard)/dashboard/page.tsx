import Link from "next/link";
import Image from "next/image";
import { ensureUserProfileForSession } from "@/app/actions/auth";
import { getDailyState } from "@/app/actions/daily-state";
import { getTodaysTasks, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getQuoteForDay } from "@/app/actions/quote";
import { getEnergyBudget } from "@/app/actions/energy";
import { getUpcomingCalendarEvents, hasGoogleCalendarToken } from "@/app/actions/calendar";
import { getRealityReport } from "@/app/actions/report";
import { getQuarterlyStrategy } from "@/app/actions/strategy";
import { getLearningStreak, getWeeklyMinutes, getWeeklyLearningTarget } from "@/app/actions/learning";
import { getBudgetSettings, getCurrentMonthExpensesCents } from "@/app/actions/budget";
import { getWeekBounds } from "@/lib/utils/learning";
import { getCurrencySymbol } from "@/lib/utils/currency";
import {
  HQHeader,
  BrainStatusCard,
  ActiveMissionCard,
  PatternInsightCard,
} from "@/components/hq";
import { QuoteCard } from "@/components/QuoteCard";
import { EnergyBudgetBar } from "@/components/EnergyBudgetBar";
import { ModeBanner } from "@/components/ModeBanner";
import { AvoidanceNotice } from "@/components/AvoidanceNotice";
import { FocusBlock } from "@/components/FocusBlock";
import { RealityReportBlock } from "@/components/RealityReportBlock";
import { OnTrackCard } from "@/components/OnTrackCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { AddCalendarEventForm } from "@/components/AddCalendarEventForm";
import { UpcomingCalendarList } from "@/components/UpcomingCalendarList";

function scale1To10ToPct(value: number | null): number {
  if (value == null) return 50;
  return Math.round((value / 10) * 100);
}

function defaultTimeWindow(): { window: string; isActive: boolean } {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;

  if (h < 12) {
    const start = 9 * 60; const end = 11 * 60 + 30;
    return { window: "09:00–11:30", isActive: mins >= start && mins <= end };
  }
  if (h < 17) {
    const start = 14 * 60; const end = 16 * 60 + 30;
    return { window: "14:00–16:30", isActive: mins >= start && mins <= end };
  }
  const start = 17 * 60 + 45; const end = 19 * 60 + 15;
  return {
    window: "17:45–19:15",
    isActive: mins >= start && mins <= end,
  };
}

function defaultInsight(energy: number, focus: number, load: number): string {
  const hour = new Date().getHours();
  if (load >= 70 && energy < 50)
    return "High load with lower energy. Single priority task recommended.";
  if (focus >= 70)
    return "Focus peak. Schedule deep work or complex tasks now.";
  if (energy >= 70 && focus < 40)
    return "Energy up, focus lower. Optimal for admin or lighter tasks.";
  if (hour >= 16)
    return "Focus tends to decrease after 16:00. Schedule lighter tasks.";
  return "Stable baseline. Schedule your most important mission in the next 2 hours.";
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.min(365, Math.max(1, Math.floor((d.getTime() - start.getTime()) / 86400000)));
}

export default async function DashboardPage() {
  void ensureUserProfileForSession();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const quoteDay = dayOfYear(today);
  const [state, quote, mode, energyBudget, upcomingCalendarEvents, hasGoogle, learningStreak] = await Promise.all([
    getDailyState(dateStr),
    getQuoteForDay(quoteDay),
    getMode(dateStr),
    getEnergyBudget(dateStr),
    getUpcomingCalendarEvents(dateStr, 2),
    hasGoogleCalendarToken(),
    getLearningStreak(),
  ]);
  const taskMode: TaskListMode =
    mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks, carryOverCount } = await getTodaysTasks(dateStr, taskMode);

  const lastWeekDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const { start: lastWeekStart, end: lastWeekEnd } = getWeekBounds(lastWeekDate);
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekBounds(today);
  const [lastWeekReport, strategy, weeklyLearningMinutes, weeklyLearningTarget, budgetSettings, currentMonthExpenses] = await Promise.all([
    getRealityReport(lastWeekStart, lastWeekEnd),
    getQuarterlyStrategy(),
    getWeeklyMinutes(thisWeekStart, thisWeekEnd),
    getWeeklyLearningTarget(),
    getBudgetSettings(),
    getCurrentMonthExpensesCents(),
  ]);
  const spendableCents = Math.max(0, (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0));
  const budgetRemainingCents = budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;

  const energyPct = scale1To10ToPct(state?.energy ?? null);
  const focusPct = scale1To10ToPct(state?.focus ?? null);
  const loadPct = scale1To10ToPct(state?.sensory_load ?? null);

  const learningNeeded = weeklyLearningMinutes < weeklyLearningTarget;
  const todaysTasks = (tasks ?? []).map((t) => ({ id: (t as { id: string }).id, title: (t as { title: string }).title }));
  const emptyMissionMessage = learningNeeded
    ? `${weeklyLearningTarget} min this week to stay on track. Log time on Growth.`
    : "Add a task on Missions or head to Growth.";
  const emptyMissionHref = learningNeeded ? "/learning" : "/tasks";
  const { window: timeWindow, isActive: isTimeWindowActive } = defaultTimeWindow();
  const insight = defaultInsight(energyPct, focusPct, loadPct);

  return (
    <div
      className="flex flex-col pb-6 -mt-1"
      style={{ gap: "var(--hq-card-gap)" }}
    >
      <OnboardingBanner />
      <div className="flex flex-col gap-0">
        <div className="w-full -mx-[var(--hq-padding-x)] flex justify-center shrink-0 ml-0.5 pt-0" aria-hidden>
          <Image
            src="/Header Image.PNG"
            alt=""
            width={420}
            height={160}
            className="w-full max-w-[420px] h-auto object-contain object-top"
            priority
          />
        </div>
        <HQHeader
          energyPct={energyPct}
          focusPct={focusPct}
          loadPct={loadPct}
        />
      </div>
      <BrainStatusCard
        date={dateStr}
        initial={{
          energy: state?.energy ?? null,
          focus: state?.focus ?? null,
          sensory_load: state?.sensory_load ?? null,
          sleep_hours: state?.sleep_hours ?? null,
          social_load: state?.social_load ?? null,
        }}
      />
      <EnergyBudgetBar
        used={energyBudget.used}
        remaining={energyBudget.remaining}
        capacity={energyBudget.capacity}
        suggestedTaskCount={energyBudget.suggestedTaskCount}
        taskUsed={energyBudget.taskUsed}
        completedTaskCount={energyBudget.completedTaskCount}
        taskPlanned={energyBudget.taskPlanned}
        calendarCost={energyBudget.calendarCost}
      />
      <QuoteCard quote={quote} dayOfYear={quoteDay} />
      <ModeBanner mode={mode} />
      <AvoidanceNotice carryOverCount={carryOverCount} />
      <ActiveMissionCard
        tasks={todaysTasks}
        emptyMessage={emptyMissionMessage}
        emptyHref={emptyMissionHref}
        timeWindow={timeWindow}
        isTimeWindowActive={isTimeWindowActive}
      />
      {mode === "driven" && <FocusBlock />}
      <section className="card-modern overflow-hidden p-0">
        <div className="border-b border-neuro-border px-4 py-3">
          <h2 className="text-base font-semibold text-neuro-silver">Calendar</h2>
          <p className="mt-0.5 text-xs text-neuro-muted">Today and tomorrow. Events count toward your energy budget on that day.</p>
        </div>
        <div className="p-4 space-y-4">
          <UpcomingCalendarList
            upcomingEvents={upcomingCalendarEvents as { id: string; title: string | null; start_at: string; end_at: string; is_social: boolean; source: string | null }[]}
            todayStr={dateStr}
            maxDays={2}
          />
          <AddCalendarEventForm date={dateStr} hasGoogleToken={hasGoogle} />
        </div>
      </section>
      {strategy?.identity_statement && (
        <div className="card-modern px-4 py-3">
          <h2 className="text-sm font-semibold text-neuro-muted">This quarter</h2>
          <p className="mt-1 text-sm text-neuro-silver italic">&ldquo;{strategy.identity_statement}&rdquo;</p>
        </div>
      )}
      {learningStreak >= 1 && (
        <div className="card-modern-accent flex items-center gap-3 px-4 py-3">
          <span className="text-2xl" aria-hidden>🔥</span>
          <div>
            <p className="text-sm font-medium text-neuro-silver">Learning streak</p>
            <p className="text-xs text-neuro-muted">{learningStreak} week{learningStreak !== 1 ? "s" : ""} in a row (≥{weeklyLearningTarget} min)</p>
          </div>
          <Link href="/learning" className="ml-auto text-sm font-medium text-neuro-blue hover:underline">
            Growth →
          </Link>
        </div>
      )}
      {budgetRemainingCents != null && (
        <Link
          href="/budget"
          className="card-modern flex items-center gap-3 px-4 py-3 hover:bg-neuro-surface/50 transition"
        >
          <span className="text-xl font-bold tabular-nums text-neuro-silver">
            {getCurrencySymbol(budgetSettings.currency)}
            {budgetRemainingCents >= 0 ? (budgetRemainingCents / 100).toFixed(0) : (Math.abs(budgetRemainingCents) / 100).toFixed(0)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-neuro-silver">Budget remaining this month</p>
            <p className="text-xs text-neuro-muted">Spendable after savings</p>
          </div>
          <span className="ml-auto text-sm font-medium text-neuro-blue">Budget →</span>
        </Link>
      )}
      <OnTrackCard
        learningMinutes={weeklyLearningMinutes}
        learningTarget={weeklyLearningTarget}
        strategySet={!!(strategy?.identity_statement || strategy?.primary_theme)}
      />
      <RealityReportBlock report={lastWeekReport} />
      <PatternInsightCard insight={insight} detailsHref="/report" />
    </div>
  );
}

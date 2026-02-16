import Link from "next/link";
import dynamic from "next/dynamic";
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
import { getUserPreferencesOrDefaults } from "@/app/actions/preferences";
import { getXP } from "@/app/actions/xp";
import { getWeekSummary, upsertDailyAnalytics } from "@/app/actions/analytics";
import { getAdaptiveSuggestions } from "@/app/actions/adaptive";
import { getWeekBounds } from "@/lib/utils/learning";
import { getCurrencySymbol } from "@/lib/utils/currency";
import { yesterdayDate, getDayOfYearFromDateString } from "@/lib/utils/timezone";
import { HQHeader, BrainStatusCard, ActiveMissionCard, WatNuBlock, HQShortcutGrid, RadialMeter } from "@/components/hq";
import { HeroMascotImage } from "@/components/HeroMascotImage";
import { ModeBanner, ModeExplanationModal, AddCalendarEventForm } from "@/components/dashboard/DashboardClientOnly";

const QuoteCard = dynamic(
  () => import("@/components/QuoteCard").then((m) => ({ default: m.QuoteCard })),
  { loading: () => <div className="glass-card min-h-[120px] animate-pulse rounded-[22px]" aria-hidden /> }
);

const RealityReportBlock = dynamic(
  () => import("@/components/RealityReportBlock").then((m) => ({ default: m.RealityReportBlock })),
  { loading: () => <div className="glass-card min-h-[100px] animate-pulse rounded-[22px]" aria-hidden /> }
);

const PatternInsightCard = dynamic(
  () => import("@/components/hq/PatternInsightCard").then((m) => ({ default: m.PatternInsightCard })),
  { loading: () => <div className="glass-card min-h-[80px] animate-pulse rounded-[22px]" aria-hidden /> }
);

const EnergyBudgetBar = dynamic(
  () => import("@/components/EnergyBudgetBar").then((m) => ({ default: m.EnergyBudgetBar })),
  { loading: () => <div className="h-3 w-full animate-pulse rounded-full bg-white/10" aria-hidden /> }
);
const AvoidanceNotice = dynamic(
  () => import("@/components/AvoidanceNotice").then((m) => ({ default: m.AvoidanceNotice })),
  { loading: () => null }
);
const FocusBlock = dynamic(
  () => import("@/components/FocusBlock").then((m) => ({ default: m.FocusBlock })),
  { loading: () => <div className="min-h-[80px] animate-pulse rounded-xl bg-white/5" aria-hidden /> }
);
const OnTrackCard = dynamic(
  () => import("@/components/OnTrackCard").then((m) => ({ default: m.OnTrackCard })),
  { loading: () => <div className="glass-card min-h-[60px] animate-pulse rounded-[22px]" aria-hidden /> }
);
const OnboardingBanner = dynamic(
  () => import("@/components/OnboardingBanner").then((m) => ({ default: m.OnboardingBanner })),
  { loading: () => null }
);
const UpcomingCalendarList = dynamic(
  () => import("@/components/UpcomingCalendarList").then((m) => ({ default: m.UpcomingCalendarList })),
  { loading: () => <div className="min-h-[60px] animate-pulse rounded-xl" aria-hidden /> }
);
const XPBadge = dynamic(
  () => import("@/components/XPBadge").then((m) => ({ default: m.XPBadge })),
  { loading: () => null }
);
const AnalyticsWeekWidget = dynamic(
  () => import("@/components/AnalyticsWeekWidget").then((m) => ({ default: m.AnalyticsWeekWidget })),
  { loading: () => <div className="glass-card min-h-[100px] animate-pulse rounded-[22px]" aria-hidden /> }
);
const AdaptiveSuggestionBanner = dynamic(
  () => import("@/components/AdaptiveSuggestionBanner").then((m) => ({ default: m.AdaptiveSuggestionBanner })),
  { loading: () => null }
);


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

function defaultSuggestion(energy: number, focus: number, load: number): string | null {
  if (load >= 70 && energy < 50) return "Pick one task. Reschedule the rest to reduce overwhelm.";
  if (focus >= 70) return "Use Focus block on Missions to lock in. 25 min is ideal.";
  if (energy >= 70 && focus < 40) return "Batch emails, admin, or routine items now.";
  if (new Date().getHours() >= 16) return "Wind-down tasks: light admin, reading, or planning tomorrow.";
  return "Check your first incomplete mission and start there.";
}

export default async function DashboardPage() {
  void ensureUserProfileForSession();
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  // One quote per calendar day: quote id = day of year (1–365)
  const quoteDay = Math.max(1, Math.min(365, getDayOfYearFromDateString(dateStr)));
  const yesterdayStr = yesterdayDate(dateStr);
  const [state, yesterdayState, quotesResult, mode, energyBudget, upcomingCalendarEvents, hasGoogle, learningStreak, prefs, xp] = await Promise.all([
    getDailyState(dateStr),
    getDailyState(yesterdayStr),
    Promise.all([
      getQuoteForDay(Math.max(1, quoteDay - 1)),
      getQuoteForDay(quoteDay),
      getQuoteForDay(Math.min(365, quoteDay + 1)),
    ]),
    getMode(dateStr),
    getEnergyBudget(dateStr),
    getUpcomingCalendarEvents(dateStr, 2),
    hasGoogleCalendarToken(),
    getLearningStreak(),
    getUserPreferencesOrDefaults(),
    getXP(),
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
  const [weekSummary, adaptiveSuggestions] = await Promise.all([
    getWeekSummary(thisWeekStart, thisWeekEnd, weeklyLearningTarget),
    getAdaptiveSuggestions(dateStr),
    upsertDailyAnalytics(dateStr),
  ]);
  const spendableCents = Math.max(0, (budgetSettings.monthly_budget_cents ?? 0) - (budgetSettings.monthly_savings_cents ?? 0));
  const budgetRemainingCents = budgetSettings.monthly_budget_cents != null ? spendableCents - currentMonthExpenses : null;

  const energyPct = scale1To10ToPct(state?.energy ?? null);
  const focusPct = scale1To10ToPct(state?.focus ?? null);
  const loadPct = scale1To10ToPct(state?.sensory_load ?? null);

  const learningNeeded = weeklyLearningMinutes < weeklyLearningTarget;
  const todaysTasks = (tasks ?? []).map((t) => ({
    id: (t as { id: string }).id,
    title: (t as { title: string }).title,
    carryOverCount: (t as { carry_over_count?: number }).carry_over_count ?? 0,
  }));
  const emptyMissionMessage = learningNeeded
    ? `${weeklyLearningTarget} min this week to stay on track. Log time on Growth.`
    : "Add a task on Missions or head to Growth.";
  const emptyMissionHref = learningNeeded ? "/learning" : "/tasks";
  const { window: timeWindow, isActive: isTimeWindowActive } = defaultTimeWindow();
  const insight = defaultInsight(energyPct, focusPct, loadPct);
  const patternSuggestion = defaultSuggestion(energyPct, focusPct, loadPct);

  const isMinimalUI = mode === "high_sensory";

  return (
    <div
      className={`flex flex-col -mt-1 ${isMinimalUI ? "minimal-ui" : ""}`}
      style={{ gap: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      data-minimal={isMinimalUI ? "true" : undefined}
    >
      {!isMinimalUI && <OnboardingBanner />}
      {!isMinimalUI && (
        <div className="flex justify-end">
          <XPBadge totalXp={xp.total_xp} level={xp.level} compact />
        </div>
      )}
      {/* Hero: mascot – emotion disabled; fixed Homepagemascotte.png */}
      <div className="flex flex-col gap-0 relative justify-center min-h-[65vh]">
        {!isMinimalUI && (
          <div className="hq-hero-mascot-wrap w-full pt-0" aria-hidden>
            <div className="hq-mascot-glow" />
            <div className="hq-mascot-img">
              <HeroMascotImage />
            </div>
          </div>
        )}
        <HQHeader
          energyPct={energyPct}
          focusPct={focusPct}
          loadPct={loadPct}
          copyVariant={adaptiveSuggestions.copyVariant}
        />
        {!isMinimalUI && (
          <div className="flex flex-col items-center gap-4 pt-2 pb-2">
            <div className="mission-wrapper w-full max-w-[320px]">
              <div className="glow-blur" aria-hidden />
              <div className="glass-border" aria-hidden />
              <Link
                href={todaysTasks.length > 0 ? "/tasks" : "/assistant"}
                className="mission-btn"
                aria-label={todaysTasks.length > 0 ? "Go to missions" : "Begin mission"}
              >
                BEGIN MISSION
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 w-full max-w-[320px] justify-items-center">
              <RadialMeter value={energyPct} label="ENERGY" variant="energy" thin />
              <RadialMeter value={focusPct} label="FOCUS" variant="focus" thin />
              <RadialMeter value={loadPct} label="LOAD" variant="warning" thin />
            </div>
          </div>
        )}
      </div>
      {!isMinimalUI && <HQShortcutGrid />}
      <BrainStatusCard
        date={dateStr}
        initial={{
          energy: state?.energy ?? null,
          focus: state?.focus ?? null,
          sensory_load: state?.sensory_load ?? null,
          sleep_hours: state?.sleep_hours ?? null,
          social_load: state?.social_load ?? null,
        }}
        yesterday={{
          energy: yesterdayState?.energy ?? null,
          focus: yesterdayState?.focus ?? null,
          sensory_load: yesterdayState?.sensory_load ?? null,
          sleep_hours: yesterdayState?.sleep_hours ?? null,
          social_load: yesterdayState?.social_load ?? null,
        }}
      />
      {(!isMinimalUI || energyBudget.remaining < 20) && (
      <EnergyBudgetBar
        remaining={energyBudget.remaining}
        capacity={energyBudget.capacity}
        suggestedTaskCount={energyBudget.suggestedTaskCount}
        taskUsed={energyBudget.taskUsed}
        completedTaskCount={energyBudget.completedTaskCount}
        taskPlanned={energyBudget.taskPlanned}
        calendarCost={energyBudget.calendarCost}
        energy={energyBudget.energy}
        focus={energyBudget.focus}
        load={energyBudget.load}
        insight={energyBudget.insight}
        segments={energyBudget.segments}
      />
      )}
      {!isMinimalUI && (
        <QuoteCard
          prev={{ quote: quotesResult[0], day: Math.max(1, quoteDay - 1) }}
          current={{ quote: quotesResult[1], day: quoteDay }}
          next={{ quote: quotesResult[2], day: Math.min(365, quoteDay + 1) }}
        />
      )}
      <ModeBanner mode={mode} />
      <ModeExplanationModal mode={mode} />
      <AvoidanceNotice carryOverCount={carryOverCount} />
      <ActiveMissionCard
        tasks={todaysTasks}
        emptyMessage={emptyMissionMessage}
        emptyHref={emptyMissionHref}
        timeWindow={timeWindow}
        isTimeWindowActive={isTimeWindowActive}
      />
      {mode === "driven" && !isMinimalUI && <FocusBlock />}
      {!isMinimalUI && (
      <section className="glass-card glass-card-glow-blue overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Calendar</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">Today and tomorrow. Events count toward your energy budget on that day.</p>
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
      )}
      {!isMinimalUI && strategy?.identity_statement && (
        <div className="glass-card glass-card-glow-purple p-4">
          <h2 className="text-sm font-semibold text-[var(--text-muted)]">This quarter</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)] italic">&ldquo;{strategy.identity_statement}&rdquo;</p>
        </div>
      )}
      {!isMinimalUI && (adaptiveSuggestions.themeSuggestion || adaptiveSuggestions.emotionSuggestion || adaptiveSuggestions.taskCountSuggestion != null) && (
        <AdaptiveSuggestionBanner suggestions={adaptiveSuggestions} />
      )}
      {!isMinimalUI && <AnalyticsWeekWidget summary={weekSummary} />}
      {!isMinimalUI && learningStreak >= 1 && (
        <div className="glass-card flex items-center gap-3 p-4">
          <span className="text-2xl" aria-hidden>🔥</span>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Learning streak</p>
            <p className="text-xs text-[var(--text-muted)]">{learningStreak} week{learningStreak !== 1 ? "s" : ""} in a row (≥{weeklyLearningTarget} min)</p>
          </div>
          <Link href="/learning" className="ml-auto text-sm font-medium text-[var(--accent-focus)] hover:underline">
            Growth →
          </Link>
        </div>
      )}
      {!isMinimalUI && budgetRemainingCents != null && (
        <Link
          href="/budget"
          className="glass-card flex items-center gap-3 p-4 transition-opacity hover:opacity-90"
        >
          <span className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
            {getCurrencySymbol(budgetSettings.currency)}
            {budgetRemainingCents >= 0 ? (budgetRemainingCents / 100).toFixed(0) : (Math.abs(budgetRemainingCents) / 100).toFixed(0)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)]">Budget remaining this month</p>
            <p className="text-xs text-[var(--text-muted)]">Spendable after savings</p>
          </div>
          <span className="ml-auto text-sm font-medium text-[var(--accent-focus)]">Budget →</span>
        </Link>
      )}
      {!isMinimalUI && (
      <OnTrackCard
        learningMinutes={weeklyLearningMinutes}
        learningTarget={weeklyLearningTarget}
        strategySet={!!(strategy?.identity_statement || strategy?.primary_theme)}
      />
      )}
      {!isMinimalUI && <RealityReportBlock report={lastWeekReport} />}
      {!isMinimalUI && <PatternInsightCard insight={insight} suggestion={patternSuggestion} detailsHref="/report" />}
    </div>
  );
}

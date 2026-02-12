import { getDayOfYear } from "date-fns";
import { getDailyState } from "@/app/actions/daily-state";
import { getTodaysTasks, getSubtasksForTaskIds, type TaskListMode } from "@/app/actions/tasks";
import { getQuoteForDay } from "@/app/actions/quote";
import { getEnergyBudget } from "@/app/actions/energy";
import { getMode } from "@/app/actions/mode";
import { getCalendarEventsForDate, hasGoogleCalendarToken, syncGoogleCalendarForDate } from "@/app/actions/calendar";
import { getFeatureFlags } from "@/app/actions/feature-flags";
import { DailyStateForm } from "@/components/DailyStateForm";
import { QuoteCard } from "@/components/QuoteCard";
import { EnergyBudgetBar } from "@/components/EnergyBudgetBar";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";
import { StrategyBlock } from "@/components/StrategyBlock";
import { CalendarEventsList } from "@/components/CalendarEventsList";
import { AddCalendarEventForm } from "@/components/AddCalendarEventForm";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { FocusBlock } from "@/components/FocusBlock";

export default async function DashboardPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const dayOfYear = getDayOfYear(today);

  const [state, quote, budget, mode, hasGoogle, flags] = await Promise.all([
    getDailyState(dateStr),
    getQuoteForDay(dayOfYear),
    getEnergyBudget(dateStr),
    getMode(dateStr),
    hasGoogleCalendarToken(),
    getFeatureFlags(),
  ]);
  if (hasGoogle) await syncGoogleCalendarForDate(dateStr);
  const calendarEvents = await getCalendarEventsForDate(dateStr);

  const taskMode: TaskListMode = mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks, carryOverCount } = await getTodaysTasks(dateStr, taskMode);
  const parentIds = tasks.map((t) => t.id);
  const subtaskRows = await getSubtasksForTaskIds(parentIds);
  const subtasksByParent: Record<string, typeof subtaskRows> = {};
  for (const s of subtaskRows) {
    const pid = s.parent_task_id;
    if (!subtasksByParent[pid]) subtasksByParent[pid] = [];
    subtasksByParent[pid].push(s);
  }

  const isHighSensory = mode === "high_sensory";
  const isDriven = mode === "driven";

  return (
    <div className={`space-y-6 ${isHighSensory ? "reduce-motion" : ""}`}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neuro-silver">Dashboard</h1>
        <p className="mt-0.5 text-sm text-neutral-400">{dateStr} · Your daily HQ</p>
      </div>

      <ModeBanner mode={mode} />

      <OnboardingBanner />

      {!isHighSensory && <StrategyBlock />}

      <DailyStateForm
        date={dateStr}
        initial={{
          energy: state?.energy ?? null,
          focus: state?.focus ?? null,
          sensory_load: state?.sensory_load ?? null,
          sleep_hours: state?.sleep_hours ?? null,
          social_load: state?.social_load ?? null,
        }}
      />

      {!isHighSensory && <QuoteCard quote={quote} />}

      {!isHighSensory && (
        <EnergyBudgetBar
          used={budget.used}
          remaining={budget.remaining}
          taskCost={budget.taskCost}
          calendarCost={budget.calendarCost}
        />
      )}

      {!isHighSensory && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-neuro-silver">Today&apos;s events</h2>
          <CalendarEventsList events={calendarEvents} />
          <AddCalendarEventForm date={dateStr} hasGoogleToken={hasGoogle} />
          {flags.calendar_integration && (
            <p className="mt-2 text-xs text-neutral-500">
              Google Calendar: connect in <a href="/settings" className="text-neuro-blue hover:underline">Settings</a>.
            </p>
          )}
        </section>
      )}

      {isDriven && <FocusBlock />}

      <section id="tasks" aria-label="Today's tasks">
      <TaskList
        date={dateStr}
        tasks={tasks as import("@/types/database.types").Task[]}
        mode={taskMode}
        carryOverCount={carryOverCount}
        subtasksByParent={subtasksByParent}
      />
      </section>
    </div>
  );
}

import { getDayOfYear } from "date-fns";
import { getDailyState } from "@/app/actions/daily-state";
import { getTodaysTasks, getCarryOverCountForDate } from "@/app/actions/tasks";
import { getQuoteForDay } from "@/app/actions/quote";
import { getEnergyBudget } from "@/app/actions/energy";
import { getMode } from "@/app/actions/mode";
import { DailyStateForm } from "@/components/DailyStateForm";
import { QuoteCard } from "@/components/QuoteCard";
import { EnergyBudgetBar } from "@/components/EnergyBudgetBar";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";

export default async function DashboardPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const dayOfYear = getDayOfYear(today);

  const [state, quote, budget, mode] = await Promise.all([
    getDailyState(dateStr),
    getQuoteForDay(dayOfYear),
    getEnergyBudget(dateStr),
    getMode(dateStr),
  ]);

  const { tasks, carryOverCount } = await getTodaysTasks(dateStr, mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : "normal");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neuro-silver">Dashboard</h1>
        <p className="text-sm text-neutral-400">{dateStr}</p>
      </div>

      <ModeBanner mode={mode} />

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

      <QuoteCard quote={quote} />

      <EnergyBudgetBar
        used={budget.used}
        remaining={budget.remaining}
        taskCost={budget.taskCost}
        calendarCost={budget.calendarCost}
      />

      <TaskList
        date={dateStr}
        tasks={tasks as import("@/types/database.types").Task[]}
        mode={mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : "normal"}
        carryOverCount={carryOverCount}
      />
    </div>
  );
}

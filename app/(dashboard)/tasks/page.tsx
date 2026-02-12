import { getDayOfYear } from "date-fns";
import { getTasksForDate } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { getCarryOverCountForDate } from "@/app/actions/tasks";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";

export default async function TasksPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const mode = await getMode(dateStr);
  const tasks = await getTasksForDate(dateStr);
  const carryOverCount = await getCarryOverCountForDate(dateStr);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neuro-silver">Tasks</h1>
        <p className="text-sm text-neutral-400">{dateStr}</p>
      </div>
      <ModeBanner mode={mode} />
      <TaskList
        date={dateStr}
        tasks={tasks as import("@/types/database.types").Task[]}
        mode={mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : "normal"}
        carryOverCount={carryOverCount}
      />
    </div>
  );
}

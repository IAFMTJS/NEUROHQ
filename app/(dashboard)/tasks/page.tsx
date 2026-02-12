import { getTodaysTasks, getSubtasksForTaskIds, type TaskListMode } from "@/app/actions/tasks";
import { getMode } from "@/app/actions/mode";
import { TaskList } from "@/components/TaskList";
import { ModeBanner } from "@/components/ModeBanner";

export default async function TasksPage() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);
  const mode = await getMode(dateStr);
  const taskMode: TaskListMode = mode === "stabilize" ? "stabilize" : mode === "low_energy" ? "low_energy" : mode === "driven" ? "driven" : "normal";
  const { tasks, carryOverCount } = await getTodaysTasks(dateStr, taskMode);
  const subtaskRows = await getSubtasksForTaskIds(tasks.map((t) => t.id));
  const subtasksByParent: Record<string, typeof subtaskRows> = {};
  for (const s of subtaskRows) {
    const pid = s.parent_task_id;
    if (!subtasksByParent[pid]) subtasksByParent[pid] = [];
    subtasksByParent[pid].push(s);
  }

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
        mode={taskMode}
        carryOverCount={carryOverCount}
        subtasksByParent={subtasksByParent}
      />
    </div>
  );
}

import type { ReactNode } from "react";
import { TasksTabsShellClient } from "@/components/missions/TasksTabsShellClient";
import type { TasksTabId } from "@/components/missions/tasksTabTypes";

export type { TasksTabId } from "@/components/missions/tasksTabTypes";

type Props = {
  initialTab: TasksTabId;
  missionsHref: string;
  calendarHref: string;
  routineHref: string;
  header: ReactNode;
  /** Always loaded with calendar & routine so tab switches stay instant (client-side visibility only). */
  panelMissions: ReactNode;
  panelCalendar: ReactNode;
  panelRoutine: ReactNode;
  fillViewport?: boolean;
  stickyTabs?: boolean;
};

export function TasksTabsShell({
  initialTab,
  missionsHref,
  calendarHref,
  routineHref,
  header,
  panelMissions,
  panelCalendar,
  panelRoutine,
  fillViewport = false,
  stickyTabs = false,
}: Props) {
  return (
    <TasksTabsShellClient
      initialTab={initialTab}
      missionsHref={missionsHref}
      calendarHref={calendarHref}
      routineHref={routineHref}
      header={header}
      panelMissions={panelMissions}
      panelCalendar={panelCalendar}
      panelRoutine={panelRoutine}
      fillViewport={fillViewport}
      stickyTabs={stickyTabs}
    />
  );
}

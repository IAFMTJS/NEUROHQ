/**
 * Help content structure: sections keyed by topic for table-of-contents and "See also" links.
 * When adding or changing a feature, update the relevant section and bump lastUpdated.
 */

export const HELP_LAST_UPDATED = "2025-03-15";

export type HelpSection = {
  id: string;
  title: string;
  /** Route to link to (e.g. /tasks, /budget) for "See also" */
  route?: string;
};

export const HELP_SECTIONS: HelpSection[] = [
  { id: "dashboard", title: "Dashboard", route: "/dashboard" },
  { id: "tasks", title: "Missions & taken", route: "/tasks" },
  { id: "backlog", title: "Backlog", route: "/tasks" },
  { id: "calendar", title: "Calendar", route: "/tasks?tab=calendar" },
  { id: "routine", title: "Routine", route: "/tasks?tab=routine" },
  { id: "streaks", title: "Streaks" },
  { id: "assistant", title: "Assistant", route: "/assistant" },
  { id: "settings", title: "Settings", route: "/settings" },
  { id: "budget", title: "Budget", route: "/budget" },
  { id: "xp", title: "XP & identity", route: "/xp" },
  { id: "insights", title: "Insights", route: "/report" },
];

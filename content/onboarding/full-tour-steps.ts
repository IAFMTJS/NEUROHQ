import type { TutorialStep } from "./types";

/** Full System Tour — per-page, ~35 steps. Concise explanations. */
export const FULL_TOUR_STEPS: TutorialStep[] = [
  // —— Dashboard: Home & Brain Status ——
  {
    id: "full-welcome",
    route: "/dashboard",
    title: "Welcome to the HQ",
    body: "This is your command centre. Key cards show level, missions and brain status.",
  },
  {
    id: "full-brain-status-card",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-card\"]",
    actionId: "brain-status-save",
    title: "Brain Status",
    body: "Update Brain Status every day so your energy budget stays accurate.",
  },
  {
    id: "full-brain-energy",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-energy\"]",
    title: "Energy",
    body: "Energy represents your available cognitive capacity for the day.",
  },
  {
    id: "full-brain-focus",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-focus\"]",
    title: "Focus",
    body: "Focus affects how many missions you can do well at once.",
  },
  {
    id: "full-brain-load",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-load\"]",
    title: "Mental load",
    body: "Load represents mental pressure; high load reduces your capacity.",
  },
  {
    id: "full-active-missions",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-active-missions\"]",
    title: "Active missions",
    body: "Today’s missions appear here. Tap to focus or complete.",
  },
  // —— Budget ——
  {
    id: "full-budget-hero",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-hero\"]",
    title: "Budget overview",
    body: "See how much you have left to spend this period. Set budget and savings in settings.",
  },
  {
    id: "full-budget-payday",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-payday\"]",
    title: "Payday",
    body: "Mark when you get paid so the app knows your budget period.",
  },
  {
    id: "full-budget-entries",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-entries\"]",
    title: "Entries",
    body: "Log income and expenses here. They count toward your remaining budget.",
  },
  {
    id: "full-budget-goals",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-goals\"]",
    title: "Savings goals",
    body: "Set goals and track progress. Savings are reserved from your budget.",
  },
  // —— Missions ——
  {
    id: "full-tasks-today",
    route: "/tasks",
    targetSelector: "[data-tutorial=\"tasks-today\"]",
    title: "Missions",
    body: "Add and complete tasks for today. Use tabs for calendar, backlog and routines.",
  },
  {
    id: "full-tasks-list",
    route: "/tasks",
    targetSelector: "[data-tutorial=\"tasks-list\"]",
    title: "Task list",
    body: "Your tasks with focus, complete and snooze. Completing gives XP and affects your streak.",
  },
  // —— Growth / Learning ——
  {
    id: "full-growth-content",
    route: "/learning",
    targetSelector: "[data-tutorial=\"growth-content\"]",
    title: "Growth",
    body: "Learning intent, streams and consistency. Track books and weekly goals.",
  },
  // —— XP (optional short step) ——
  {
    id: "full-xp",
    route: "/xp",
    targetSelector: "[data-tutorial=\"xp-content\"]",
    title: "XP Command Center",
    body: "Extra missions, identity and analytics. XP drives your level and rank.",
  },
  // —— Strategy ——
  {
    id: "full-strategy",
    route: "/strategy",
    targetSelector: "[data-tutorial=\"strategy-content\"]",
    title: "Strategy",
    body: "Quarterly strategy, key results and check-ins. Align missions with your goals.",
  },
  // —— Settings ——
  {
    id: "full-settings-account",
    route: "/settings",
    targetSelector: "[data-tutorial=\"settings-account\"]",
    title: "Settings",
    body: "Account, display, timezone, notifications, budget and calendar. All in one place.",
  },
  {
    id: "full-settings-push",
    route: "/settings",
    targetSelector: "[data-tutorial=\"settings-push\"]",
    title: "Push notifications",
    body: "Enable push for daily quotes and reminders. Set quiet hours and notification times.",
  },
];

import type { TutorialStep } from "./types";

/** Full System Tour — walks through every main page and major card. Concise explanations. */
export const FULL_TOUR_STEPS: TutorialStep[] = [
  // —— Dashboard: overview and command ——
  {
    id: "full-welcome",
    route: "/dashboard",
    title: "Welcome to the HQ",
    body: "This is your command centre. We’ll walk through each main area and card so you know what everything does.",
  },
  {
    id: "full-command-bridge",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-command-bridge\"]",
    title: "Command bridge",
    body: "Your daily headline: energy, focus and load at a glance, plus a link to today’s missions. Tap the mission link to jump to tasks.",
  },
  {
    id: "full-level-progress",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-level-progress\"]",
    title: "Level & progress",
    body: "Your XP level, rank and streak. Completing missions gives XP; consistency keeps your streak. Momentum shows how you’re trending.",
  },
  {
    id: "full-active-missions",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-active-missions\"]",
    title: "Active missions",
    body: "Today’s tasks appear here. Start a mission to focus, complete it for XP. Add more from the Missions page.",
  },
  {
    id: "full-dcic",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-dcic\"]",
    title: "Commander status (DCIC)",
    body: "Game-style status: discipline, consistency, impact. Your choices in the app affect this; it’s used for insights and suggestions.",
  },
  {
    id: "full-today-engine",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-today-engine\"]",
    title: "Vandaag door de app bepaald",
    body: "The app’s view of today: bucketed focus, streak risk and XP forecast. It adapts to your Brain Status and completed missions.",
  },
  // —— Brain Status (required action) ——
  {
    id: "full-brain-status-section",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-brain-status-section\"]",
    title: "Brain Status",
    body: "Your daily check-in drives everything: energy budget, mission count and suggestions. Update it every day. Do it now to continue.",
    actionId: "brain-status-save",
    requireAction: true,
    actionHint: "Open \"Update check-in\", set energy and focus, then save. Then click Next to continue.",
  },
  {
    id: "full-brain-energy",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-energy\"]",
    title: "Energy",
    body: "Energy is your available cognitive capacity. Low energy means fewer suggested missions; high energy allows more.",
  },
  {
    id: "full-brain-focus",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-focus\"]",
    title: "Focus",
    body: "Focus affects how many missions you can do well at once. The app suggests a number of tasks based on this and energy.",
  },
  {
    id: "full-brain-load",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-load\"]",
    title: "Mental load",
    body: "Load is mental pressure. High load reduces your effective capacity; the app may suggest recovery or fewer missions.",
  },
  {
    id: "full-energy-bar",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-energy-bar\"]",
    title: "Energy budget bar",
    body: "Shows how much of your daily “budget” you’ve used: tasks completed, planned and calendar cost. Stay within the bar to avoid overload.",
  },
  {
    id: "full-context-card",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"dashboard-context-card\"]",
    title: "Context & quote",
    body: "Daily quote and identity context. Your strategy and mode (e.g. driven vs recovery) are reflected here.",
  },
  // —— Budget ——
  {
    id: "full-budget-hero",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-hero\"]",
    title: "Budget overview",
    body: "How much you have left to spend this period. Set your total budget and savings in Settings; this shows what’s left after expenses.",
  },
  {
    id: "full-budget-payday",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-payday\"]",
    title: "Payday",
    body: "Mark when you get paid so the app knows your budget period (e.g. month from payday to payday). Use “Vandaag loon gehad” when you receive income.",
  },
  {
    id: "full-budget-entries",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-entries\"]",
    title: "Entries",
    body: "All income and expenses in the period. Log everything here; they count toward your remaining budget and reports.",
  },
  {
    id: "full-budget-goals",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-goals\"]",
    title: "Savings goals",
    body: "Set goals and track progress. Savings are reserved from your budget first, so you know what’s left to spend.",
  },
  // —— Missions ——
  {
    id: "full-tasks-today",
    route: "/tasks",
    targetSelector: "[data-tutorial=\"tasks-today\"]",
    title: "Missions",
    body: "Add and complete tasks for today. Use the tabs for calendar, backlog and routines. Today’s list is the main view.",
  },
  {
    id: "full-tasks-list",
    route: "/tasks",
    targetSelector: "[data-tutorial=\"tasks-list\"]",
    title: "Task list",
    body: "Each task can be focused, completed or snoozed. Completing gives XP and affects your streak. Plan a realistic number based on your Brain Status.",
  },
  // —— Growth / Learning ——
  {
    id: "full-growth-content",
    route: "/learning",
    targetSelector: "[data-tutorial=\"growth-content\"]",
    title: "Growth",
    body: "Learning intent, streams (e.g. books) and consistency. Set weekly goals and reflect. Growth ties into your identity and long-term progress.",
  },
  // —— XP ——
  {
    id: "full-xp",
    route: "/profile",
    targetSelector: "[data-tutorial=\"xp-content\"]",
    title: "XP (in Profile)",
    body: "XP drives your level and rank. In Profile you can see your progress + forecast; deeper analytics live in Report.",
  },
  // —— Strategy ——
  {
    id: "full-strategy",
    route: "/strategy",
    targetSelector: "[data-tutorial=\"strategy-content\"]",
    title: "Strategy",
    body: "Quarterly strategy, key results and check-ins. Align daily missions with your goals and review alignment over time.",
  },
  // —— Settings ——
  {
    id: "full-settings-account",
    route: "/settings",
    targetSelector: "[data-tutorial=\"settings-account\"]",
    title: "Settings",
    body: "Account, display, timezone, notifications, budget and calendar. Everything is configurable in one place.",
  },
  {
    id: "full-settings-push",
    route: "/settings",
    targetSelector: "[data-tutorial=\"settings-push\"]",
    title: "Push notifications",
    body: "Enable push for daily quotes and reminders. Set quiet hours and choose when you want to be notified.",
  },
];

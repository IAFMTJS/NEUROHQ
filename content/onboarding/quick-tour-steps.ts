import type { TutorialStep } from "./types";

/** Quick Tour — max 6 steps, ~2 minutes. */
export const QUICK_TOUR_STEPS: TutorialStep[] = [
  {
    id: "quick-brain-status",
    route: "/dashboard",
    targetSelector: "[data-tutorial=\"brain-status-card\"]",
    actionId: "brain-status-save",
    title: "Brain Status",
    body: "Update your energy, focus and mental load here every day. The app uses this to suggest how many missions you can handle.",
  },
  {
    id: "quick-budget",
    route: "/budget",
    targetSelector: "[data-tutorial=\"budget-hero\"]",
    title: "Budget",
    body: "Track spending, set a budget and savings goals. Log expenses and see how much you have left in your period.",
  },
  {
    id: "quick-missions",
    route: "/tasks",
    targetSelector: "[data-tutorial=\"tasks-today\"]",
    title: "Missions",
    body: "Your daily tasks live here. Add missions, complete them and keep your backlog under control.",
  },
  {
    id: "quick-growth",
    route: "/learning",
    targetSelector: "[data-tutorial=\"growth-content\"]",
    title: "Growth",
    body: "Set learning goals, track consistency and reflect. Growth ties into your identity and long-term progress.",
  },
  {
    id: "quick-settings",
    route: "/settings",
    targetSelector: "[data-tutorial=\"settings-account\"]",
    title: "Settings",
    body: "Configure account, display, timezone, notifications, budget and calendar. Everything is in one place.",
  },
  {
    id: "quick-push",
    route: "/settings",
    targetSelector: "[data-tutorial=\"settings-push\"]",
    title: "Push notifications",
    body: "Enable push for daily quotes and reminders. You can set quiet hours and choose when to get notified.",
  },
];
